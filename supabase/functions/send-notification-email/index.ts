import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, buildEmailTemplate } from "../_shared/smtpEmail.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface NotificationData {
  type: 'lifecycle' | 'customer' | 'deadline' | 'contract' | 'team';
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
}

interface EmailRequest {
  notification: NotificationData;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============ AUTHENTICATION ============
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("send-notification-email: Invalid token or user not found", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`send-notification-email: Authenticated user ${user.id}`);
    // ============ END AUTHENTICATION ============

    console.log("Processing email notification request");
    
    const { notification }: EmailRequest = await req.json();
    console.log("Notification data:", notification);

    // Get users who want email notifications for this type
    const emailRecipients = await getEmailRecipients(notification.type, supabaseAdmin);
    console.log("Email recipients:", emailRecipients);

    if (emailRecipients.length === 0) {
      console.log("No users want email notifications for this type, skipping email");
      return new Response(
        JSON.stringify({ message: "No users have email notifications enabled for this type" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build email content using shared DOO-branded template
    const emailContent = buildEmailTemplate({
      title: notification.title,
      bodyHtml: `<p>${notification.message}</p>`,
    });

    // Send email via SMTP
    await sendEmail({
      to: emailRecipients,
      subject: `[CMND] ${notification.title}`,
      html: emailContent,
    });

    console.log("Email sent successfully via SMTP");

    return new Response(
      JSON.stringify({
        success: true,
        sentTo: emailRecipients.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error("Error sending notification email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEmailRecipients(_notificationType: string, supabaseClient: any): Promise<string[]> {
  try {
    // Recipient rules for main CMND portal notifications:
    //   1. notifications_enabled = true
    //   2. role must NOT be 'batelco' (batelco-only users don't get main portal emails)
    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('email, role, notifications_enabled')
      .eq('notifications_enabled', true)
      .neq('role', 'batelco');

    if (error) {
      console.error("Error fetching notification recipients:", error);
      return [];
    }

    const emails = (profiles || [])
      .map((p: { email: string }) => p.email)
      .filter(Boolean) as string[];

    console.log(`getEmailRecipients: ${emails.length} eligible recipient(s)`);
    return emails;
  } catch (error) {
    console.error("Error in getEmailRecipients:", error);
    return [];
  }
}

// Email content is now handled by the shared buildEmailTemplate utility.
