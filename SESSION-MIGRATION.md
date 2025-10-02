# Session Management Migration

## Overview
This migration adds session-based isolation to the Attensi Spin app, ensuring each host has their own private session and participants only join the host's session.

## Database Migration

**IMPORTANT:** Run this SQL in your Supabase SQL Editor before deploying the updated code.

```sql
-- Add session_id column to participants table
ALTER TABLE participants
ADD COLUMN session_id TEXT NOT NULL DEFAULT 'default';

-- Create index for faster queries
CREATE INDEX idx_participants_session_id ON participants(session_id);

-- Update the unique constraint to include session_id
-- First drop the old constraint (if it exists)
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_name_key;

-- Add new constraint that makes name unique per session
ALTER TABLE participants ADD CONSTRAINT participants_name_session_unique UNIQUE(name, session_id);
```

## How It Works

### Host Flow:
1. Host visits the main page (`/`)
2. If they have an existing session with data, they see a modal: "Continue previous session?" or "Start new session"
3. A unique session ID is generated and stored in their localStorage
4. The QR code includes the session ID in the URL: `/add-name?session=abc123`

### Participant Flow:
1. Participant scans the QR code
2. They're taken to `/add-name?session=abc123`
3. Their name is added to the host's session (using the session ID from the URL)
4. The host sees the name appear in real-time

### Privacy & GDPR:
- Each session is isolated - users can't see other sessions' data
- Data is session-specific, not globally shared
- Incognito mode creates a new session automatically
- Old sessions can be cleared and new ones started

## Testing Steps

1. **Run the database migration** in Supabase SQL Editor
2. **Clear browser data** (localStorage) to test fresh session creation
3. **Test host flow:**
   - Visit the main page
   - Add some names
   - Refresh - should see "Continue or Start Fresh" modal
4. **Test participant flow:**
   - Scan the QR code (or copy the URL with session parameter)
   - Add a name on mobile
   - Verify it appears on the host's screen
5. **Test isolation:**
   - Open incognito tab, create a new session
   - Verify the two sessions don't see each other's data

## Files Changed

- `src/utils/session.js` - New file for session management
- `src/utils/storage.js` - Updated to use session IDs in all queries
- `src/components/QRCodePanel.jsx` - Updated to include session ID in QR code
- `src/components/AddNamePage.jsx` - Updated to extract and use session ID from URL
- `src/components/WheelPage.jsx` - Updated to handle session initialization and modal

## Rollback Plan

If you need to rollback:

```sql
-- Remove the session constraint
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_name_session_unique;

-- Remove the index
DROP INDEX IF EXISTS idx_participants_session_id;

-- Remove the column
ALTER TABLE participants DROP COLUMN IF EXISTS session_id;

-- Restore old unique constraint
ALTER TABLE participants ADD CONSTRAINT participants_name_key UNIQUE(name);
```
