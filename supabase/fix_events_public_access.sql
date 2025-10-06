-- Allow public (unauthenticated) users to view live events for registration
-- This is needed so participants can access the registration form

CREATE POLICY "Anyone can view live events"
  ON public.events FOR SELECT
  USING (status = 'live');
