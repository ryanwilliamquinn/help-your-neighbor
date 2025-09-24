-- Fix RLS recursion issues
-- Fourth migration for Supabase

-- Create helper functions to avoid recursion in RLS policies
-- These functions use SECURITY DEFINER to bypass RLS during execution

CREATE OR REPLACE FUNCTION public.user_is_group_member(target_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = target_group_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_created_group(target_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM groups
    WHERE id = target_group_id
      AND created_by = auth.uid()
  );
$$;

-- Fix group_members policies to avoid recursion
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;

CREATE POLICY "Users can view group members of their groups" ON public.group_members
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    public.user_is_group_member(group_id)
  );

-- Fix groups policies to use the helper function
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;

CREATE POLICY "Users can view groups they belong to" ON public.groups
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    public.user_is_group_member(id)
  );

-- Fix requests policies to use the helper function
DROP POLICY IF EXISTS "Users can view requests from their groups" ON public.requests;
DROP POLICY IF EXISTS "Users can create requests in their groups" ON public.requests;
DROP POLICY IF EXISTS "Group members can claim requests" ON public.requests;

CREATE POLICY "Users can view requests from their groups" ON public.requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    public.user_is_group_member(group_id)
  );

CREATE POLICY "Users can create requests in their groups" ON public.requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id AND
    public.user_is_group_member(group_id)
  );

CREATE POLICY "Group members can claim requests" ON public.requests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    public.user_is_group_member(group_id)
  );

-- Fix invites policies to use the helper function
DROP POLICY IF EXISTS "Group creators can manage invites" ON public.invites;

CREATE POLICY "Group creators can manage invites" ON public.invites
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    public.user_created_group(group_id)
  );