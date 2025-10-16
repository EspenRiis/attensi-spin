# Squad Scramble Quick Start Guide

## 🚀 How to Run & Test

### Step 1: Run Database Migration

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project → **SQL Editor**
3. Create a new query
4. Copy the entire contents of `supabase/migrations/20250110_squad_scramble.sql`
5. Paste into SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify success: Check for green checkmark and "Success" message

**Verify Tables Created:**
```sql
-- Run this query to check tables exist:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('team_generations', 'teams', 'team_members');
```

You should see 3 rows returned.

---

### Step 2: Start Development Server

```bash
cd "/Users/espen/Documents/Attensi Spin/attensi-spin"
npm run dev
```

Server will start at: http://localhost:5173

---

### Step 3: Test Squad Scramble

#### Free Tier (Session Mode)
1. Navigate to: http://localhost:5173/squad-scramble
2. Add participants:
   - Type names in input field
   - Click "Add" or press Enter
   - Add at least 4-5 participants for testing
3. Configure teams:
   - Try "# of Teams" mode → Set to 2 teams
   - Click "GENERATE TEAMS"
   - Verify teams appear with confetti 🎉
4. Test regenerate:
   - Click "🔄 Shuffle Again"
   - Verify teams are different
5. Test captain selection:
   - Click any member in a team
   - Verify crown 👑 appears
6. Test team name editing:
   - Click team name
   - Edit and press Enter
   - Verify name updates

#### Team Size Mode
1. Switch to "Team Size" mode
2. Set "People per Team" to 3
3. Generate and verify distribution

#### Edge Cases to Test
- Generate with 2 participants (minimum)
- Generate with 1 participant (should show error)
- Generate with uneven numbers (e.g., 10 participants, 3 teams)
- Refresh page → verify teams persist

---

### Step 4: Test Event Mode (Logged-in Users)

1. Log in to your account
2. Go to Dashboard
3. Open an existing event OR create new event
4. Manually navigate to: http://localhost:5173/squad-scramble?eventId={YOUR_EVENT_ID}
5. Add participants (or use existing event participants)
6. Generate teams
7. Verify teams save to database:
   ```sql
   -- Check in Supabase SQL Editor:
   SELECT * FROM team_generations WHERE event_id = 'YOUR_EVENT_ID';
   SELECT * FROM teams WHERE generation_id = 'GENERATION_ID_FROM_ABOVE';
   SELECT * FROM team_members;
   ```

---

## 🐛 Known Issues & Fixes

### Issue 1: Participant IDs Not Persisting
**Symptom**: Teams generate but fail to save to database with foreign key error.

**Cause**: Using temporary IDs (`participant-${index}`) instead of real database UUIDs.

**Fix Required**: Update `SquadScramblePage.jsx` to fetch real participant objects from database.

**Quick Workaround**: For initial testing, teams will generate in UI but may not persist. This is expected and will be fixed in next commit.

---

### Issue 2: No Participants Show After Page Refresh
**Symptom**: Added participants disappear after refresh.

**Cause**: Likely related to participant loading from database.

**Check**: Open browser console, look for errors in Network tab or Console.

---

## 📊 Database Structure

### team_generations
- Stores each generation attempt
- `is_current` flag marks latest generation
- Links to either `event_id` (paid) or `session_id` (free)

### teams
- Individual teams for each generation
- Team number, name, color scheme
- Foreign key to generation

### team_members
- Many-to-many relationship: teams ↔ participants
- `is_captain` boolean flag
- Foreign key to both teams and participants

---

## 🎨 Design Elements

### Color Schemes (10 total)
Each team gets a random gradient:
- Purple → Pink
- Blue → Cyan
- Green → Emerald
- Orange → Red
- Yellow → Amber
- Indigo → Purple
- Pink → Rose
- Teal → Cyan
- Lime → Green
- Violet → Purple

### Team Names (30 total)
Examples:
- 🔥 Fire Dragons
- ⚡ Thunder Bolts
- 🌊 Wave Riders
- 🌟 Star Crushers
- 🚀 Space Rangers
- 💎 Diamond Squad

---

## 🔍 Debugging Tips

### Check Browser Console
```javascript
// Open DevTools (F12 or Cmd+Opt+I)
// Look for errors related to:
- Supabase queries
- Participant loading
- Team generation
- State updates
```

### Check Network Tab
1. Open DevTools → Network tab
2. Filter by "supabase"
3. Generate teams
4. Check POST requests to `team_generations`, `teams`, `team_members`
5. Look for 200 status codes (success) vs 400/500 errors

### Check Supabase Logs
1. Supabase Dashboard → Logs
2. Filter by "POST" or "INSERT"
3. Look for errors or policy violations

---

## ✅ Testing Checklist

### Basic Functionality
- [ ] Can add participants
- [ ] Can remove participants
- [ ] Can switch between modes (team count / team size)
- [ ] Preview shows correct calculations
- [ ] Generate button works
- [ ] Teams display with animations
- [ ] Confetti appears on generation
- [ ] Team names are editable
- [ ] Captain selection works
- [ ] Regenerate creates new teams

### Persistence
- [ ] Session mode: teams persist across page reloads
- [ ] Event mode: teams save to database
- [ ] Team name edits persist
- [ ] Captain changes persist

### Edge Cases
- [ ] Error message with 1 participant
- [ ] Works with 2 participants (minimum)
- [ ] Handles uneven distribution gracefully
- [ ] Works with 50+ participants
- [ ] Mobile responsive

### Integration
- [ ] QR code panel appears
- [ ] Event name displays correctly (event mode)
- [ ] No errors in console
- [ ] No broken styles

---

## 🆘 If Something Breaks

### Reset Session Data
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Reset Event Data
```sql
-- In Supabase SQL Editor:
DELETE FROM team_members WHERE team_id IN (
  SELECT id FROM teams WHERE generation_id IN (
    SELECT id FROM team_generations WHERE event_id = 'YOUR_EVENT_ID'
  )
);
DELETE FROM teams WHERE generation_id IN (
  SELECT id FROM team_generations WHERE event_id = 'YOUR_EVENT_ID'
);
DELETE FROM team_generations WHERE event_id = 'YOUR_EVENT_ID';
```

### Check RLS Policies
```sql
-- Verify policies are active:
SELECT * FROM pg_policies
WHERE tablename IN ('team_generations', 'teams', 'team_members');
```

---

## 📞 Need Help?

**Common Questions:**

**Q: "Generate button is disabled"**
A: Need at least 2 participants. Add more names.

**Q: "Teams don't appear after clicking generate"**
A: Check browser console for errors. Likely database migration not run or participant ID issue.

**Q: "Confetti doesn't show"**
A: Confetti is optional visual flair. If it doesn't show, not a critical issue.

**Q: "Page is blank"**
A: Check that migration ran successfully. Verify no console errors.

**Q: "Can't edit team names"**
A: Click directly on the team name (emoji + text). Input field should appear.

---

## 🎯 Next Steps After Testing

1. Report any bugs found
2. Test cross-tool participant sharing (when implemented)
3. Provide UX feedback:
   - Is the two-mode system intuitive?
   - Are team names fun?
   - Is captain selection clear?
4. Feature requests for Phase 2+

---

**Happy testing! 🎉**
