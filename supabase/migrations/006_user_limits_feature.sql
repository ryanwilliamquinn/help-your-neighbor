-- User limits feature migration
-- Sixth migration for Supabase

-- User limits table (configurable limits per user)
CREATE TABLE IF NOT EXISTS public.user_limits (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  max_open_requests INTEGER NOT NULL DEFAULT 5,
  max_groups_created INTEGER NOT NULL DEFAULT 3,
  max_groups_joined INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for user limits
CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON public.user_limits(user_id);

-- Row Level Security for user limits
ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own limits" ON public.user_limits
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own limits" ON public.user_limits
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert own limits" ON public.user_limits
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Function to get user limits
CREATE OR REPLACE FUNCTION get_user_limits(p_user_id UUID)
RETURNS TABLE(
  user_id UUID,
  max_open_requests INTEGER,
  max_groups_created INTEGER,
  max_groups_joined INTEGER
) AS $$
BEGIN
  -- Check if record exists, insert if not
  PERFORM 1 FROM public.user_limits WHERE public.user_limits.user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_limits (user_id) VALUES (p_user_id);
  END IF;

  -- Return the limits
  RETURN QUERY
  SELECT ul.user_id, ul.max_open_requests, ul.max_groups_created, ul.max_groups_joined
  FROM public.user_limits ul
  WHERE ul.user_id = p_user_id;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to get current user counts
CREATE OR REPLACE FUNCTION get_user_counts(p_user_id UUID)
RETURNS TABLE(
  open_requests_count INTEGER,
  groups_created_count INTEGER,
  groups_joined_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM public.requests r WHERE r.user_id = p_user_id AND r.status = 'open'),
    (SELECT COUNT(*)::INTEGER FROM public.groups g WHERE g.created_by = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.group_members gm WHERE gm.user_id = p_user_id);
END;
$$ LANGUAGE 'plpgsql';

-- Function to check if user can create request
CREATE OR REPLACE FUNCTION can_create_request(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  SELECT open_requests_count INTO current_count
  FROM get_user_counts(p_user_id) ul;

  SELECT max_open_requests INTO max_limit
  FROM get_user_limits(p_user_id) ul;

  RETURN current_count < max_limit;
END;
$$ LANGUAGE 'plpgsql';

-- Function to check if user can create group
CREATE OR REPLACE FUNCTION can_create_group(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  SELECT groups_created_count INTO current_count
  FROM get_user_counts(p_user_id) ul;

  SELECT max_groups_created INTO max_limit
  FROM get_user_limits(p_user_id) ul;

  RETURN current_count < max_limit;
END;
$$ LANGUAGE 'plpgsql';

-- Function to check if user can join group
CREATE OR REPLACE FUNCTION can_join_group(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  SELECT groups_joined_count INTO current_count
  FROM get_user_counts(p_user_id) ul;

  SELECT max_groups_joined INTO max_limit
  FROM get_user_limits(p_user_id) ul;

  RETURN current_count < max_limit;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger for updated_at on user_limits
CREATE TRIGGER update_user_limits_updated_at BEFORE UPDATE ON public.user_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();