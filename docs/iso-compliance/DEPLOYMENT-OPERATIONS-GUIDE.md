# Deployment and Operations Guide - Attensi Spin
**Document Version:** 1.0
**Date:** 2025-12-12
**Project:** Attensi Spin - Name Wheel Application
**Owner:** DevOps Team
**Status:** Draft - Requires DevOps Review

## 1. Purpose and Scope

### 1.1 Purpose
This document provides comprehensive deployment procedures and operational guidance for Attensi Spin to ensure reliable, secure, and compliant operations.

### 1.2 Scope
Covers:
- Environment setup
- Deployment procedures
- Operational monitoring
- Backup and recovery
- Maintenance procedures
- Performance management

---

## 2. System Architecture

### 2.1 Architecture Overview

```
┌─────────────┐
│   Users     │
│ (Browser)   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│  Vercel CDN     │ ◄─── Static Assets (React SPA)
│  (Global)       │
└────────┬────────┘
         │
         │ API Calls (HTTPS)
         ▼
┌─────────────────┐
│   Supabase      │
│  PostgreSQL +   │
│   Real-time     │
│   (Backend)     │
└─────────────────┘
```

### 2.2 Components

| Component | Technology | Purpose | Hosting |
|-----------|-----------|---------|---------|
| Frontend | React 18 + Vite | User interface | Vercel |
| Database | PostgreSQL | Data storage | Supabase |
| Real-time | WebSocket | Live sync | Supabase |
| Analytics | Vercel Analytics | Usage metrics | Vercel |
| DNS | [TBD] | Domain management | [Provider] |

---

## 3. Environments

### 3.1 Environment Inventory

| Environment | Purpose | URL | Database | Access |
|-------------|---------|-----|----------|--------|
| Development | Local development | http://localhost:5173 | Supabase Dev | All developers |
| Staging | QA testing, UAT | https://staging-spin.attensi.com [TBD] | Supabase Staging | QA, Product, Dev |
| Production | Live application | https://spin.attensi.com [TBD] | Supabase Production | Limited (DevOps only) |

### 3.2 Environment Configuration

#### Development Environment
**Setup:**
```bash
cd attensi-spin
npm install
cp .env.example .env
# Edit .env with dev Supabase credentials
npm run dev
```

**Environment Variables (.env):**
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

**Database:** Separate Supabase project for dev
**Data:** Test data, can be reset anytime

---

#### Staging Environment
**Purpose:** Pre-production testing, UAT
**Deployment:** Automatic on merge to `staging` branch (if configured)
**Database:** Staging Supabase project
**Data:** Realistic test data, refreshed weekly
**Access Control:** Password-protected (optional)

**Setup:**
1. Create staging Vercel project
2. Connect to `staging` branch
3. Configure environment variables
4. Enable preview deployments

---

#### Production Environment
**Purpose:** Live user-facing application
**Deployment:** Manual trigger or automatic on merge to `main`
**Database:** Production Supabase project
**Data:** Real user data, GDPR protected
**Access Control:** Public, but Supabase RLS enforced

**Monitoring:**
- Uptime monitoring
- Error tracking
- Performance metrics
- Security alerts

---

## 4. Pre-Deployment Checklist

### 4.1 First-Time Production Deployment

**Infrastructure Setup:**
- [ ] Supabase production project created
- [ ] Database schema deployed (run migrations)
- [ ] Row Level Security (RLS) policies enabled
- [ ] Supabase API keys generated
- [ ] Vercel project created
- [ ] Domain name configured (DNS)
- [ ] SSL/TLS certificate provisioned (automatic with Vercel)

**Configuration:**
- [ ] Environment variables set in Vercel
- [ ] Supabase URL and anon key configured
- [ ] Analytics enabled (if desired)
- [ ] CORS settings reviewed
- [ ] Rate limiting configured

**Security:**
- [ ] Secrets not in Git repository (verify)
- [ ] `.env` in `.gitignore`
- [ ] Supabase RLS policies tested
- [ ] Security audit completed
- [ ] Dependency vulnerabilities fixed

