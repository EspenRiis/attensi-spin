# Security Setup and Configuration Guide
**Project:** Attensi Spin
**Date:** 2025-12-12
**Version:** 1.0

## Overview

This document provides step-by-step instructions for implementing the security measures in Attensi Spin to ensure ISO 27001 compliance and protect user data.

---

## Table of Contents

1. [Supabase Row Level Security Setup](#1-supabase-row-level-security-setup)
2. [Automated Data Retention](#2-automated-data-retention)
3. [Security Headers](#3-security-headers)
4. [Input Validation](#4-input-validation)
5. [Monitoring and Alerts](#5-monitoring-and-alerts)
6. [Verification](#6-verification)
7. [Ongoing Maintenance](#7-ongoing-maintenance)

---

## 1. Supabase Row Level Security Setup

### 1.1 Apply RLS Migration

**Purpose:** Enforce session isolation and prevent unauthorized data access

**Steps:**

1. **Navigate to Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your Attensi Spin project

2. **Run the RLS Migration:**
   - Go to SQL Editor
   - Open the migration file: `supabase/migrations/20251212_security_policies.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click "Run"

3. **Verify RLS is Enabled:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename IN ('participants', 'events', 'winner_history');
   ```

   Expected result: All tables show `rowsecurity = true`

4. **View Active Policies:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, cmd
   FROM pg_policies
   WHERE tablename IN ('participants', 'events', 'winner_history');
   ```

   You should see 14 policies created.

### 1.2 Test RLS Policies

**Test Session Isolation:**

```sql
-- Insert test data with session IDs
INSERT INTO participants (name, session_id) VALUES
  ('Alice', '11111111-1111-1111-1111-111111111111'),
  ('Bob', '22222222-2222-2222-2222-222222222222');

-- Try to query - RLS should filter by session_id
SELECT * FROM participants WHERE session_id = '11111111-1111-1111-1111-111111111111';
-- Should only return Alice

SELECT * FROM participants WHERE session_id = '22222222-2222-2222-2222-222222222222';
-- Should only return Bob

-- Cleanup
DELETE FROM participants WHERE name IN ('Alice', 'Bob');
```

---

## 2. Automated Data Retention

### 2.1 Enable pg_cron Extension

**Purpose:** Automate deletion of sessions older than 30 days (GDPR compliance)

**Steps:**

1. **Go to Supabase Dashboard → Database → Extensions**

2. **Search for "pg_cron" and enable it**

3. **Verify Extension:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

### 2.2 Schedule Cleanup Job

**Run this SQL to schedule daily cleanup at 02:00 UTC:**

```sql
-- Schedule cleanup job
SELECT cron.schedule(
  'cleanup-old-sessions',           -- Job name
  '0 2 * * *',                      -- Cron schedule (daily at 02:00 UTC)
  $$SELECT cleanup_old_sessions()$$ -- Function to call
);
```

### 2.3 Verify Scheduled Job

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details
WHERE jobname = 'cleanup-old-sessions'
ORDER BY start_time DESC
LIMIT 10;
```

### 2.4 Manual Cleanup (for testing)

```sql
-- Run cleanup manually to test
SELECT cleanup_old_sessions();

-- Check oldest session age
SELECT
  MIN(created_at) as oldest_session,
  NOW() - MIN(created_at) as age,
  COUNT(*) as total_participants
FROM participants
WHERE session_id IS NOT NULL;
```

### 2.5 Alternative: Supabase Edge Function

If pg_cron is not available on your Supabase plan, use an edge function called via cron-job.org or GitHub Actions:

```typescript
// supabase/functions/cleanup-old-sessions/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { error, count } = await supabaseAdmin
    .from('participants')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString())
    .is('session_id', null)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      success: true,
      deleted: count,
      message: `Deleted ${count} participants older than 30 days`
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

Then schedule via cron-job.org or GitHub Actions to call this endpoint daily.

---

## 3. Security Headers

### 3.1 Verify Headers Configuration

The security headers are configured in `vercel.json`. After deploying to Vercel, verify they're active:

**Using curl:**
```bash
curl -I https://your-domain.vercel.app
```

**Expected Headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: ...`

### 3.2 Test CSP Compliance

1. **Open Browser Console** on your deployed site
2. **Look for CSP Violations** (should be none)
3. **Test scenarios:**
   - Try to load external scripts (should be blocked)
   - Try to embed in iframe (should be blocked)

### 3.3 Security Headers Checklist

https://securityheaders.com

- [ ] Go to https://securityheaders.com
- [ ] Enter your production URL
- [ ] Target Grade: A or higher
- [ ] Fix any issues reported

---

## 4. Input Validation

### 4.1 Validation is Automatic

The validation utility (`src/utils/validation.js`) is now integrated into:
- `addName()` function
- `addNameToEvent()` function

**What's Protected:**
- XSS attempts (`<script>`, `javascript:`, event handlers)
- SQL injection attempts (handled by Supabase parameterized queries)
- Invalid characters (`<`, `>`, `{`, `}`, `\`)
- Length violations (max 50 characters)
- Rate limiting (10 names/minute per session)

### 4.2 Test Validation

**Test in browser console:**

```javascript
// Import validation
import { validateName } from './src/utils/validation.js';

// Test cases
console.log(validateName('<script>alert("XSS")</script>'));
// Expected: { valid: false, error: 'Name contains invalid content' }

console.log(validateName('John Doe'));
// Expected: { valid: true, error: null, sanitized: 'John Doe' }

console.log(validateName('A'.repeat(51)));
// Expected: { valid: false, error: 'Name must be 50 characters or less' }
```

### 4.3 Rate Limiting Test

Try adding 11 names rapidly in the same session. The 11th should be blocked with:
```
Too many requests. Please wait X seconds.
```

---

## 5. Monitoring and Alerts

### 5.1 Set Up Error Tracking (Sentry - Recommended)

**Install Sentry:**
```bash
cd attensi-spin
npm install --save @sentry/react
```

**Configure Sentry:**

Create `src/lib/sentry.js`:
```javascript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    beforeSend(event, hint) {
      // Don't send participant names to Sentry
      if (event.request?.data) {
        event.request.data = '[Filtered]';
      }
      return event;
    },
  });
}

export default Sentry;
```

**Add to `main.jsx`:**
```javascript
import './lib/sentry';
```

### 5.2 Supabase Monitoring

**Enable Database Logs:**
1. Go to Supabase Dashboard → Logs
2. Enable:
   - API logs
   - Database logs
   - Auth logs (if using authentication)

**Set Up Alerts:**
1. Go to Settings → API
2. Configure alert email for:
   - High error rates
   - Unusual traffic
   - Database performance issues

### 5.3 Vercel Monitoring

**In Vercel Dashboard:**
1. Go to Analytics
2. Enable Web Vitals monitoring
3. Set up alert for:
   - Error rate > 5%
   - Response time > 5 seconds
   - Build failures

---

## 6. Verification

### 6.1 Security Checklist

Run through this checklist before production deployment:

**Database Security:**
- [ ] RLS enabled on all tables
- [ ] RLS policies tested and working
- [ ] Automated cleanup scheduled
- [ ] Test data removed from production

**Application Security:**
- [ ] Input validation active on all forms
- [ ] Rate limiting tested
- [ ] No console.log statements with sensitive data
- [ ] No secrets in Git repository
- [ ] `.env` in `.gitignore`

**Infrastructure Security:**
- [ ] Security headers verified (securityheaders.com)
- [ ] HTTPS enforced
- [ ] CSP policy active (no console warnings)
- [ ] Dependencies audited (`npm audit`)

**Compliance:**
- [ ] Privacy notice displayed to users
- [ ] Data retention policy implemented (30 days)
- [ ] Session isolation verified
- [ ] GDPR requirements met

### 6.2 Penetration Testing

**Basic Security Tests:**

1. **XSS Test:**
   - Try adding names with XSS payloads
   - Verify they're rejected

2. **Session Isolation Test:**
   - Create two sessions
   - Verify names don't cross over

3. **Rate Limiting Test:**
   - Add many names rapidly
   - Verify rate limiting kicks in

4. **SQL Injection Test:**
   - Try SQL syntax in name field
   - Verify it's safely handled

**Run npm audit:**
```bash
cd attensi-spin
npm audit
```

Target: 0 critical or high vulnerabilities

---

## 7. Ongoing Maintenance

### 7.1 Daily

- [ ] Check error logs in Vercel
- [ ] Review Supabase logs for anomalies
- [ ] Monitor uptime

### 7.2 Weekly

- [ ] Review security alerts
- [ ] Check dependency updates: `npm outdated`
- [ ] Verify cleanup job ran successfully

### 7.3 Monthly

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Update dependencies (patch versions)
- [ ] Review access logs for unusual patterns
- [ ] Verify oldest session age (should be < 30 days)

### 7.4 Quarterly

- [ ] Security audit with OWASP ZAP or similar
- [ ] Review and update RLS policies if needed
- [ ] Penetration testing
- [ ] Review and update this documentation
- [ ] Test backup and restore procedures

---

## 8. Incident Response

If a security incident occurs:

1. **Immediately:**
   - Document what happened
   - Assess scope of impact
   - Contain the incident (disable feature if needed)

2. **Within 24 hours:**
   - Notify stakeholders
   - Notify affected users if data breach
   - Begin remediation

3. **Within 72 hours:**
   - Notify supervisory authority if GDPR breach
   - Implement fix and deploy
   - Post-mortem analysis

**See:** `docs/iso-compliance/INCIDENT-RESPONSE-PLAN.md` (to be created)

---

## 9. Security Contacts

| Role | Email | Phone |
|------|-------|-------|
| Security Officer | security@attensi.com | [Phone] |
| On-Call Engineer | [Email] | [Phone] |
| Data Protection Officer | privacy@attensi.com | [Phone] |
| Supabase Support | support@supabase.io | - |

---

## 10. Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-12
**Next Review:** Quarterly

**Approval:**
- [ ] Security Officer
- [ ] Technical Lead
- [ ] Data Protection Officer
