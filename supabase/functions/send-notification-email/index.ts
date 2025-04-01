
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationData {
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
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get request body
    const { notification } = await req.json() as EmailRequest;

    if (!notification) {
      throw new Error("Notification data is required");
    }

    // Fetch admin emails
    const adminEmails = await getAdminEmails();

    // If no admins found, throw error
    if (adminEmails.length === 0) {
      throw new Error("No admin emails found for notification");
    }

    // Build email content based on notification type
    const emailContent = buildEmailContent(notification);

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Customer Center <notifications@doocommand.com>",
        to: adminEmails,
        subject: notification.title,
        html: emailContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Function to get all admin emails from the database
async function getAdminEmails(): Promise<string[]> {
  try {
    // Replace with your actual Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const response = await fetch(`${supabaseUrl}/rest/v1/staff?role=eq.admin&select=email`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch admin emails");
    }

    const admins = await response.json();
    return admins.map((admin: { email: string }) => admin.email);
  } catch (error) {
    console.error("Error fetching admin emails:", error);
    // Return a default email in case of error
    return ["admin@example.com"];
  }
}

// Function to build email content based on notification type
function buildEmailContent(notification: NotificationData): string {
  let typeIcon = "📌";
  let typeColor = "#6366F1";
  
  switch (notification.type) {
    case "lifecycle":
      typeIcon = "🔄";
      typeColor = "#3B82F6";
      break;
    case "customer":
      typeIcon = "👥";
      typeColor = "#10B981";
      break;
    case "deadline":
      typeIcon = "⏰";
      typeColor = "#F59E0B";
      break;
    case "contract":
      typeIcon = "📄";
      typeColor = "#8B5CF6";
      break;
    case "team":
      typeIcon = "👤";
      typeColor = "#EC4899";
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${notification.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: ${typeColor};
          padding: 20px;
          color: white;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 5px 5px;
        }
        .icon {
          font-size: 24px;
          margin-right: 10px;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #888;
          font-size: 12px;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: ${typeColor};
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="icon">${typeIcon}</span> ${notification.title}</h1>
        </div>
        <div class="content">
          <p>${notification.message}</p>
          <a href="#" class="button">View in Customer Center</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from Customer Center. Please do not reply to this email.</p>
          <p>© 2023 DOO Command. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
