
import { supabase } from "@/integrations/supabase/client";

export interface NotificationData {
  type: 'lifecycle' | 'customer' | 'deadline' | 'contract' | 'team';
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
}

/**
 * Create a notification in the database and trigger email notifications
 */
export const createNotification = async (notificationData: NotificationData) => {
  try {
    // Store notification in database
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        is_read: false,
        related_id: notificationData.related_id,
        related_type: notificationData.related_type
      })
      .select();

    if (error) throw error;

    // Send email notification
    await sendEmailNotification(notificationData);

    // Send Slack notification if applicable
    await sendSlackNotification(notificationData);

    return data;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Send email notification to appropriate team members
 */
const sendEmailNotification = async (notificationData: NotificationData) => {
  try {
    // Call edge function to send email
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        notification: notificationData
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send email notification');
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending email notification:", error);
    // We don't want to throw here as it would prevent the notification from being created
    // Just log the error and continue
  }
};

/**
 * Send a notification to Slack
 */
const sendSlackNotification = async (notificationData: NotificationData) => {
  try {
    // Call edge function to send Slack notification
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-slack-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        notification: notificationData
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send Slack notification');
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    // We don't want to throw here as it would prevent the notification from being created
    // Just log the error and continue
  }
};
