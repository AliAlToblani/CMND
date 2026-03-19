/**
 * send-smtp-email — Supabase Edge Function
 *
 * Generic SMTP email sender. Accepts a JSON body and sends the email
 * through the configured SMTP server via the shared smtpEmail utility.
 *
 * POST /functions/v1/send-smtp-email
 * Authorization: Bearer <user-jwt>
 *
 * Body:
 * {
 *   to: string | string[],
 *   subject: string,
 *   html?: string,            // raw HTML — use this OR template
 *   template?: {              // use this OR html
 *     title: string,
 *     bodyHtml: string,
 *     ctaLabel?: string,
 *     ctaUrl?: string
 *   },
 *   cc?: string | string[],
 *   bcc?: string | string[]
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, buildEmailTemplate } from "../_shared/smtpEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 255;
}

function normalizeEmails(value: unknown): string[] | null {
  if (typeof value === "string") {
    return isValidEmail(value.trim()) ? [value.trim()] : null;
  }
  if (Array.isArray(value)) {
    const emails = value.map((e: unknown) =>
      typeof e === "string" ? e.trim() : ""
    );
    return emails.every(isValidEmail) ? emails : null;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authentication ────────────────────────────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return json({ error: "Server configuration error" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized: missing Authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("send-smtp-email: invalid token", authError?.message);
      return json({ error: "Unauthorized: invalid token" }, 401);
    }

    // Only admins may invoke this function directly
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return json({ error: "Unauthorized: could not verify role" }, 401);
    }

    if (profile.role !== "admin") {
      return json({ error: "Forbidden: admin access required" }, 403);
    }
    // ── End Authentication ────────────────────────────────────────────────────

    // ── Input validation ──────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    // to — required
    const to = normalizeEmails(body.to);
    if (!to) {
      return json({ error: "'to' must be a valid email or array of emails" }, 400);
    }

    // subject — required
    if (!body.subject || typeof body.subject !== "string" || !body.subject.trim()) {
      return json({ error: "'subject' is required" }, 400);
    }
    const subject = body.subject.trim().slice(0, 998); // RFC 5322 limit

    // html — either raw html or template must be provided
    let html: string;

    if (body.template && typeof body.template === "object") {
      const t = body.template as Record<string, unknown>;
      if (!t.title || typeof t.title !== "string") {
        return json({ error: "template.title is required" }, 400);
      }
      if (!t.bodyHtml || typeof t.bodyHtml !== "string") {
        return json({ error: "template.bodyHtml is required" }, 400);
      }
      html = buildEmailTemplate({
        title: t.title,
        bodyHtml: t.bodyHtml,
        ctaLabel: typeof t.ctaLabel === "string" ? t.ctaLabel : undefined,
        ctaUrl: typeof t.ctaUrl === "string" ? t.ctaUrl : undefined,
      });
    } else if (body.html && typeof body.html === "string") {
      html = body.html;
    } else {
      return json({ error: "Either 'html' or 'template' must be provided" }, 400);
    }

    // cc / bcc — optional
    const cc = body.cc ? normalizeEmails(body.cc) ?? undefined : undefined;
    const bcc = body.bcc ? normalizeEmails(body.bcc) ?? undefined : undefined;

    if (body.cc && !cc) {
      return json({ error: "'cc' contains an invalid email address" }, 400);
    }
    if (body.bcc && !bcc) {
      return json({ error: "'bcc' contains an invalid email address" }, 400);
    }
    // ── End Input validation ──────────────────────────────────────────────────

    console.log(`send-smtp-email: sending to ${to.join(", ")} | subject: ${subject}`);

    await sendEmail({ to, subject, html, cc, bcc });

    console.log("send-smtp-email: sent successfully");

    return json({ success: true, sentTo: to.length }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("send-smtp-email: error —", message);
    return json({ error: message }, 500);
  }
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
