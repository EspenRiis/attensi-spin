# Database Migration Guide - v2.0 Schema

## Overview
This guide walks you through running the v2.0 database schema migration for Attensi Spin.

## Prerequisites
- Access to your Supabase project dashboard
- Admin access to execute SQL commands

## Migration File
📄 `supabase/migrations/20250106_v2_schema.sql`

## What This Migration Does
Creates the complete v2.0 database schema including:
- ✅ `user_profiles` - Extends auth.users with subscription tiers
- ✅ `events` - Event management with form/branding configs
- ✅ `participants` - Drops and recreates with event_id and session_id support
- ✅ `email_templates` - Winner/loser email templates
- ✅ RLS policies for all tables
- ✅ Indexes for performance
- ✅ Triggers for updated_at timestamps

## How to Run the Migration

### Option 1: Via Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration SQL**
   - Open `supabase/migrations/20250106_v2_schema.sql`
   - Copy the entire contents

4. **Paste and Run**
   - Paste the SQL into the editor
   - Click "Run" (or press Cmd+Enter / Ctrl+Enter)
   - Wait for completion

5. **Verify Success**
   - Check for green success message
   - No red error messages should appear

### Option 2: Via Supabase CLI (If Installed)

```bash
# Make sure you're in the project root
cd /Users/espen/Documents/Attensi\ Spin/attensi-spin

# Link to your project (first time only)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

## Post-Migration Verification Checklist

### 1. Verify Tables Created
Go to "Table Editor" in Supabase Dashboard and confirm these tables exist:
- [ ] `user_profiles`
- [ ] `events`
- [ ] `participants` (recreated)
- [ ] `email_templates`

### 2. Verify RLS Policies
For each table above:
- [ ] Go to "Authentication" → "Policies"
- [ ] Each table should have green checkmarks indicating RLS is enabled
- [ ] Policies should be listed for each table

### 3. Verify Indexes
Run this query in SQL Editor:
```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'events', 'participants', 'email_templates')
ORDER BY tablename, indexname;
```
Expected indexes:
- [ ] `idx_events_host_user_id`
- [ ] `idx_events_status`
- [ ] `idx_participants_event_id`
- [ ] `idx_participants_session_id`
- [ ] `idx_participants_email`
- [ ] `idx_participants_is_winner`
- [ ] `idx_participants_email_event`
- [ ] `idx_email_templates_event_id`

### 4. Test Foreign Key Constraints
Run this test query:
```sql
-- This should fail (foreign key constraint)
INSERT INTO public.events (host_user_id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'Test Event');
```
Expected: Error message about foreign key constraint ✅

### 5. Test Sample Data
```sql
-- This should succeed after you create a user via Supabase Auth
-- Replace with your actual user ID from auth.users
INSERT INTO public.user_profiles (id, email, subscription_tier)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'test@example.com',
  'free'
);
```

### 6. Create Storage Bucket (Manual Step)
⚠️ **Important:** Storage buckets cannot be created via SQL.

1. Go to "Storage" in Supabase Dashboard
2. Click "Create bucket"
3. Name: `event-logos`
4. Set to **Public**
5. Configuration:
   - File size limit: **2MB**
   - Allowed MIME types: `image/png`, `image/jpeg`, `image/svg+xml`

## Rollback Plan
If something goes wrong, you can rollback by:

```sql
-- Drop all new tables (this will cascade delete data!)
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.participants CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Drop the function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

⚠️ **Warning:** This will delete all data in these tables!

## Troubleshooting

### Error: "relation already exists"
- Tables already created. Either skip or drop tables first.

### Error: "permission denied"
- Make sure you're logged in as project owner/admin.

### Error: "function auth.uid() does not exist"
- Make sure you're running this on a Supabase project, not local PostgreSQL.

### Error: "constraint violation"
- Check if old data conflicts with new constraints.
- You may need to clean up existing data first.

## Next Steps
After successful migration:
1. ✅ Mark task NAM-6 as complete in Linear
2. ✅ Update PRD-V2.md checklist (line 497)
3. ✅ Move to task 1.2: Authentication System
4. ✅ Test authentication with new user_profiles table

## Questions?
Contact: espsva@attensi.com