**Compliance:**
- [ ] Privacy notice displayed
- [ ] Terms of use available
- [ ] Data retention policy configured
- [ ] DPAs signed with Supabase/Vercel
- [ ] GDPR requirements met

**Quality Assurance:**
- [ ] All tests passing
- [ ] UAT completed and signed off
- [ ] Performance benchmarks met
- [ ] Browser compatibility verified
- [ ] Mobile responsiveness confirmed

**Documentation:**
- [ ] User guide available
- [ ] Support procedures documented
- [ ] Runbooks prepared
- [ ] Rollback plan documented

**Approvals:**
- [ ] Security Officer sign-off
- [ ] Data Protection Officer sign-off
- [ ] Quality Manager sign-off
- [ ] Product Owner sign-off

---

## 5. Deployment Procedures

### 5.1 Standard Deployment (Normal Changes)

**Pre-Deployment:**
1. Verify all tests passing in CI/CD
2. Code review completed and approved
3. Merge PR to `main` branch
4. Tag release if applicable (`git tag v1.x.x`)

**Deployment Steps:**

**Option A: Automatic (Recommended)**
```bash
# Merge triggers automatic Vercel deployment
git checkout main
git pull origin main
git merge feature/branch-name
git push origin main

# Vercel automatically:
# - Detects push to main
# - Runs build
# - Deploys to production
# - Provides deployment URL
```

**Option B: Manual**
1. Log into Vercel dashboard
2. Navigate to Attensi Spin project
3. Go to "Deployments" tab
4. Click "Redeploy" on latest production deployment
5. Confirm redeployment

**Post-Deployment:**
1. Verify deployment URL
2. Run smoke tests (see section 6.1)
3. Monitor error logs for 30 minutes
4. Check key metrics (response time, error rate)
5. Notify stakeholders of successful deployment

**Estimated Deployment Time:** 3-5 minutes

---

### 5.2 Database Schema Changes

**Procedure:**
1. **Write Migration:**
   ```sql
   -- File: supabase/migrations/20251212_add_column.sql
   ALTER TABLE participants
   ADD COLUMN email TEXT;
   ```

2. **Test in Dev:**
   ```bash
   # Apply migration to dev database
   supabase db push

   # Test application with new schema
   npm run dev
   ```

3. **Test in Staging:**
   ```bash
   # Apply to staging
   supabase db push --project-ref staging-ref

   # Run QA tests
   ```

4. **Deploy to Production:**
   ```bash
   # Backup database first (automatic with Supabase)

   # Apply migration during maintenance window
   supabase db push --project-ref prod-ref

   # Verify schema change
   supabase db diff
   ```

5. **Rollback (if needed):**
   ```sql
   -- Create rollback migration
   ALTER TABLE participants DROP COLUMN email;
   ```

**Important:**
- Always test migrations in dev/staging first
- Use transactions for complex migrations
- Have rollback script ready
- Schedule during low-usage hours if possible

---

### 5.3 Emergency Hotfix Deployment

**Scenario:** Critical bug or security vulnerability

**Fast-Track Procedure:**
1. **Create Hotfix Branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-security-fix
   ```

2. **Implement Fix:**
   - Write minimal code to resolve issue
   - Add test if possible
   - Commit with clear message

3. **Expedited Review:**
   - Create PR
   - Request immediate review from Technical Lead
   - Run automated tests

4. **Deploy:**
   - Merge to main (expedited approval)
   - Monitor deployment closely
   - Run smoke tests immediately

5. **Post-Hotfix:**
   - Document incident
   - Full testing within 24 hours
   - Post-mortem within 48 hours
   - Update runbooks if needed

**Estimated Time:** < 2 hours from issue identification to deployment

---

### 5.4 Rollback Procedures

**When to Rollback:**
- Critical errors in production
- Core functionality broken
- Security vulnerability introduced
- Severe performance degradation
- Data corruption risk

**Rollback Methods:**

**Method 1: Vercel Instant Rollback (Fastest)**
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"
4. Confirm rollback
5. **Time:** ~1 minute

**Method 2: Git Revert**
```bash
# Revert the problematic commit
git revert <commit-hash>
git push origin main

