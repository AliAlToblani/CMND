/**
 * CMND by DOO — Shared SMTP Email Utility
 *
 * Uses Nodemailer over raw SMTP (no third-party email API required).
 *
 * Required environment variables (set via `supabase secrets set`):
 *   SMTP_HOST       — e.g. smtp.gmail.com | smtp.zoho.com
 *   SMTP_PORT       — e.g. 587 (STARTTLS) or 465 (SSL)
 *   SMTP_USER       — sending address, e.g. notifications@doo.ooo
 *   SMTP_PASS       — app password / email password
 *   SMTP_FROM_NAME  — display name, e.g. "CMND by DOO"
 */

import nodemailer from "npm:nodemailer@6";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailTemplateOptions {
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

// ---------------------------------------------------------------------------
// SMTP transporter (created once, reused across calls in the same invocation)
// ---------------------------------------------------------------------------

function createTransporter() {
  const host = Deno.env.get("SMTP_HOST");
  const port = parseInt(Deno.env.get("SMTP_PORT") ?? "587", 10);
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP configuration incomplete. Ensure SMTP_HOST, SMTP_USER, and SMTP_PASS are set."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for SSL (465), false for STARTTLS (587)
    auth: { user, pass },
    tls: {
      // Accept self-signed certs in dev; remove for strict prod validation
      rejectUnauthorized: false,
    },
  });
}

// ---------------------------------------------------------------------------
// sendEmail — primary utility function
// ---------------------------------------------------------------------------

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const fromName = Deno.env.get("SMTP_FROM_NAME") ?? "CMND by DOO";
  const fromAddress = Deno.env.get("SMTP_USER");

  if (!fromAddress) {
    throw new Error("SMTP_USER is not set — cannot determine sender address.");
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    ...(options.cc && {
      cc: Array.isArray(options.cc) ? options.cc.join(", ") : options.cc,
    }),
    ...(options.bcc && {
      bcc: Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc,
    }),
  });
}

// ---------------------------------------------------------------------------
// buildEmailTemplate — professional DOO-branded HTML template
// ---------------------------------------------------------------------------

export function buildEmailTemplate(options: EmailTemplateOptions): string {
  const { title, bodyHtml, ctaLabel, ctaUrl } = options;
  const year = new Date().getFullYear();
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://cmnd.doo.ooo";

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 32px auto;">
        <tr>
          <td align="center">
            <a href="${encodeURI(ctaUrl)}"
               target="_blank"
               style="display:inline-block;background:#9B87F5;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:0.3px;">
              ${escapeHtml(ctaLabel)}
            </a>
          </td>
        </tr>
      </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-body { padding: 24px 16px !important; }
      .email-header { padding: 28px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(title)} — CMND by DOO</span>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Email container -->
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td class="email-header"
                style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:36px 40px;text-align:center;">
              <!-- Logo mark -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
                <tr>
                  <td style="background:#9B87F5;border-radius:10px;padding:10px 14px;display:inline-block;">
                    <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">CMND</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#a0aec0;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;">by DOO</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding: 40px 40px 32px;">

              <!-- Title -->
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1a1a2e;line-height:1.3;">
                ${escapeHtml(title)}
              </h1>

              <!-- Divider -->
              <div style="height:3px;width:48px;background:#9B87F5;border-radius:2px;margin-bottom:24px;"></div>

              <!-- Dynamic body content -->
              <div style="color:#4a5568;font-size:15px;line-height:1.7;">
                ${bodyHtml}
              </div>

              <!-- CTA button -->
              ${ctaBlock}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fc;border-top:1px solid #e8eaf0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#718096;">
                Sent from <strong style="color:#1a1a2e;">CMND by DOO</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#a0aec0;">
                <a href="${encodeURI(siteUrl)}" style="color:#9B87F5;text-decoration:none;">${siteUrl}</a>
                &nbsp;·&nbsp;
                <a href="${encodeURI(siteUrl + "/settings")}" style="color:#a0aec0;text-decoration:none;">Notification settings</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#cbd5e0;">
                &copy; ${year} DOO. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email container -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
