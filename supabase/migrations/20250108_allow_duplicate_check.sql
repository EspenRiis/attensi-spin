-- Secure duplicate name checking for event registration
-- This function allows anonymous users to check if a name exists in an event
-- without exposing any participant data

-- Create a function that checks if a name exists in an event or session
CREATE OR REPLACE FUNCTION check_duplicate_name(
  p_name text,
  p_event_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
AS $$
BEGIN
  -- Check if name exists in the specified event or session
  -- Case-insensitive comparison
  IF p_event_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.participants
      WHERE event_id = p_event_id
      AND LOWER(name) = LOWER(p_name)
    );
  ELSIF p_session_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.participants
      WHERE session_id = p_session_id
      AND LOWER(name) = LOWER(p_name)
    );
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Grant execute permission to anonymous users and authenticated users
GRANT EXECUTE ON FUNCTION check_duplicate_name(text, uuid, text) TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION check_duplicate_name IS 'Checks if a participant name already exists in an event or session. Returns true if duplicate exists, false otherwise. Used for registration validation without exposing participant data.';
