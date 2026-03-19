/**
 * test-notification — Temporary Supabase Edge Function
 *
 * Sends a test email to the requesting user's email address.
 * Used to verify SMTP configuration is working end-to-end.
 *
 * DELETE THIS FUNCTION once email delivery is confirmed working.
 *
 * POST /functions/v1/test-notification
 * Authorization: Bearer <user-jwt>
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, buildEmailTemplate } from "../_shared/smtpEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !user) {
    return json({ error: "Unauthorized: invalid token" }, 401);
  }

  // Fetch the user's name from profiles
  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const recipientEmail = profile?.email ?? user.email ?? "";
  const recipientName  = profile?.full_name ?? recipientEmail;

  if (!recipientEmail) {
    return json({ error: "Could not determine recipient email" }, 400);
  }

  try {
    const html = buildEmailTemplate({
      title: "CMND Notification Test",
      bodyHtml: `
        <p style="margin:0 0 16px;">Hi <strong>${escapeHtml(recipientName)}</strong>,</p>
        <p style="margin:0 0 16px;">
          If you received this email, your SMTP email notifications are
          <strong style="color:#22c55e;">working correctly!</strong>
        </p>
        <p style="margin:0;color:#718096;font-size:14px;">
          You can now delete the <code>test-notification</code> edge function
          and this endpoint from your project.
        </p>
      `,
    });

    await sendEmail({
      to: recipientEmail,
      subject: "CMND Notification Test",
      html,
    });

    return json({
      success: true,
      message: `Test email sent to ${recipientEmail}`,
      recipient: recipientEmail,
    }, 200);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("test-notification: SMTP error —", message);
    return json({ error: message }, 500);
  }
});

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
