-- ============================================
-- Fix RLS Policies
-- ============================================
-- This script fixes two RLS issues discovered during testing:
-- 1. email_templates should not be readable by anonymous users
-- 2. participants should be insertable by anonymous users (for registration)

-- ============================================
-- FIX 1: Email Templates - Remove public access
-- ============================================

-- Drop any existing policies that might allow public access
DROP POLICY IF EXISTS "Public can view templates" ON public.email_templates;
DROP POLICY IF EXISTS "Anyone can view templates" ON public.email_templates;

-- Verify only the correct policies exist:
-- 1. Hosts can view/manage their own event templates
-- 2. Admins can view all templates

-- Recreate the correct policies (if they don't exist)
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'email_templates'
        AND policyname = 'Hosts can view own event templates'
    ) THEN
        CREATE POLICY "Hosts can view own event templates"
          ON public.email_templates FOR SELECT
          USING (
            event_id IN (
              SELECT id FROM public.events WHERE host_user_id = auth.uid()
            )
          );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'email_templates'
        AND policyname = 'Hosts can manage own event templates'
    ) THEN
        CREATE POLICY "Hosts can manage own event templates"
          ON public.email_templates FOR ALL
          USING (
            event_id IN (
              SELECT id FROM public.events WHERE host_user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- ============================================
-- FIX 2: Participants - Allow anonymous insertion
-- ============================================

-- The policy should already exist from the migration, but let's verify and recreate if needed
DROP POLICY IF EXISTS "Anyone can insert participants" ON public.participants;

-- Recreate the policy to allow anonymous registration
CREATE POLICY "Anyone can insert participants"
  ON public.participants FOR INSERT
  WITH CHECK (true);

-- Also verify the SELECT policy for session-based participants exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'participants'
        AND policyname = 'Session participants are publicly readable'
    ) THEN
        CREATE POLICY "Session participants are publicly readable"
          ON public.participants FOR SELECT
          USING (session_id IS NOT NULL);
    END IF;
END $$;

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the policies are correct:

-- Check all policies on email_templates
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'email_templates';

-- Check all policies on participants
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'participants'
ORDER BY policyname;

-- Test participant insertion (should work without auth)
-- INSERT INTO participants (event_id, name, email)
-- SELECT id, 'Test User', 'test@example.com'
-- FROM events WHERE status = 'live' LIMIT 1;
