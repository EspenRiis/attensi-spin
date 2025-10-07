-- ============================================
-- Winner History Table
-- ============================================
-- Tracks permanent history of all winners with timestamps
-- Even if winner status is restored/undone, history remains

CREATE TABLE public.winner_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  participant_name text NOT NULL,
  won_at timestamptz NOT NULL DEFAULT now(),

  -- Optional: link to participant if they still exist
  participant_id uuid REFERENCES public.participants(id) ON DELETE SET NULL,

  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.winner_history ENABLE ROW LEVEL SECURITY;

-- Event hosts can view winner history for their events
CREATE POLICY "Hosts can view own event winner history"
  ON public.winner_history FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE host_user_id = auth.uid()
    )
  );

-- System can insert winner history (via trigger or application)
CREATE POLICY "Anyone can insert winner history"
  ON public.winner_history FOR INSERT
  WITH CHECK (true);

-- Admins can view all
CREATE POLICY "Admins can view all winner history"
  ON public.winner_history FOR ALL
  USING (auth.jwt() ->> 'email' = 'espsva@attensi.com');

-- Index for faster queries
CREATE INDEX idx_winner_history_event_id ON public.winner_history(event_id);
CREATE INDEX idx_winner_history_won_at ON public.winner_history(won_at);

-- ============================================
-- NOTES:
-- ============================================
-- This table provides permanent audit trail of winners
-- Even if someone is "restored to wheel" (is_winner = false),
-- their win is still recorded here with timestamp
--
-- Future features could include:
-- - Winner history page showing all past winners
-- - Analytics (who won most, when, etc.)
-- - Export winner history to CSV
