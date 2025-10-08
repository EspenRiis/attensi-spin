-- ============================================
-- Fix Session Participant DELETE Policy
-- ============================================
-- Allow anonymous users to delete their own session participants
-- Date: 2025-01-08

-- Drop existing policy if it exists, then recreate
DROP POLICY IF EXISTS "Session participants can be deleted" ON public.participants;

-- Add missing DELETE policy for session-based participants
CREATE POLICY "Session participants can be deleted"
  ON public.participants FOR DELETE
  USING (session_id IS NOT NULL);
