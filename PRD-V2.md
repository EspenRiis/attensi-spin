# Attensi Spin v2.0 - Product Requirements Document

**Version:** 2.0  
**Date:** January 2025  
**Status:** Approved for Development  
**Timeline:** 4-6 weeks (MVP)

---

## 🎯 Executive Summary

Transform Attensi Spin from a simple session-based spinning wheel into a comprehensive event management platform for conferences, trade shows, and marketing events. Enable authenticated hosts to create events, collect participant data via QR codes, manage results, and send automated winner/loser emails.

**Core Value Proposition:**
- **Free Tier**: Quick anonymous spinning wheel for casual use
- **Paid Tier**: Professional event management with data collection, customization, and email automation

---

## 👥 User Roles & Personas

### 1. Anonymous User (Free Tier)
**Who:** Someone who wants to quickly spin a wheel without signing up  
**Goals:**
- Add names manually
- Spin the wheel
- See results immediately
- Share QR code for others to join
**Limitations:**
- No customization
- No data persistence beyond session
- No email notifications
- Participants can only enter names (no email/org/phone)

### 2. Host (Paid Tier)
**Who:** Attensi sales rep at a conference booth, event organizer, marketing professional  
**Goals:**
- Create professional events with custom branding
- Collect participant data (email, organization, phone, consent)
- Manage multiple events simultaneously
- Export participant data
- Send winner/loser notification emails
- Reuse previous event configurations
**Workflow:**
1. Sign up and create account
2. Create new event (or duplicate previous one)
3. Customize branding and form fields
4. Generate QR code
5. Go live at event
6. Collect participants via QR
7. Spin wheel when ready
8. Send winner email (with approval)
9. Export data for CRM

### 3. Participant (No Account Needed)
**Who:** Conference attendee, potential customer, event visitor  
**Goals:**
- Quickly enter competition via QR code
- Provide minimal info required
- Understand what they're consenting to
- Receive notification if they win
**Workflow:**
1. Scan QR code at booth
2. Fill out form (name, email, org, phone, consent)
3. Submit and see confirmation
4. Optionally watch their name appear on the big screen
5. Receive email if winner (or loser if host chooses)

### 4. Admin (Attensi Internal)
**Who:** espsva@attensi.com (hardcoded for MVP)  
**Goals:**
- Monitor platform usage
- View all hosts and events
- Manually intervene if needed (delete spam, resolve issues)
- Access system-wide analytics
**Workflow:**
- Log in with admin email
- See admin dashboard with platform stats
- View/search all events and hosts
- Take manual actions as needed

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Landing │  │   Auth   │  │Dashboard │  │   Live   │   │
│  │   Page   │  │  Pages   │  │  Pages   │  │  Wheel   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Database │  │ Realtime │  │ Storage  │   │
│  │  (JWT)   │  │(Postgres)│  │  Sync    │  │ (Files)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │SendGrid  │  │ bad-words│  │ Vercel   │                  │
│  │  (Email) │  │ (Filter) │  │(Hosting) │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18
- React Router 6
- Framer Motion (animations)
- Vite (build tool)
- QRCode.react
- Canvas Confetti

**Backend:**
- Supabase (PostgreSQL + Auth + Realtime + Storage)
- Supabase Auth (JWT-based)
- Row Level Security (RLS) for data isolation

**Email:**
- SendGrid API (for winner/loser emails)
- Supabase Auth emails (for password reset, etc.)

**Deployment:**
- Vercel (Frontend)
- Supabase Cloud (Backend)
- Domain: TBD (currently attensi-spin.vercel.app)

**Utilities:**
- bad-words (npm package for profanity filtering)
- date-fns (date handling)
- react-colorful (color picker)

---

## 🗄️ Database Schema

### New Tables (Add to Supabase)

```sql
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
-- Run this in Supabase Storage UI or via API:
-- 1. Create bucket: "event-logos" (public)
-- 2. Set size limit: 2MB
-- 3. Allowed file types: image/png, image/jpeg, image/svg+xml
```

---

## 🔐 Authentication Flow

### Sign Up Flow
```
User visits /signup → Enter email + password → Supabase creates account → 
Create user_profile record → Send email verification → Redirect to /dashboard
```

### Login Flow
```
User visits /login → Enter email + password → Supabase validates → 
Set JWT token → Redirect to /dashboard
```

---

## 🛣️ Application Routes

### Public Routes (No Auth Required)
```
/                           Landing page with free spinning wheel
/signup                     Create account
/login                      Sign in
/reset-password             Password reset form
/add-name?session=xxx       Free tier participant entry (name only)
/register?event=xxx         Paid tier participant entry (full form)
```

### Protected Routes (Auth Required)
```
/dashboard                  List of user's events + create new
/events/:id                 Event control panel / overview
/events/:id/customize       Form builder + branding settings
/events/:id/participants    Participant list + CSV export
/events/:id/emails          Email template editor
/events/:id/live            Fullscreen wheel for event
```

