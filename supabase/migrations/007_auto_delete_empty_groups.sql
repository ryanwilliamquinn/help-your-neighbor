-- Auto-delete empty groups migration
-- Seventh migration for Supabase

-- Function to delete groups with no members
CREATE OR REPLACE FUNCTION cleanup_empty_groups()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the group that lost a member has any remaining members
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = OLD.group_id
  ) THEN
    -- No members left, delete the group
    DELETE FROM public.groups WHERE id = OLD.group_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Trigger to run cleanup when a group member is deleted
CREATE TRIGGER cleanup_empty_groups_trigger
  AFTER DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_empty_groups();

-- Function to handle leaving a group (removes member and cleans up)
CREATE OR REPLACE FUNCTION leave_group(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  member_count INTEGER;
BEGIN
  -- Check if user is actually a member
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  ) THEN
    RETURN FALSE; -- User is not a member
  END IF;

  -- Remove the user from the group
  DELETE FROM public.group_members
  WHERE group_id = p_group_id AND user_id = p_user_id;

  -- The trigger will automatically clean up empty groups
  RETURN TRUE;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to remove a member from a group (for group owners)
CREATE OR REPLACE FUNCTION remove_group_member(p_group_id UUID, p_user_to_remove UUID, p_requesting_user UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if requesting user is the group owner
  IF NOT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND created_by = p_requesting_user
  ) THEN
    RETURN FALSE; -- User is not the group owner
  END IF;

  -- Don't allow owner to remove themselves (they should use leave_group or transfer ownership)
  IF p_requesting_user = p_user_to_remove THEN
    RETURN FALSE;
  END IF;

  -- Check if target user is actually a member
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_to_remove
  ) THEN
    RETURN FALSE; -- User is not a member
  END IF;

  -- Remove the user from the group
  DELETE FROM public.group_members
  WHERE group_id = p_group_id AND user_id = p_user_to_remove;

  -- The trigger will automatically clean up empty groups
  RETURN TRUE;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to create a group and automatically add creator as member
CREATE OR REPLACE FUNCTION create_group_with_member(p_name TEXT, p_creator_id UUID)
RETURNS UUID AS $$
DECLARE
  new_group_id UUID;
BEGIN
  -- Create the group
  INSERT INTO public.groups (name, created_by)
  VALUES (p_name, p_creator_id)
  RETURNING id INTO new_group_id;

  -- Add creator as a member
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (new_group_id, p_creator_id);

  RETURN new_group_id;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;