# Vercel auto-deploys reverted version
```

**Method 3: Redeploy Previous Tag**
```bash
git checkout v1.0.0  # Previous working version
git push origin HEAD:main --force  # Use with caution

# Or create revert branch
git checkout -b revert-to-v1.0.0 v1.0.0
git push origin revert-to-v1.0.0
# Then deploy via Vercel
```

**Database Rollback:**
```bash
# Restore from Supabase backup
supabase db restore --project-ref prod-ref --backup-id <backup-id>
```

**Post-Rollback:**
1. Notify stakeholders
2. Document reason for rollback
3. Fix issue in separate branch
4. Re-test thoroughly
5. Re-deploy with fix

---

## 6. Operational Procedures

### 6.1 Smoke Tests (Post-Deployment)

**Purpose:** Verify core functionality after deployment

**Test Cases (5 minutes):**

1. **Application Loads:**
   - [ ] Visit https://spin.attensi.com
   - [ ] Verify page loads within 2 seconds
   - [ ] No console errors

2. **Add Name:**
   - [ ] Enter name in input field
   - [ ] Click "Add" button
   - [ ] Verify name appears in list

3. **QR Code:**
   - [ ] Verify QR code displays
   - [ ] Scan with mobile (if possible)
   - [ ] Verify session ID in URL

4. **Spin Wheel:**
   - [ ] Add 3+ names
   - [ ] Click "SPIN" button
   - [ ] Verify wheel spins and winner selected
   - [ ] Verify confetti animation plays

5. **Database Connection:**
   - [ ] Add name
   - [ ] Refresh page
   - [ ] Verify name persists (session continuity)

6. **Real-time Sync (if possible):**
   - [ ] Open two browser windows
   - [ ] Add name in one window
   - [ ] Verify appears in other window

**Pass Criteria:** All tests pass without errors

---

### 6.2 Health Checks

**Automated Health Checks:**
- **Frequency:** Every 5 minutes
- **Tool:** Vercel uptime monitoring (built-in)
- **Endpoint:** Homepage (/)

**Manual Health Checks:**
- **Frequency:** Daily (business hours)
- **Checklist:**
  - [ ] Application accessible
  - [ ] Response time < 2 seconds
  - [ ] No errors in Vercel logs
  - [ ] Supabase database responsive
  - [ ] No security alerts

**Health Indicators:**
| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Uptime | 99.9%+ | 99-99.9% | < 99% |
| Response Time | < 2s | 2-5s | > 5s |
| Error Rate | < 0.1% | 0.1-1% | > 1% |
| Database Queries | < 100ms | 100-500ms | > 500ms |

---

### 6.3 Monitoring and Alerting

**What to Monitor:**

1. **Application Metrics:**
   - Uptime / availability
   - Page load time
   - Time to interactive
   - API response times
   - Error rate

2. **Infrastructure Metrics:**
   - Vercel function execution time
   - Bandwidth usage
   - Build success rate

3. **Database Metrics:**
   - Query performance
   - Connection pool usage
   - Database size
   - Backup status

4. **Security Metrics:**
   - Failed authentication attempts (if applicable)
   - Unusual traffic patterns
   - Dependency vulnerabilities

5. **Business Metrics:**
   - Active sessions
   - Total participants added (anonymized)
   - Session creation rate

**Monitoring Tools:**

| Tool | Purpose | Status |
|------|---------|--------|
| Vercel Analytics | Performance, usage | Included |
| Vercel Logs | Error logs, function logs | Included |
| Supabase Dashboard | Database metrics | Included |
| Error Tracking (Sentry) | Error monitoring | **TO BE CONFIGURED** |
| Uptime Monitoring (UptimeRobot) | Uptime alerts | **TO BE CONFIGURED** |

**Alerting Configuration:**

| Alert | Condition | Recipient | Priority |
|-------|-----------|-----------|----------|
| Application Down | Uptime < 100% for 5 min | DevOps, On-call | Critical |
| High Error Rate | Error rate > 5% | DevOps | High |
| Slow Response | Avg response time > 5s | DevOps | Medium |
| Database Issues | Query time > 1s | DevOps | High |
| Security Alert | Vulnerability detected | Security Officer | High |

**Alert Channels:**
- Email: devops@attensi.com
- Slack: #attensispin-alerts (if available)
- PagerDuty: For critical alerts (if configured)

---

### 6.4 Log Management

**Log Locations:**
1. **Application Logs:** Vercel Dashboard → Logs
2. **Database Logs:** Supabase Dashboard → Logs
3. **Build Logs:** Vercel Dashboard → Deployments → [Deployment] → Logs

**Log Retention:**
- **Vercel:** 1 month (free tier) / 3 months (paid)
- **Supabase:** 7 days (free tier) / configurable (paid)

**Log Review:**
- **Frequency:** Daily
- **Focus:** Errors, warnings, security events
- **Owner:** DevOps / Developer on rotation

**Log Sanitization:**
- Participant names should NOT appear in logs
- Session IDs are OK (not PII)
- Review log statements for PII exposure

---

### 6.5 Performance Management

**Performance Targets:**
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.0s |
| Largest Contentful Paint | < 2.0s |
| Time to Interactive | < 3.0s |
| Cumulative Layout Shift | < 0.1 |
| First Input Delay | < 100ms |
| Lighthouse Score | > 90 |

**Performance Monitoring:**
- **Tool:** Lighthouse CI (to be configured)
- **Frequency:** On every deployment
- **Action:** Block deployment if score drops > 10 points

**Performance Optimization:**
- Code splitting (Vite automatic)
- Image optimization (use WebP)
- Lazy loading (React.lazy)
- CDN caching (Vercel automatic)
- Compression (Gzip/Brotli automatic)

---

## 7. Backup and Recovery

### 7.1 Backup Strategy

**What to Back Up:**
1. **Database:** Participants table (Supabase automatic)
2. **Source Code:** Git repository (GitHub)
3. **Configuration:** Environment variables (documented)

**Backup Schedule:**

| Component | Frequency | Retention | Method |
|-----------|-----------|-----------|--------|
| Database | Daily (automatic) | 7 days (free) / 30 days (paid) | Supabase automatic |
| Point-in-time | Continuous | 7 days | Supabase WAL |
| Git Repository | On every commit | Unlimited | GitHub |
| Environment Config | On change | Version controlled | Documentation |

**Backup Verification:**
- **Frequency:** Monthly
- **Process:** Attempt restore to dev environment
- **Owner:** DevOps

---

### 7.2 Recovery Procedures

#### 7.2.1 Application Failure Recovery

**Scenario:** Application not loading

**Steps:**
1. Check Vercel status page
2. Review recent deployments
3. Check Vercel logs for errors
4. If recent deployment, rollback (see 5.4)
5. If not deployment-related, check Supabase status
6. Contact Vercel support if needed

**Recovery Time Objective (RTO):** < 30 minutes

---

#### 7.2.2 Database Recovery

**Scenario:** Data corruption or accidental deletion

**Steps:**
1. **Stop Further Damage:**
   - Disable write access if needed
   - Identify scope of corruption

2. **Identify Restore Point:**
   ```bash
   # List backups
   supabase db backups list --project-ref prod-ref
   ```

3. **Restore to Recovery Environment (Test):**
   ```bash
   # Restore to staging first
   supabase db restore --project-ref staging-ref --backup-id <id>
   ```

4. **Verify Restored Data:**
   - Check data integrity
   - Run test queries
   - Verify timestamps

5. **Restore to Production:**
   ```bash
   # Notify users of maintenance
   supabase db restore --project-ref prod-ref --backup-id <id>
   ```

6. **Verify and Resume:**
   - Run smoke tests
   - Verify application works
   - Notify users

**Recovery Time Objective (RTO):** < 2 hours
**Recovery Point Objective (RPO):** < 24 hours (daily backup)

---

#### 7.2.3 Complete System Recovery

**Scenario:** Catastrophic failure (very unlikely)

**Steps:**
1. **Create New Infrastructure:**
   - New Vercel project
   - New Supabase project

2. **Restore Database:**
   - Import from latest backup
   - Or restore from point-in-time recovery

3. **Deploy Application:**
   - Deploy from Git (specific tag)
   - Configure environment variables

4. **Update DNS:**
   - Point domain to new Vercel project

5. **Verify and Test:**
   - Full smoke test suite
   - Load testing

**Estimated Recovery Time:** 4-8 hours

---

## 8. Maintenance Procedures

### 8.1 Routine Maintenance

**Daily:**
- [ ] Review error logs
- [ ] Check uptime metrics
- [ ] Monitor alert channels

**Weekly:**
- [ ] Review performance metrics
- [ ] Check for dependency updates
- [ ] Review security alerts
- [ ] Backup verification (monthly rotation)

**Monthly:**
- [ ] Dependency updates (security patches)
- [ ] Review and clean up old sessions (verify auto-deletion working)
- [ ] Performance optimization review
- [ ] Cost review (Supabase, Vercel usage)

**Quarterly:**
- [ ] Security audit
- [ ] Disaster recovery drill
- [ ] Documentation review
- [ ] Process improvement review

---

### 8.2 Dependency Updates

**Process:**
1. **Check for Updates:**
   ```bash
   npm outdated
   ```

2. **Review Changes:**
   - Check changelogs for breaking changes
   - Assess security impact

3. **Update (Patch Versions - Low Risk):**
   ```bash
   npm update
   git commit -am "chore: update dependencies (patch versions)"
   ```

4. **Update (Minor/Major Versions - Higher Risk):**
   ```bash
   npm install react@latest  # Example
   # Test thoroughly
   git commit -am "chore: update React to v18.3"
   ```

5. **Security Updates (Urgent):**
   ```bash
   npm audit fix
   # Test immediately
   # Deploy as emergency change if critical
   ```

**Frequency:**
- Security updates: Immediately
- Patch updates: Monthly
- Minor/Major updates: Quarterly or as needed

---

### 8.3 Data Retention Management

**Automated Deletion:**
- **Schedule:** Daily at 02:00 UTC
- **Method:** Supabase scheduled function
- **Query:**
  ```sql
  DELETE FROM participants
  WHERE created_at < NOW() - INTERVAL '30 days';
  ```

**Verification:**
```sql
-- Check oldest session
SELECT MIN(created_at) FROM participants;

