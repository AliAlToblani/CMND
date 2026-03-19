/**
 * notify-event — Supabase Edge Function
 *
 * Fires email notifications for platform events (new customer, new contract).
 * Callable by ANY authenticated user — no admin role required.
 * Runs fire-and-forget: always returns 202 immediately after validation so the
 * caller is never blocked by email delivery.
 *
 * POST /functions/v1/notify-event
 * Authorization: Bearer <user-jwt>
 *
 * Body (new-customer):
 *   { event: "new-customer", customerId: string, customerName: string }
 *
 * Body (new-contract):
 *   { event: "new-contract", contractId: string, customerId: string,
 *     customerName: string, contractName: string,
 *     contractValue: number, paymentFrequency: string }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, buildEmailTemplate } from "../_shared/smtpEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Types ───────────────────────────────────────────────────────────────────

type EventType = "new-customer" | "new-contract";

interface NewCustomerPayload {
  event: "new-customer";
  customerId: string;
  customerName: string;
}

interface NewContractPayload {
  event: "new-contract";
  contractId: string;
  customerId: string;
  customerName: string;
  contractName: string;
  contractValue: number;
  paymentFrequency: string;
}

type EventPayload = NewCustomerPayload | NewContractPayload;

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Server configuration error" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");

  // Admin client (service role) — used for DB writes and recipient queries
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify the caller's JWT
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !user) {
    return json({ error: "Unauthorized: invalid token" }, 401);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let payload: EventPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!payload?.event) {
    return json({ error: "Missing event type" }, 400);
  }

  // Validate known events
  const knownEvents: EventType[] = ["new-customer", "new-contract"];
  if (!knownEvents.includes(payload.event)) {
    return json({ error: `Unknown event: ${payload.event}` }, 400);
  }

  // ── Acknowledge immediately — email runs in background ───────────────────
  // We respond 202 right away so the caller is never blocked.
  const responsePromise = new Response(
    JSON.stringify({ accepted: true }),
    { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );

  // Fire the actual work async (Deno EdgeRuntime keeps the isolate alive
  // long enough to complete the background work after the response is sent).
  EdgeRuntime.waitUntil(
    processEvent(payload, user, adminClient).catch((err) =>
      console.error("notify-event: unhandled background error —", err)
    )
  );

  return responsePromise;
});

// ─── Main processing ──────────────────────────────────────────────────────────

async function processEvent(
  payload: EventPayload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerUser: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any
): Promise<void> {
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://cmnd.doo.ooo";

  // Get the name of the person who triggered the event
  const { data: triggerProfile } = await adminClient
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", triggerUser.id)
    .single();

  const triggeredBy: string =
    triggerProfile?.full_name || triggerProfile?.email || triggerUser.email || "A team member";

  // Route recipients based on who triggered the event:
  //   batelco event → everyone who has batelco_notifications toggled ON
  //   main portal event → non-batelco users only
  const isBatelcoEvent = triggerProfile?.role === "batelco";

  let recipientQuery = adminClient
    .from("profiles")
    .select("id, email, full_name, role, notifications_enabled, notification_preferences")
    .eq("notifications_enabled", true);

  if (!isBatelcoEvent) {
    recipientQuery = recipientQuery.neq("role", "batelco");
  }

  const { data: allRecipients, error: recipientError } = await recipientQuery;

  // For batelco events, only keep users who opted in to batelco notifications
  const recipients = isBatelcoEvent
    ? (allRecipients ?? []).filter((r: any) => r.notification_preferences?.batelco_notifications === true)
    : allRecipients;

  if (recipientError) {
    console.error("notify-event: failed to fetch recipients —", recipientError.message);
    return;
  }

  if (!recipients || recipients.length === 0) {
    console.log("notify-event: no eligible recipients, skipping.");
    return;
  }

  // Build event-specific email content
  let subject: string;
  let emailHtml: string;
  let logType: string;
  let relatedEntityType: string;
  let relatedEntityId: string;
  let relatedEntityName: string;

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (payload.event === "new-customer") {
    const { customerId } = payload;
    // Resolve customer name from DB if not provided (defensive)
    let customerName = payload.customerName;
    if (!customerName) {
      const { data: c } = await adminClient.from("customers").select("name").eq("id", customerId).single();
      customerName = c?.name ?? "Unknown Customer";
    }
    const viewUrl = `${siteUrl}/lifecycle/${customerId}`;

    subject = `New Customer Added — ${customerName}`;
    logType = "new-customer";
    relatedEntityType = "customer";
    relatedEntityId = customerId;
    relatedEntityName = customerName;

    emailHtml = buildEmailTemplate({
      title: `New Customer Added`,
      bodyHtml: `
        <p style="margin:0 0 16px;">A new customer has been added to <strong>CMND</strong>.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;color:#718096;font-size:14px;width:40%;">Customer</td>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;font-size:14px;font-weight:600;color:#1a1a2e;">${escapeHtml(customerName)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;color:#718096;font-size:14px;">Added by</td>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;font-size:14px;color:#1a1a2e;">${escapeHtml(triggeredBy)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#718096;font-size:14px;">Date added</td>
            <td style="padding:10px 0;font-size:14px;color:#1a1a2e;">${dateStr}</td>
          </tr>
        </table>
      `,
      ctaLabel: "View Customer in CMND",
      ctaUrl: viewUrl,
    });

  } else {
    // new-contract
    const {
      contractId,
      customerId,
      contractName,
      contractValue,
      paymentFrequency,
    } = payload;

    // Resolve customer name from DB if caller didn't supply it
    let customerName = (payload as NewContractPayload).customerName;
    if (!customerName) {
      const { data: c } = await adminClient.from("customers").select("name").eq("id", customerId).single();
      customerName = c?.name ?? "Unknown Customer";
    }

    const formattedValue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(contractValue || 0);

    const freqLabel: Record<string, string> = {
      annual: "Annual",
      "semi-annual": "Semi-Annual",
      quarterly: "Quarterly",
      monthly: "Monthly",
      "one-time": "One-Time",
    };
    const freqDisplay = freqLabel[paymentFrequency] ?? paymentFrequency;

    const viewUrl = `${siteUrl}/customers/${customerId}`;

    subject = `New Contract Created — ${customerName} — ${contractName}`;
    logType = "new-contract";
    relatedEntityType = "contract";
    relatedEntityId = contractId;
    relatedEntityName = `${customerName} — ${contractName}`;

    emailHtml = buildEmailTemplate({
      title: `New Contract Created`,
      bodyHtml: `
        <p style="margin:0 0 16px;">A new contract has been created in <strong>CMND</strong>.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;color:#718096;font-size:14px;width:40%;">Customer</td>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;font-size:14px;font-weight:600;color:#1a1a2e;">${escapeHtml(customerName)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;color:#718096;font-size:14px;">Contract</td>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;font-size:14px;color:#1a1a2e;">${escapeHtml(contractName)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;color:#718096;font-size:14px;">Value</td>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;font-size:14px;font-weight:600;color:#1a1a2e;">${formattedValue}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;color:#718096;font-size:14px;">Billing</td>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;font-size:14px;color:#1a1a2e;">${escapeHtml(freqDisplay)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;color:#718096;font-size:14px;">Created by</td>
            <td style="padding:10px 0;border-bottom:1px solid #e8eaf0;font-size:14px;color:#1a1a2e;">${escapeHtml(triggeredBy)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#718096;font-size:14px;">Date</td>
            <td style="padding:10px 0;font-size:14px;color:#1a1a2e;">${dateStr}</td>
          </tr>
        </table>
      `,
      ctaLabel: "View Contract in CMND",
      ctaUrl: viewUrl,
    });
  }

  // Filter by per-type preference (default true if not set)
  const prefKey = payload.event === "new-customer" ? "new_customer" : "new_contract";
  const filteredRecipients = recipients.filter((r: any) => {
    const prefs = r.notification_preferences;
    return !prefs || prefs[prefKey] !== false;
  });

  if (filteredRecipients.length === 0) {
    console.log(`notify-event: no recipients opted in to ${prefKey}, skipping.`);
    return;
  }

  // Send to each recipient and log the result
  // at@doo.ooo is BCC'd only on the first email so they get one copy per event
  let bccSent = false;
  const sendPromises = filteredRecipients.map(
    async (recipient: { id: string; email: string; full_name?: string }) => {
      const logBase = {
        notification_type: logType,
        recipient_email: recipient.email,
        recipient_name: recipient.full_name ?? null,
        related_entity_type: relatedEntityType,
        related_entity_name: relatedEntityName,
        related_entity_id: relatedEntityId,
      };

      const bcc = !bccSent ? "at@doo.ooo" : undefined;
      bccSent = true;

      try {
        await sendEmail({
          to: recipient.email,
          subject,
          html: emailHtml,
          ...(bcc && { bcc }),
        });

        await adminClient.from("notification_logs").insert({
          ...logBase,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        console.log(`notify-event: sent ${logType} to ${recipient.email}`);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`notify-event: failed sending to ${recipient.email} —`, errMsg);

        await adminClient.from("notification_logs").insert({
          ...logBase,
          status: "failed",
          sent_at: new Date().toISOString(),
          error_message: errMsg.slice(0, 500),
        });
      }
    }
  );

  await Promise.all(sendPromises);
  console.log(`notify-event: finished processing ${logType} for ${filteredRecipients.length} recipient(s).`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Deno type augmentation for EdgeRuntime.waitUntil
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };
