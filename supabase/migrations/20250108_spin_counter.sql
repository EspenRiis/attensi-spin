-- ============================================
-- Spin Counter - Global Statistics
-- ============================================
-- Track total number of wheel spins across all sessions and events
-- Date: 2025-01-08

-- Create app statistics table with a single row
CREATE TABLE public.app_statistics (
  id integer PRIMARY KEY DEFAULT 1,
  total_spins bigint NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),

  -- Ensure only one row exists
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert the initial row
INSERT INTO public.app_statistics (id, total_spins) VALUES (1, 0);

-- Enable RLS
ALTER TABLE public.app_statistics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the statistics (for landing page display)
CREATE POLICY "Anyone can view app statistics"
  ON public.app_statistics FOR SELECT
  USING (true);

-- Create function to increment spin counter
CREATE OR REPLACE FUNCTION increment_spin_counter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
BEGIN
  UPDATE public.app_statistics
  SET total_spins = total_spins + 1,
      updated_at = now()
  WHERE id = 1;
END;
$$;

-- Grant execute permission to all users (authenticated and anonymous)
GRANT EXECUTE ON FUNCTION increment_spin_counter() TO anon, authenticated;

-- Create index for faster queries (though single row, good practice)
CREATE INDEX idx_app_statistics_id ON public.app_statistics(id);