-- Should never be older than 30 days
```

**Manual Session Deletion:**
- Session hosts can delete their own session immediately
- Method: "Clear All" or "Delete Session" button

**Audit:**
- Monthly review to ensure policy compliance
- Document in compliance log

---

## 9. Security Operations

### 9.1 Security Monitoring

**Daily:**
- Review Supabase audit logs
- Check for unusual access patterns
- Monitor dependency vulnerabilities

**Weekly:**
- Run `npm audit`
- Review Vercel security logs
- Check for new CVEs affecting dependencies

**Monthly:**
- Security scan with OWASP ZAP or similar
- Review RLS policies
- Penetration testing (if resources available)

---

### 9.2 Incident Response

**See:** INCIDENT-RESPONSE-PLAN.md for detailed procedures

**Quick Reference:**
1. **Detect:** Monitoring alerts, user reports
2. **Assess:** Severity, impact, scope
3. **Contain:** Isolate affected systems
4. **Eradicate:** Remove threat
5. **Recover:** Restore normal operations
6. **Lessons Learned:** Post-mortem, improve defenses

---

## 10. Disaster Recovery

### 10.1 Disaster Scenarios

| Scenario | Likelihood | Impact | Mitigation |
|----------|-----------|--------|------------|
| Vercel Outage | Low | High | Wait for recovery, communicate to users |
| Supabase Outage | Low | High | Wait for recovery, escalate to Supabase |
| Data Breach | Very Low | Critical | Incident response, notification |
| Accidental Data Deletion | Low | Medium | Restore from backup |
| DDoS Attack | Low | Medium | Rely on Vercel DDoS protection |
| Developer Error | Medium | Low-High | Rollback, code review improvements |

### 10.2 Business Continuity

**Maximum Tolerable Downtime (MTD):** 4 hours
**Recovery Time Objective (RTO):** 2 hours
**Recovery Point Objective (RPO):** 24 hours

**Communication Plan:**
- **Internal:** Slack, email
- **External:** Status page (if configured), email to known users

---

## 11. Cost Management

### 11.1 Current Costs (Estimated)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby (or Pro) | $0 (or $20) |
| Supabase | Free (or Pro) | $0 (or $25) |
| Domain | [TBD] | ~$10/year |
| **Total** | | **$0-45/month** |

### 11.2 Cost Monitoring

**Review Monthly:**
- Vercel bandwidth usage
- Supabase database size
- Function execution time

**Optimization:**
- Monitor for unusual spikes
- Optimize database queries
- Implement caching if needed

---

## 12. Troubleshooting Guide

### 12.1 Common Issues

#### Issue: Application Won't Load
**Symptoms:** Blank page, loading spinner indefinitely
**Causes:**
- Vercel deployment failed
- JavaScript error
- Supabase connection issue

**Diagnosis:**
1. Check browser console for errors
2. Check Vercel deployment status
3. Check Supabase status page

**Resolution:**
- Rollback deployment if recent change
- Fix JavaScript error and redeploy
- Wait for Supabase recovery

---

#### Issue: Names Not Syncing Between Devices
**Symptoms:** Name added on mobile doesn't appear on main wheel
**Causes:**
- Supabase real-time connection issue
- Session ID mismatch
- Network connectivity

**Diagnosis:**
1. Check browser console for WebSocket errors
2. Verify session ID in URL matches QR code
3. Check Supabase real-time status

**Resolution:**
- Refresh both devices
- Regenerate QR code
- Check Supabase logs

---

#### Issue: Wheel Won't Spin
**Symptoms:** Click "SPIN" button, nothing happens
**Causes:**
- Less than 1 participant
- JavaScript error
- Animation conflict

**Diagnosis:**
1. Check participant count
2. Check browser console
3. Try different browser

**Resolution:**
- Add more participants
- Fix JavaScript error
- Clear browser cache

---

### 12.2 Escalation Path

**Level 1: Self-Service**
- Check troubleshooting guide
- Review documentation
- Search GitHub issues

**Level 2: Development Team**
- Contact: dev-team@attensi.com
- For: Application bugs, feature issues

**Level 3: DevOps**
- Contact: devops@attensi.com
- For: Deployment, infrastructure, performance

**Level 4: External Support**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support

---

## 13. Runbook Summary

### 13.1 Quick Reference

| Task | Commands / Steps |
|------|------------------|
| Deploy to Production | Merge to `main` → Vercel auto-deploys |
| Rollback | Vercel Dashboard → Promote previous deployment |
| View Logs | Vercel Dashboard → Logs |
| Database Backup | Automatic (Supabase) |
| Run Smoke Tests | See section 6.1 |
| Emergency Hotfix | See section 5.3 |

---

## 14. Contacts and Escalation

| Role | Contact | Availability |
|------|---------|--------------|
| On-Call Engineer | [Phone/Email] | 24/7 |
| Technical Lead | [Email] | Business hours |
| DevOps Team | devops@attensi.com | Business hours |
| Security Officer | security@attensi.com | Business hours |
| Vercel Support | https://vercel.com/support | 24/7 (paid plans) |
| Supabase Support | support@supabase.io | 24/7 (paid plans) |

---

## 15. Document Maintenance

**Review Schedule:** Quarterly or after major changes
**Owner:** DevOps Lead
**Next Review:** [3 months from approval]

**Update Triggers:**
- Infrastructure changes
- New tools or services
- Process improvements
- Incident learnings

---

## 16. Related Documents

- CHANGE-MANAGEMENT-PROCESS.md
- INCIDENT-RESPONSE-PLAN.md
- SECURITY-RISK-ASSESSMENT.md
- QUALITY-ASSURANCE-PLAN.md
- README.md
- TROUBLESHOOTING.md

---

## 17. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| DevOps Lead | | | |
| Technical Lead | | | |
| Security Officer | | | |
| Project Owner | | | |

---

**Document Control:**
- Version: 1.0
- Classification: Internal
- Review Status: Draft - Requires DevOps Review
- Next Review: Quarterly
- Document ID: ATTENSISPIN-DOG-001
