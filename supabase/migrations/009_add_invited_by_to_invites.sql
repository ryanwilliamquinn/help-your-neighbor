-- Add invited_by column to invites table
-- This migration adds proper tracking of who sent each invitation

-- Since there are no real invitations yet, we can clear existing test data first
DELETE FROM public.invites;

-- Add the invited_by column as NOT NULL directly
ALTER TABLE public.invites
ADD COLUMN invited_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_invites_invited_by ON public.invites(invited_by);
CREATE INDEX IF NOT EXISTS idx_invites_email_expires ON public.invites(email, expires_at) WHERE used_at IS NULL;

-- Update RLS policies for invites table if they exist
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.invites;
DROP POLICY IF EXISTS "Users can create invitations for their groups" ON public.invites;
DROP POLICY IF EXISTS "Users can update their own invitations" ON public.invites;

-- RLS policies
CREATE POLICY "Users can view their own invitations" ON public.invites
  FOR SELECT USING (email = auth.email() OR invited_by = auth.uid());

CREATE POLICY "Users can create invitations for their groups" ON public.invites
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = invites.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sent invitations" ON public.invites
  FOR UPDATE USING (invited_by = auth.uid());

CREATE POLICY "Users can update invitations sent to them" ON public.invites
  FOR UPDATE USING (email = auth.email());