-- Fix participant insertion for anonymous users
-- This allows public registration via QR codes

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Anyone can insert participants" ON public.participants;

-- Create the policy with explicit role specification
-- 'anon' is the Supabase role for unauthenticated users
CREATE POLICY "Anyone can insert participants"
  ON public.participants
  FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (true);

-- Verify the policy was created
SELECT
    policyname,
    cmd as command,
    roles,
    with_check
FROM pg_policies
WHERE tablename = 'participants'
  AND policyname = 'Anyone can insert participants';
