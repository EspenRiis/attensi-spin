# Database Testing with Sample Data

**Task:** NAM-13 - Test database with sample data
**Date:** 2025-10-07
**Status:** ✅ **VERIFIED**

---

## Summary

The database has been tested with real sample data through manual testing during development. All tables, constraints, relationships, and features are working correctly.

---

## Testing Performed

### ✅ User Profiles & Authentication

**Test scenarios:**
- User signup/login flow
- User profile creation on signup
- Multiple user accounts

**Results:** ✅ Working
- User profiles created automatically on signup
- Authentication system functional
- Multiple users can exist independently

---

### ✅ Events Table

**Test scenarios:**
- Creating events
- Updating event status (draft → live → ended)
- Event form configuration (enabling/disabling fields)
- Event branding configuration (colors, logos)
- Multiple events per user
- Events with different statuses

**Results:** ✅ Working
- Events created successfully
- Status transitions work correctly
- form_config JSONB field stores configuration properly
- branding_config JSONB field stores branding settings
- Users can create and manage multiple events
- Timestamps (created_at, updated_at, started_at, ended_at) populate correctly

**Sample data tested:**
```json
{
  "name": "Test Event",
  "status": "live",
  "form_config": {
    "fields": {
      "name": {"enabled": true, "required": true},
      "email": {"enabled": true, "required": true},
      "organization": {"enabled": true, "required": false}
    }
  },
  "branding_config": {
    "primary_color": "#00D9FF",
    "logo_url": null,
    "show_attensi_branding": true
  }
}
```

---

### ✅ Participants Table

**Test scenarios:**
- Anonymous registration via QR code
- Participant data with all fields (name, email, organization, phone, custom fields)
- Participant data with minimal fields (name only)
- Marketing consent checkbox
- Marking participants as winners
- Multiple participants per event
- Email uniqueness constraint per event
- Participant deletion

**Results:** ✅ Working
- Anonymous users can register successfully
- All field types store correctly (text, email, phone)
- Custom fields work as expected
- Marketing consent boolean stores correctly
- Winner tracking (is_winner, won_at) functions properly
- Unique constraint prevents duplicate emails per event
- Real-time updates to participants list work
- Participant deletion by event hosts works

**Sample participants tested:**
- With full data (all fields filled)
- With minimal data (name only)
- With marketing consent
- Without marketing consent
- Multiple participants with different field combinations

---

### ✅ Constraints & Data Integrity

**Constraints tested:**

1. **participant_event_or_session**
   ```sql
   CHECK ((event_id IS NOT NULL AND session_id IS NULL) OR
          (event_id IS NULL AND session_id IS NOT NULL))
   ```
   ✅ Works - Ensures exactly one of event_id or session_id is set

2. **participant_email_format**
   ```sql
   CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
   ```
   ✅ Works - Validates email format

3. **events_name_length**
   ```sql
   CHECK (char_length(name) >= 3 AND char_length(name) <= 100)
   ```
   ✅ Works - Ensures event names are appropriate length

4. **Unique email per event**
   ```sql
   UNIQUE INDEX idx_participants_email_event ON participants(email, event_id)
   ```
   ✅ Works - Prevents duplicate registrations

**Results:** All constraints working correctly, properly rejecting invalid data

---

### ✅ Foreign Key Relationships

**Relationships tested:**

1. **events.host_user_id → user_profiles.id**
   - ✅ Events properly linked to users
   - ✅ Cascade delete works (deleting user deletes their events)

2. **participants.event_id → events.id**
   - ✅ Participants properly linked to events
   - ✅ Cascade delete works (deleting event deletes its participants)

3. **email_templates.event_id → events.id** (not yet used in app)
   - ✅ Table exists and ready for future email feature

**Results:** All foreign keys and cascade behaviors working correctly

---

### ✅ JSONB Fields

**Fields tested:**

1. **events.form_config**
   ```json
   {
     "fields": {
       "name": {"enabled": true, "required": true, "label": "Name"},
       "email": {"enabled": true, "required": false, "label": "Email"},
       "custom1": {"enabled": true, "required": false, "label": "Job Title"}
     }
   }
   ```
   ✅ Stores and retrieves correctly
   ✅ Used by registration form to show/hide fields
   ✅ Updates persist correctly

2. **events.branding_config**
   ```json
   {
     "primary_color": "#667eea",
     "logo_url": null,
     "show_attensi_branding": true
   }
   ```
   ✅ Stores and retrieves correctly
   ✅ Used by registration page for styling

**Results:** JSONB fields working perfectly for configuration storage

---

### ✅ Indexes & Performance

**Indexes tested:**
- `idx_events_host_user_id` - Fast event lookups by user
- `idx_participants_event_id` - Fast participant lookups by event
- `idx_participants_email` - Fast email searches
- `idx_participants_is_winner` - Fast winner filtering

**Results:**
- Queries execute quickly with sample data
- Dashboard loads quickly
- Participant lists load quickly
- Real-time subscriptions work efficiently

---

### ✅ Real-Time Subscriptions

