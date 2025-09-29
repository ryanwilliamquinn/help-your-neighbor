-- Email preferences feature migration
-- Creates tables for user email preferences and email send logging

-- User email preferences table
CREATE TABLE user_email_preferences (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  frequency VARCHAR(20) NOT NULL DEFAULT 'disabled' CHECK (frequency IN ('disabled', 'daily', 'immediate')),
  last_daily_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for daily email processing
CREATE INDEX idx_email_prefs_daily ON user_email_preferences(frequency, last_daily_sent)
WHERE frequency = 'daily';

-- Email send log table for tracking sent emails
CREATE TABLE email_send_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL,
  request_ids UUID[] NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_provider_id VARCHAR(255)
);

-- Index for email send log queries
CREATE INDEX idx_email_send_log_user_id ON email_send_log(user_id);
CREATE INDEX idx_email_send_log_sent_at ON email_send_log(sent_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_email_preferences_updated_at
    BEFORE UPDATE ON user_email_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for user_email_preferences
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own email preferences
CREATE POLICY "Users can view their own email preferences" ON user_email_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences" ON user_email_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences" ON user_email_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email preferences" ON user_email_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for email_send_log
ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own email send logs
CREATE POLICY "Users can view their own email send logs" ON email_send_log
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert email send logs (for scheduled functions)
CREATE POLICY "Service role can insert email send logs" ON email_send_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');