-- Fix group creation RLS policy
-- Fifth migration for Supabase

-- Drop and recreate the group creation policy to ensure it's correct
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid()::text = created_by::text
  );

-- Drop old policies and create working group view policy
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;
DROP POLICY IF EXISTS "Users can view their own groups" ON public.groups;

CREATE POLICY "Users can view groups they belong to" ON public.groups
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- User created the group
      auth.uid()::text = created_by::text
      OR
      -- User is a member of the group
      EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = groups.id
        AND gm.user_id = auth.uid()
      )
    )
  );