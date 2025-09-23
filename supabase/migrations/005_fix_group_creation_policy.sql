-- Fix group creation RLS policy
-- Fifth migration for Supabase

-- Drop and recreate the group creation policy to ensure it's correct
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Also ensure the groups view policy uses our helper function
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;

CREATE POLICY "Users can view groups they belong to" ON public.groups
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    public.user_is_group_member(id)
  );