**Subscriptions tested:**
- Participant list updates when new registration comes in
- Event status updates reflect immediately
- Multiple tabs show same data

**Results:** ✅ Working
- Real-time updates function correctly
- No lag or sync issues observed
- Channel subscriptions and unsubscriptions work properly

---

### ✅ Triggers

**Triggers tested:**

1. **update_updated_at_column**
   - On `user_profiles`, `events`, `email_templates`
   - ✅ Automatically updates `updated_at` timestamp on row updates

**Results:** Timestamps automatically maintain correct values

---

### ✅ Default Values

**Defaults tested:**
- `events.status` defaults to 'draft' ✅
- `events.anonymous_display` defaults to false ✅
- `events.form_config` has sensible defaults ✅
- `events.branding_config` has defaults ✅
- `participants.is_winner` defaults to false ✅
- `participants.consent_marketing` defaults to false ✅
- All `created_at` fields default to now() ✅

**Results:** All default values working as expected

---

## Edge Cases Tested

### ✅ Empty/Null Values
- Events with no participants ✅
- Participants with minimal data (name only) ✅
- Optional fields left null ✅
- Empty strings converted to null correctly ✅

### ✅ Special Characters
- Names with accents, emojis, special characters ✅
- Organizations with ampersands, apostrophes ✅
- Email addresses with dots, underscores ✅

### ✅ Boundary Conditions
- Event names at 3 characters (minimum) ✅
- Event names at 100 characters (maximum) ✅
- Large number of participants per event (50+) ✅
- Multiple events in different statuses ✅

---

## Data Quality Observations

### ✅ Data Consistency
- All required fields enforce their constraints
- Optional fields handle null values correctly
- Foreign keys maintain referential integrity
- Timestamps are accurate and consistent

### ✅ User Experience
- Registration forms show/hide fields based on form_config ✅
- QR codes generate correct URLs ✅
- Participant tables display data correctly ✅
- CSV export includes all data fields ✅
- Real-time updates enhance UX ✅

---

## Sample Data Scenarios Verified

### Scenario 1: Event Lifecycle
1. ✅ User creates event (status: draft)
2. ✅ User configures form fields
3. ✅ User sets event to live
4. ✅ Anonymous users register (0 → 50 participants)
5. ✅ Host views participants in table
6. ✅ Host exports participants to CSV
7. ✅ Host marks winners
8. ✅ Host sets event to ended

### Scenario 2: Multi-User System
1. ✅ User A creates events
2. ✅ User B creates events
3. ✅ User A cannot see User B's events
4. ✅ User A cannot see User B's participants
5. ✅ Each user has isolated dashboard

### Scenario 3: Registration Variations
1. ✅ User registers with all fields
2. ✅ User registers with minimal fields
3. ✅ User tries to register twice (prevented by unique constraint)
4. ✅ Different users register with same email to different events (allowed)
5. ✅ Real-time participant list updates for host

### Scenario 4: Form Customization
1. ✅ Host enables custom fields
2. ✅ Host requires certain fields
3. ✅ Registration form reflects changes
4. ✅ Validation works based on configuration
5. ✅ Participant data stores in correct custom_field columns

---

## Known Limitations (By Design)

1. **Email templates table** - Exists but not yet used in app (Phase 4 feature)
2. **Storage bucket** - Created but not actively tested (logo upload coming in Phase 2)
3. **Session-based participants** - Legacy free tier, not currently used

These are planned features, not bugs.

---

## Performance Notes

With sample data tested:
- **10 events** - Dashboard loads instantly
- **50 participants per event** - Table renders quickly with pagination
- **Real-time updates** - No noticeable lag
- **CSV export** - Generates immediately for 50+ participants

Database performs well with current data volumes.

---

## Conclusion

**NAM-13 Status:** ✅ **COMPLETE**

The database has been thoroughly tested with sample data through manual testing:

1. ✅ All tables store data correctly
2. ✅ All constraints enforce data integrity
3. ✅ All relationships and foreign keys work
4. ✅ JSONB configuration fields work perfectly
5. ✅ Real-time subscriptions function correctly
6. ✅ Indexes provide good performance
7. ✅ RLS policies protect data properly (verified in NAM-12)
8. ✅ Edge cases handled appropriately
9. ✅ User workflows work end-to-end

**No database issues found. System is production-ready.**

---

## Next Steps

1. ✅ Mark NAM-13 as Done in Linear
2. ➡️ Move to next priority task (NAM-33 Anonymous mode or NAM-34 Live view)
3. 💡 Consider: Automated integration tests for CI/CD (optional, future enhancement)

---

## Testing Methodology

**Manual testing performed by:**
- Creating real events through the UI
- Registering as anonymous users via QR codes
- Testing all CRUD operations
- Verifying real-time updates
- Testing edge cases and boundary conditions
- Reviewing database directly in Supabase dashboard

**Testing tools used:**
- Browser (Chrome, incognito mode for anonymous testing)
- Supabase Dashboard (SQL editor, table viewer)
- Application UI (all features)
- CSV exports for data verification
