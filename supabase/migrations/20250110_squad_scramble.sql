-- ============================================
-- Squad Scramble (Team Generator) Migration
-- ============================================
-- This migration adds support for the Squad Scramble team generator tool
-- Date: 2025-01-10
-- Feature: Multi-tool platform expansion

-- ============================================
-- 1. UPDATE EVENTS TABLE
-- ============================================
-- Add available_tools column to track which tools are enabled per event
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS available_tools text[] DEFAULT '{wheel}';

-- Update existing events to include both tools
UPDATE public.events
SET available_tools = '{wheel, squad_scramble}'
WHERE available_tools = '{wheel}';

-- ============================================
-- 2. TEAM GENERATIONS TABLE
-- ============================================
-- Stores each team generation attempt with its configuration
CREATE TABLE public.team_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to either event (paid) or session (free)
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  session_id text,

  -- Generation configuration
  mode text NOT NULL CHECK (mode IN ('team_count', 'team_size')),
  team_count int CHECK (team_count IS NULL OR team_count > 0),
  team_size int CHECK (team_size IS NULL OR team_size > 0),

  -- Results metadata
  actual_teams_created int NOT NULL,
  total_participants int NOT NULL,
  is_current boolean DEFAULT true, -- Latest generation

  created_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT generation_event_or_session CHECK (
    (event_id IS NOT NULL AND session_id IS NULL) OR
    (event_id IS NULL AND session_id IS NOT NULL)
  ),
  CONSTRAINT generation_mode_config CHECK (
    (mode = 'team_count' AND team_count IS NOT NULL AND team_size IS NULL) OR
    (mode = 'team_size' AND team_size IS NOT NULL AND team_count IS NULL)
  )
);

-- Enable RLS
ALTER TABLE public.team_generations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert generations (for free tier)
CREATE POLICY "Anyone can insert team generations"
  ON public.team_generations FOR INSERT
  WITH CHECK (true);

-- Hosts can view generations for their events
CREATE POLICY "Hosts can view own event team generations"
  ON public.team_generations FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE host_user_id = auth.uid()
    )
  );

-- Hosts can update generations for their events
CREATE POLICY "Hosts can update own event team generations"
  ON public.team_generations FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE host_user_id = auth.uid()
    )
  );

-- Hosts can delete generations from their events
CREATE POLICY "Hosts can delete own event team generations"
  ON public.team_generations FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE host_user_id = auth.uid()
    )
  );

-- Free tier: Allow read/write for session-based generations
CREATE POLICY "Session team generations are publicly readable"
  ON public.team_generations FOR SELECT
  USING (session_id IS NOT NULL);

CREATE POLICY "Session team generations can be updated"
  ON public.team_generations FOR UPDATE
  USING (session_id IS NOT NULL);

CREATE POLICY "Session team generations can be deleted"
  ON public.team_generations FOR DELETE
  USING (session_id IS NOT NULL);

-- Indexes
CREATE INDEX idx_team_generations_event ON public.team_generations(event_id);
CREATE INDEX idx_team_generations_session ON public.team_generations(session_id);
CREATE INDEX idx_team_generations_current ON public.team_generations(is_current) WHERE is_current = true;

-- ============================================
-- 3. TEAMS TABLE
-- ============================================
-- Stores individual teams for each generation
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES public.team_generations(id) ON DELETE CASCADE,

  team_number int NOT NULL,
  team_name text NOT NULL,
  color_scheme jsonb NOT NULL DEFAULT '{
    "bg": "from-purple-500 to-pink-500",
    "border": "purple-400",
    "text": "white"
  }'::jsonb,

  created_at timestamptz DEFAULT now(),

  CONSTRAINT teams_unique_number_per_generation UNIQUE(generation_id, team_number)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Anyone can insert teams (for free tier)
CREATE POLICY "Anyone can insert teams"
  ON public.teams FOR INSERT
  WITH CHECK (true);

-- Anyone can read teams if they can read the generation
CREATE POLICY "Teams are readable with generation"
  ON public.teams FOR SELECT
  USING (
    generation_id IN (
      SELECT id FROM public.team_generations
    )
  );

-- Teams can be updated if the generation can be updated
CREATE POLICY "Teams can be updated with generation"
  ON public.teams FOR UPDATE
  USING (
    generation_id IN (
      SELECT id FROM public.team_generations
    )
  );

-- Teams can be deleted if the generation can be deleted
CREATE POLICY "Teams can be deleted with generation"
  ON public.teams FOR DELETE
  USING (
    generation_id IN (
      SELECT id FROM public.team_generations
    )
  );

-- Indexes
CREATE INDEX idx_teams_generation ON public.teams(generation_id);

-- ============================================
-- 4. TEAM MEMBERS TABLE
-- ============================================
-- Stores participant assignments to teams
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,

  is_captain boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),

  UNIQUE(team_id, participant_id) -- Can't be on same team twice
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Anyone can insert team members (for free tier)
CREATE POLICY "Anyone can insert team members"
  ON public.team_members FOR INSERT
  WITH CHECK (true);

-- Anyone can read team members if they can read the team
CREATE POLICY "Team members are readable with team"
  ON public.team_members FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM public.teams
    )
  );

-- Team members can be updated if the team can be updated
CREATE POLICY "Team members can be updated with team"
  ON public.team_members FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM public.teams
    )
  );

-- Team members can be deleted if the team can be deleted
CREATE POLICY "Team members can be deleted with team"
  ON public.team_members FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM public.teams
    )
  );

-- Indexes
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_participant ON public.team_members(participant_id);
CREATE INDEX idx_team_members_captain ON public.team_members(is_captain) WHERE is_captain = true;

-- ============================================
-- 5. HELPER FUNCTION
-- ============================================
-- Function to mark previous generations as not current when a new one is created
CREATE OR REPLACE FUNCTION public.mark_previous_generations_not_current()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new generation is marked as current
  IF NEW.is_current = true THEN
    -- Mark all other generations for the same event/session as not current
    IF NEW.event_id IS NOT NULL THEN
      UPDATE public.team_generations
      SET is_current = false
      WHERE event_id = NEW.event_id
        AND id != NEW.id
        AND is_current = true;
    ELSIF NEW.session_id IS NOT NULL THEN
      UPDATE public.team_generations
      SET is_current = false
      WHERE session_id = NEW.session_id
        AND id != NEW.id
        AND is_current = true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically manage is_current flag
CREATE TRIGGER trigger_mark_previous_generations_not_current
  AFTER INSERT OR UPDATE OF is_current ON public.team_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_previous_generations_not_current();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Squad Scramble tables and policies are now ready!
-- Next steps:
-- 1. Build Squad Scramble UI components
-- 2. Implement team generation algorithms
-- 3. Create cross-tool participant sharing
