-- Row Level Security Policies
-- Third migration for Supabase

-- Users: Users can only see and update their own profile
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Groups: Users can only see groups they belong to
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups they belong to" ON public.groups
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Group Members: Users can see members of groups they belong to
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group members of their groups" ON public.group_members
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups via invite" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Group creators can remove members" ON public.group_members
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    group_id IN (
      SELECT id FROM public.groups
      WHERE created_by = auth.uid()
    )
  );

-- Requests: Users can see requests from groups they belong to
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requests from their groups" ON public.requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create requests in their groups" ON public.requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id AND
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own requests" ON public.requests
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Group members can claim requests" ON public.requests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own requests" ON public.requests
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Invites: Users can see invites for groups they created
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group creators can manage invites" ON public.invites
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    group_id IN (
      SELECT id FROM public.groups
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can view invites by token" ON public.invites
  FOR SELECT USING (true);