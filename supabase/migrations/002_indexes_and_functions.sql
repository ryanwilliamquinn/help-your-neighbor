-- Performance indexes and utility functions
-- Second migration for Supabase

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_group_id ON public.requests(group_id);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON public.requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_needed_by ON public.requests(needed_by);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire old requests
CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS void AS $$
BEGIN
  UPDATE public.requests
  SET status = 'expired'
  WHERE status = 'open'
    AND needed_by < NOW();
END;
$$ LANGUAGE 'plpgsql';

-- Function to clean up old unused invites
CREATE OR REPLACE FUNCTION cleanup_old_invites()
RETURNS void AS $$
BEGIN
  DELETE FROM public.invites
  WHERE expires_at < NOW()
    AND used_at IS NULL;
END;
$$ LANGUAGE 'plpgsql';

-- Note: User profiles are now created explicitly in the signup API call
-- No automatic triggers needed - this provides better error handling and control