### Admin Routes
```
/admin                      Platform overview
/admin/users                All users list
/admin/events               All events list
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)

**1.1 Database Setup**
- [ ] Run SQL migration (create new tables)
- [ ] Set up RLS policies
- [ ] Create storage bucket for logos
- [ ] Test with sample data

**1.2 Authentication System**
- [ ] Implement `/signup` page
- [ ] Implement `/login` page
- [ ] Implement `/reset-password` flow
- [ ] Create `user_profiles` record on signup
- [ ] Protected route wrapper component
- [ ] Admin route wrapper (check for espsva@attensi.com)

**1.3 Events CRUD**
- [ ] Create Event model/types
- [ ] Implement `/dashboard` - list events
- [ ] Implement "Create Event" form
- [ ] Implement event detail page `/events/:id`
- [ ] Implement duplicate event function
- [ ] Implement archive/delete event

### Phase 2: Form Builder & Branding (Week 2-3)

**2.1 Customization UI**
- [ ] Create `/events/:id/customize` page
- [ ] Logo upload component
- [ ] Color picker component
- [ ] Form field toggle checkboxes
- [ ] Anonymous display toggle
- [ ] Save settings to `branding_config` and `form_config`

**2.2 Dynamic Registration Form**
- [ ] Create `/register?event=xxx` page
- [ ] Fetch event config from DB
- [ ] Dynamically render form fields based on config
- [ ] Validate required fields
- [ ] Show consent checkbox with custom text
- [ ] Submit to `participants` table with `event_id`
- [ ] Show success message

**2.3 Update QR Code Generation**
- [ ] Update `QRCodePanel.jsx` to generate `/register?event=xxx` URLs
- [ ] Add download QR button
- [ ] Add copy link button

### Phase 3: Participant Management (Week 3-4)

**3.1 Participant Dashboard**
- [ ] Create `/events/:id/participants` page
- [ ] Table component (sortable, filterable)
- [ ] Real-time updates via Supabase subscription
- [ ] Show participant details
- [ ] Search by name/email
- [ ] Filter by winner status
- [ ] Delete participant action

**3.2 CSV Export**
- [ ] Create `/api/export-participants/:eventId` endpoint
- [ ] Generate CSV with all participant data
- [ ] Trigger download from button

**3.3 Live View Updates**
- [ ] Update `Wheel.jsx` to accept `anonymous_display` prop
- [ ] If anonymous, show "Participant 1", "Participant 2", etc.
- [ ] Update `/events/:id/live` to be fullscreen

### Phase 4: Email System (Week 4-5)

**4.1 SendGrid Integration**
- [ ] Create SendGrid account
- [ ] Get API key, store in Supabase secrets
- [ ] Create `/api/send-email` endpoint
- [ ] Test email sending

**4.2 Email Templates**
- [ ] Create default templates on event creation
- [ ] Create `/events/:id/emails` page
- [ ] Simple text editor for subject + body
- [ ] Support merge fields ({{name}}, {{email}}, etc.)
- [ ] Save to `email_templates` table
- [ ] Preview modal component

**4.3 Winner Email Flow**
- [ ] Update `WinnerModal.jsx` to show "Send Email" button
- [ ] Create email preview modal
- [ ] Replace merge fields with actual data
- [ ] Send via `/api/send-email`
- [ ] Mark `winner_email_sent_at` in DB
- [ ] Show confirmation toast

### Phase 5: Polish & Deploy (Week 5-6)

**5.1 Admin Dashboard**
- [ ] Create `/admin` route
- [ ] Show platform stats
- [ ] List all users
- [ ] List all events

**5.2 Error Handling**
- [ ] Add error boundaries
- [ ] Toast notifications for all actions
- [ ] Graceful degradation

**5.3 Documentation**
- [ ] Update README with new features
- [ ] Create user guide for hosts
- [ ] Document env variables

**5.4 Deployment**
- [ ] Set up production Supabase project
- [ ] Configure SendGrid production account
- [ ] Deploy to Vercel
- [ ] Test end-to-end on production

---

## 📦 Dependencies

### New npm Packages to Install

```bash
npm install @sendgrid/mail           # Email sending
npm install bad-words                # Profanity filter
npm install react-colorful           # Color picker
npm install papaparse                # CSV export
npm install date-fns                 # Date formatting
npm install react-hot-toast          # Toast notifications
```

### Environment Variables

Create `.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# SendGrid (Backend only - use Supabase secrets)
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=espsva@attensi.com
SENDGRID_FROM_NAME=Attensi Spin

# Admin
ADMIN_EMAIL=espsva@attensi.com

# App
VITE_APP_URL=https://attensi-spin.vercel.app
```

---

## 🎯 Out of Scope (Phase 2+)

These are explicitly NOT in MVP:

- ❌ SSO (Google, Microsoft OAuth)
- ❌ Full drag-and-drop form builder
- ❌ Payment/billing system (Stripe)
- ❌ Custom domains for hosts
- ❌ Advanced email editor (rich text WYSIWYG)
- ❌ SMS notifications
- ❌ Mobile app (native iOS/Android)
- ❌ Advanced analytics dashboard
- ❌ CRM integrations

---

## 🏁 Definition of Done

MVP is complete when:

- ✅ All Phase 1-5 tasks are checked off
- ✅ Deployed to production (Vercel)
- ✅ Supabase production database configured
- ✅ SendGrid production account set up
- ✅ Admin (espsva@attensi.com) can log in
- ✅ Free tier works as before (backward compatible)
- ✅ At least 1 real test event created and completed
- ✅ Winner email delivered successfully
- ✅ CSV export works with 100+ participants
- ✅ Documentation updated

---

*This document is a living artifact and will be updated as requirements evolve during development.*
