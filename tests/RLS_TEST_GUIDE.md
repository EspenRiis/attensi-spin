# RLS Verification Test Guide

This guide helps you verify that Row Level Security (RLS) policies are working correctly in your Supabase database.

## What is RLS?

Row Level Security (RLS) ensures that users can only access data they're authorized to see. For example:
- Users should only see their own events, not other users' events
- Event hosts should only see participants for their own events
- Users should only be able to update/delete their own data

## Prerequisites

Before running the tests, you need to create two test users.

### Step 1: Create Test Users

Go to your Supabase Dashboard → Authentication → Users, and create two test users:

1. **Test User 1**
   - Email: `test-user-1@example.com`
   - Password: `TestPassword123!`

2. **Test User 2**
   - Email: `test-user-2@example.com`
   - Password: `TestPassword123!`

## Running the Automated Tests

```bash
node tests/rls-verification.js
```

The script will automatically test all RLS policies and report results.

## Manual Testing (Alternative)

If you prefer to test manually or want to understand what's being tested, follow these steps:

### Test 1: User Profile Access

**Using Supabase SQL Editor:**

```sql
-- Sign in as test-user-1@example.com first, then run:

-- ✅ Should return your own profile
SELECT * FROM user_profiles WHERE id = auth.uid();

-- ❌ Should return nothing (blocked by RLS)
SELECT * FROM user_profiles WHERE id != auth.uid();
```

### Test 2: Event Access

**Create an event as User 1:**

```sql
-- Sign in as test-user-1@example.com
INSERT INTO events (host_user_id, name, status)
VALUES (auth.uid(), 'User 1 Test Event', 'draft')
RETURNING *;
```

**Try to access it as User 2:**

```sql
-- Sign in as test-user-2@example.com
-- ❌ Should return nothing (draft events are private)
SELECT * FROM events WHERE name = 'User 1 Test Event';
```

**Set event to live and try again:**

```sql
-- Sign in as test-user-1@example.com
UPDATE events SET status = 'live' WHERE name = 'User 1 Test Event';

-- Sign in as test-user-2@example.com
-- ✅ Should now see the event (live events are public for registration)
SELECT * FROM events WHERE name = 'User 1 Test Event';
```

### Test 3: Participant Access

**Create a participant for User 1's event:**

```sql
-- Can be done while signed out (anonymous registration)
INSERT INTO participants (event_id, name, email)
VALUES ('<user-1-event-id>', 'Test Participant', 'test@example.com')
RETURNING *;
```

**Check access:**

```sql
-- Sign in as test-user-1@example.com (event owner)
-- ✅ Should see the participant
SELECT * FROM participants WHERE event_id = '<user-1-event-id>';

-- Sign in as test-user-2@example.com (different user)
-- ❌ Should return nothing (can't see other users' participants)
SELECT * FROM participants WHERE event_id = '<user-1-event-id>';
```

## Expected Results

All RLS policies should enforce these rules:

### User Profiles
- ✅ Users can read their own profile
- ✅ Users can update their own profile
- ❌ Users cannot read other profiles (except admins)

### Events
- ✅ Users can create events
- ✅ Users can read their own events
- ✅ Anyone can read **live** events (needed for registration)
- ❌ Users cannot read other users' **draft** events
- ✅ Users can update their own events
- ❌ Users cannot update other users' events
- ✅ Users can delete their own events
- ❌ Users cannot delete other users' events

### Participants
- ✅ Anyone can insert participants (public registration)
- ✅ Event hosts can view their event participants
- ❌ Users cannot view other users' event participants
- ✅ Event hosts can update their participants (mark as winner, etc.)
- ❌ Users cannot update other users' participants
- ✅ Event hosts can delete their participants
- ❌ Users cannot delete other users' participants

### Email Templates
- ✅ Event hosts can manage templates for their events
- ❌ Users cannot access other users' templates

## Current RLS Policies Summary

Based on the schema (`supabase/migrations/20250106_v2_schema.sql`):

| Table | Policy | Description |
|-------|--------|-------------|
| **user_profiles** | Users can view own profile | `auth.uid() = id` |
| **user_profiles** | Users can update own profile | `auth.uid() = id` |
| **events** | Hosts can view own events | `auth.uid() = host_user_id` |
| **events** | Anyone can view live events | `status = 'live'` |
| **events** | Hosts can create events | `auth.uid() = host_user_id` |
| **events** | Hosts can update own events | `auth.uid() = host_user_id` |
| **events** | Hosts can delete own events | `auth.uid() = host_user_id` |
| **participants** | Anyone can insert participants | `true` |
| **participants** | Hosts can view own event participants | Subquery check |
| **participants** | Session participants publicly readable | `session_id IS NOT NULL` |
| **participants** | Hosts can update own event participants | Subquery check |
| **participants** | Hosts can delete own event participants | Subquery check |
| **email_templates** | Hosts can view own event templates | Subquery check |
| **email_templates** | Hosts can manage own event templates | Subquery check |

## Admin Access

The admin user (`espsva@attensi.com`) has full access to all tables via special policies.

## Troubleshooting

### Test users can't sign in
- Make sure you created the users in Supabase Auth UI
- Check that email confirmation is disabled for testing (Settings → Auth → Email Auth → Confirm email)

### Policies not working as expected
- Check Supabase logs for RLS errors
- Verify policies are enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Make sure you're testing with the correct user context

### Getting "insufficient_privilege" errors
- This is expected for blocked operations (e.g., accessing other users' data)
- If you get this for allowed operations, check the policy WITH CHECK and USING clauses

## Next Steps After Verification

Once all tests pass:
1. ✅ Mark NAM-12 as complete in Linear
2. Document any security findings
3. Consider adding integration tests that run automatically on deployment
4. Review storage bucket policies (logos) separately
