-- Create activity_logs table to track user actions
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'customer', 'contract', 'user', 'partnership', etc.
  entity_id TEXT,
  entity_name TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view all logs
CREATE POLICY "Authenticated users can view activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow service role to insert logs
CREATE POLICY "Service role can insert activity logs"
  ON activity_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy to allow authenticated users to insert their own logs
CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE activity_logs IS 'Tracks user actions across the platform for audit and activity feed';

