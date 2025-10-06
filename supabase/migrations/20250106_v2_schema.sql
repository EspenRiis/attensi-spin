-- ============================================
-- Attensi Spin v2.0 Database Migration
-- ============================================
-- This migration creates the complete schema for the v2.0 event management platform
-- Date: 2025-01-06
-- Reference: PRD-V2.md

-- ============================================
-- USERS TABLE (managed by Supabase Auth)
-- ============================================
-- Supabase creates auth.users automatically
-- We extend it with a public.user_profiles table

CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (auth.jwt() ->> 'email' = 'espsva@attensi.com');


-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'ended', 'archived')),

  -- Form configuration (which fields to show)
  form_config jsonb NOT NULL DEFAULT '{
    "fields": {
      "name": {"enabled": true, "required": true, "label": "Name"},
      "email": {"enabled": true, "required": true, "label": "Email"},
      "organization": {"enabled": true, "required": false, "label": "Organization"},
      "phone": {"enabled": false, "required": false, "label": "Phone"},
      "custom1": {"enabled": false, "required": false, "label": "Custom Field 1"},
      "custom2": {"enabled": false, "required": false, "label": "Custom Field 2"}
    },
    "consent_text": "I consent to receive marketing emails"
  }'::jsonb,

  -- Branding configuration
  branding_config jsonb NOT NULL DEFAULT '{
    "primary_color": "#00D9FF",
    "logo_url": null,
    "show_attensi_branding": true
  }'::jsonb,

  -- Display settings
  anonymous_display boolean NOT NULL DEFAULT false,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  started_at timestamptz,
  ended_at timestamptz,

  -- Indexes
  CONSTRAINT events_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Hosts can manage their own events
CREATE POLICY "Hosts can view own events"
  ON public.events FOR SELECT
  USING (auth.uid() = host_user_id);

CREATE POLICY "Hosts can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = host_user_id);

CREATE POLICY "Hosts can delete own events"
  ON public.events FOR DELETE
  USING (auth.uid() = host_user_id);

-- Admins can view all events
CREATE POLICY "Admins can view all events"
  ON public.events FOR ALL
  USING (auth.jwt() ->> 'email' = 'espsva@attensi.com');

-- Index for faster queries
CREATE INDEX idx_events_host_user_id ON public.events(host_user_id);
CREATE INDEX idx_events_status ON public.events(status);


-- ============================================
-- PARTICIPANTS TABLE (Updated)
-- ============================================
-- Drop existing table and recreate with new schema
DROP TABLE IF EXISTS public.participants CASCADE;

CREATE TABLE public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to either event (paid) or session (free)
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  session_id text,  -- For free tier (anonymous sessions)

  -- Participant data
  name text NOT NULL,
  display_name text,  -- Optional: What shows on wheel (if different from name)
  email text,
  organization text,
  phone text,
  custom_field_1 text,
  custom_field_2 text,

  -- Consent and marketing
  consent_marketing boolean DEFAULT false,

  -- Winner tracking
  is_winner boolean DEFAULT false,
  won_at timestamptz,
  winner_email_sent_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT participant_event_or_session CHECK (
    (event_id IS NOT NULL AND session_id IS NULL) OR
    (event_id IS NULL AND session_id IS NOT NULL)
  ),
  CONSTRAINT participant_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Anyone can insert participants (via QR code)
CREATE POLICY "Anyone can insert participants"
  ON public.participants FOR INSERT
  WITH CHECK (true);

-- Hosts can view participants for their events
CREATE POLICY "Hosts can view own event participants"
  ON public.participants FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE host_user_id = auth.uid()
    )
  );

-- Hosts can update participants for their events (mark as winner, etc.)
CREATE POLICY "Hosts can update own event participants"
  ON public.participants FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE host_user_id = auth.uid()
    )
  );

-- Hosts can delete participants from their events
CREATE POLICY "Hosts can delete own event participants"
  ON public.participants FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE host_user_id = auth.uid()
    )
  );

-- Free tier: Allow read/write for session-based participants
CREATE POLICY "Session participants are publicly readable"
  ON public.participants FOR SELECT
  USING (session_id IS NOT NULL);

CREATE POLICY "Session participants can be updated by session"
  ON public.participants FOR UPDATE
  USING (session_id IS NOT NULL);

-- Admins can view all participants
CREATE POLICY "Admins can view all participants"
  ON public.participants FOR ALL
  USING (auth.jwt() ->> 'email' = 'espsva@attensi.com');

-- Indexes
CREATE INDEX idx_participants_event_id ON public.participants(event_id);
CREATE INDEX idx_participants_session_id ON public.participants(session_id);
CREATE INDEX idx_participants_email ON public.participants(email);
CREATE INDEX idx_participants_is_winner ON public.participants(is_winner);

-- Unique constraint: one email per event
CREATE UNIQUE INDEX idx_participants_email_event ON public.participants(email, event_id)
  WHERE email IS NOT NULL AND event_id IS NOT NULL;


-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('winner', 'loser')),

  -- Email content
  subject text NOT NULL,
  body_html text NOT NULL,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- One template per type per event
  CONSTRAINT email_templates_event_type_unique UNIQUE(event_id, type)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Hosts can manage templates for their events
CREATE POLICY "Hosts can view own event templates"
  ON public.email_templates FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE host_user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can manage own event templates"
  ON public.email_templates FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE host_user_id = auth.uid()
    )
  );

-- Admins can view all templates
CREATE POLICY "Admins can view all templates"
  ON public.email_templates FOR ALL
  USING (auth.jwt() ->> 'email' = 'espsva@attensi.com');

-- Index
CREATE INDEX idx_email_templates_event_id ON public.email_templates(event_id);


-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- For logo uploads
-- NOTE: Storage buckets must be created manually via Supabase UI or API
-- Run this in Supabase Storage UI:
-- 1. Create bucket: "event-logos" (public)
-- 2. Set size limit: 2MB
-- 3. Allowed file types: image/png, image/jpeg, image/svg+xml
