
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('lifecycle', 'customer', 'deadline', 'contract', 'team')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  related_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add trigger for updated_at on notifications
CREATE TRIGGER update_notifications_modtime
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Make sure the staff table has proper role column
ALTER TABLE public.staff 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('admin', 'user'));

-- Create integration_settings table to store settings for integrations
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_type TEXT NOT NULL UNIQUE CHECK (integration_type IN ('hubspot', 'slack')),
  settings JSONB,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add trigger for updated_at on integration_settings
CREATE TRIGGER update_integration_settings_modtime
BEFORE UPDATE ON public.integration_settings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insert default HubSpot integration settings
INSERT INTO public.integration_settings (integration_type, settings, is_enabled)
VALUES ('hubspot', '{"sync_customers": true, "sync_deals": true}', true)
ON CONFLICT (integration_type) DO NOTHING;

-- Insert default Slack integration settings
INSERT INTO public.integration_settings (integration_type, settings, is_enabled)
VALUES ('slack', '{"notify_lifecycle": true, "notify_deadline": true, "notify_contract": true, "notify_team": true}', true)
ON CONFLICT (integration_type) DO NOTHING;
