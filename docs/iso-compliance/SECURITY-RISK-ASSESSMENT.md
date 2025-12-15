# Security Risk Assessment - Attensi Spin
**Document Version:** 1.0
**Date:** 2025-12-12
**Project:** Attensi Spin - Name Wheel Application
**Owner:** Attensi Development Team
**Status:** Draft - Requires Review

## 1. Executive Summary

This document identifies, assesses, and provides mitigation strategies for security risks associated with the Attensi Spin application. The assessment follows ISO 27001 risk management principles.

## 2. System Overview

**Application Type:** Web-based real-time name wheel application
**Technology Stack:** React, Vite, Supabase (PostgreSQL + Real-time)
**Deployment:** Vercel (planned)
**Data Handled:** Session IDs, participant names
**User Base:** Internal Attensi users and external participants

## 3. Risk Assessment Matrix

### Risk Levels
- **Critical (5):** Immediate action required
- **High (4):** Address within 1 week
- **Medium (3):** Address within 1 month
- **Low (2):** Address as resources permit
- **Minimal (1):** Monitor only

### Risk Formula
Risk Score = Likelihood (1-5) × Impact (1-5)

---

## 4. Identified Risks

### 4.1 Data Protection & Privacy Risks

#### RISK-001: Unauthorized Access to Session Data
**Category:** Data Security
**Likelihood:** 3 (Medium)
**Impact:** 4 (High)
**Risk Score:** 12 (HIGH)

**Description:**
Participants from one session could potentially access names from another session if session isolation is compromised.

**Current Controls:**
- Session-based data filtering in Supabase queries
- Unique session IDs (UUID v4)

**Vulnerabilities:**
- No server-side session validation
- Client-side filtering could be bypassed
- Row Level Security (RLS) not confirmed in Supabase

**Mitigation Plan:**
1. Implement Supabase Row Level Security (RLS) policies
2. Add server-side session validation
3. Regular audit of session access logs
4. Implement session expiry mechanism

**Owner:** Backend Developer
**Target Date:** Before production deployment
**Status:** OPEN

---

#### RISK-002: Personal Data Retention
**Category:** GDPR Compliance
**Likelihood:** 5 (Certain)
**Impact:** 4 (High)
**Risk Score:** 20 (CRITICAL)

**Description:**
Currently, participant names are stored indefinitely in Supabase without automatic deletion, violating GDPR data minimization principles.

**Current Controls:**
- None (data persists indefinitely)

**Vulnerabilities:**
- No data retention policy
- No automated deletion mechanism
- No user consent mechanism

**Mitigation Plan:**
1. Implement 30-day automatic data deletion policy
2. Add Supabase scheduled function to purge old sessions
3. Display data retention notice to users
4. Provide manual session deletion option
5. Document retention policy in Privacy Notice

**Owner:** Product Owner + Backend Developer
**Target Date:** Before production deployment
**Status:** OPEN - CRITICAL

---

#### RISK-003: PII Exposure in Logs/Analytics
**Category:** Data Leakage
**Likelihood:** 3 (Medium)
**Impact:** 3 (Medium)
**Risk Score:** 9 (MEDIUM)

**Description:**
Participant names could be logged in browser console, error logs, or analytics tools.

**Current Controls:**
- Vercel Analytics included in dependencies

**Vulnerabilities:**
- No log sanitization confirmed
- Console.log statements may expose names
- Error messages could include participant data

**Mitigation Plan:**
1. Audit codebase for console.log statements containing names
2. Implement log sanitization for production
3. Configure Vercel Analytics to exclude PII
4. Review error handling to prevent data leakage
5. Add CSP headers to prevent data exfiltration

**Owner:** Frontend Developer
**Target Date:** 1 week
**Status:** OPEN

---

### 4.2 Application Security Risks

#### RISK-004: Cross-Site Scripting (XSS)
**Category:** Input Validation
**Likelihood:** 4 (High)
**Impact:** 4 (High)
**Risk Score:** 16 (HIGH)

**Description:**
Malicious users could inject JavaScript through name input fields, potentially affecting other users in the same session.

**Current Controls:**
- React's default XSS protection (escaping)

**Vulnerabilities:**
- No explicit input validation
- No Content Security Policy (CSP) headers
- dangerouslySetInnerHTML not audited

**Mitigation Plan:**
1. Audit all user input points for proper sanitization
2. Implement input length limits (already partially done)
3. Add Content Security Policy headers
4. Implement input character whitelist/blacklist
5. Add automated XSS testing

**Owner:** Frontend Developer
**Target Date:** 1 week
**Status:** OPEN

---

#### RISK-005: API Key Exposure
**Category:** Secrets Management
**Likelihood:** 3 (Medium)
**Impact:** 5 (Critical)
**Risk Score:** 15 (HIGH)

**Description:**
Supabase API keys and URLs are stored in .env file and could be committed to version control or exposed in build artifacts.

**Current Controls:**
- .gitignore includes .env file
- Environment variables used

**Vulnerabilities:**
- .env file exists in repository (checked in)
- Anon key is exposed to client-side (by design but risky)
- No key rotation policy
- No monitoring for exposed secrets

**Mitigation Plan:**
1. Verify .env is not committed to Git history
2. Use git-secrets or similar tool to prevent future commits
3. Document that anon key is public but protected by RLS
4. Implement Supabase RLS to protect against anon key misuse
5. Set up secret scanning in CI/CD
6. Document key rotation procedures

**Owner:** DevOps + Security Team
**Target Date:** Before production deployment
**Status:** OPEN

---

#### RISK-006: Dependency Vulnerabilities
**Category:** Supply Chain Security
**Likelihood:** 3 (Medium)
**Impact:** 4 (High)
**Risk Score:** 12 (HIGH)

**Description:**
Third-party npm packages may contain known security vulnerabilities.

**Current Controls:**
- npm package.json with specific versions

**Vulnerabilities:**
- No automated vulnerability scanning
- Dependencies not audited recently
- No update policy

**Mitigation Plan:**
1. Run `npm audit` and fix critical/high vulnerabilities
2. Implement Dependabot or Snyk for automated scanning
3. Document dependency update policy
4. Create license compliance report
5. Regular security updates (monthly)

**Owner:** Development Team
**Target Date:** 1 week
**Status:** OPEN

---

### 4.3 Infrastructure & Deployment Risks

#### RISK-007: Lack of HTTPS Enforcement
**Category:** Transport Security
**Likelihood:** 2 (Low)
**Impact:** 5 (Critical)
**Risk Score:** 10 (MEDIUM)

**Description:**
If HTTPS is not properly enforced, data could be transmitted in plaintext.

**Current Controls:**
- Vercel provides HTTPS by default

**Vulnerabilities:**
- No HSTS headers confirmed
- HTTP redirect not verified
- Mixed content possible

**Mitigation Plan:**
1. Verify HTTPS enforcement in Vercel configuration
2. Add HSTS headers (Strict-Transport-Security)
3. Test for mixed content warnings
4. Document SSL/TLS configuration

**Owner:** DevOps
**Target Date:** Before production deployment
**Status:** OPEN

---

#### RISK-008: No Rate Limiting
**Category:** Availability
**Likelihood:** 3 (Medium)
**Impact:** 3 (Medium)
**Risk Score:** 9 (MEDIUM)

**Description:**
Malicious users could flood the system with requests, causing service degradation or data pollution.

**Current Controls:**
- None identified

**Vulnerabilities:**
- Unlimited name additions per session
- No throttling on QR code page
- Supabase rate limits exist but not configured

**Mitigation Plan:**
1. Implement client-side rate limiting
2. Configure Supabase rate limiting policies
3. Add CAPTCHA for high-frequency submissions
4. Monitor for abuse patterns
5. Implement session-level limits (e.g., max 1000 names)

**Owner:** Backend Developer
**Target Date:** 1 month
**Status:** OPEN

---

#### RISK-009: Insufficient Monitoring & Logging
**Category:** Incident Detection
**Likelihood:** 4 (High)
**Impact:** 3 (Medium)
**Risk Score:** 12 (HIGH)

**Description:**
Without proper monitoring, security incidents may go undetected.

**Current Controls:**
- Vercel Analytics included

**Vulnerabilities:**
- No error monitoring
- No security event logging
- No alerting configured
- No audit trail for data access

**Mitigation Plan:**
1. Implement error tracking (Sentry or similar)
2. Set up Vercel monitoring and alerts
3. Configure Supabase audit logging
4. Create incident response playbook
5. Define monitoring KPIs

**Owner:** DevOps + Security Team
**Target Date:** Before production deployment
**Status:** OPEN

---

### 4.4 Business Continuity Risks

#### RISK-010: No Backup Strategy
**Category:** Data Loss
**Likelihood:** 2 (Low)
**Impact:** 4 (High)
**Risk Score:** 8 (MEDIUM)

**Description:**
Database corruption or deletion could result in permanent data loss.

**Current Controls:**
- Supabase automatic backups (not verified)

**Vulnerabilities:**
- Backup retention period unknown
- No tested restore procedure
- No backup verification process

**Mitigation Plan:**
1. Verify Supabase backup configuration
2. Document backup retention policy (align with data retention)
3. Test backup restore procedure
4. Schedule quarterly backup drills
5. Document recovery time objectives (RTO)

**Owner:** DevOps
**Target Date:** 2 weeks
**Status:** OPEN

---

## 5. Risk Summary

| Risk Level | Count | Risks |
|-----------|-------|--------|
| Critical  | 1     | RISK-002 |
| High      | 5     | RISK-001, RISK-004, RISK-005, RISK-006, RISK-009 |
| Medium    | 4     | RISK-003, RISK-007, RISK-008, RISK-010 |
| Low       | 0     | - |

**Total Risks:** 10

---

## 6. Priority Actions (Before Production)

### Must Fix (Blocking Production Release)
1. **RISK-002:** Implement data retention and deletion policy
2. **RISK-001:** Enable Supabase Row Level Security
3. **RISK-005:** Verify secrets management and implement RLS
4. **RISK-009:** Set up monitoring and error tracking
5. **RISK-007:** Verify HTTPS enforcement and add HSTS

### Should Fix (Within 1 Week of Release)
1. **RISK-004:** XSS prevention audit and CSP implementation
2. **RISK-006:** Dependency vulnerability audit and fixes
3. **RISK-003:** Log sanitization and PII protection

### Can Be Addressed Post-Launch
1. **RISK-008:** Rate limiting implementation
2. **RISK-010:** Backup strategy documentation and testing

---

## 7. Residual Risk Acceptance

After mitigation, the following residual risks are accepted:

| Risk | Residual Score | Justification |
|------|----------------|---------------|
| TBD  | TBD           | To be completed after mitigation |

**Accepted By:** [Name, Title]
**Date:** [Date]

---

## 8. Review and Update Schedule

- **Next Review Date:** [3 months from deployment]
- **Review Frequency:** Quarterly or after significant changes
- **Review Owner:** Security Team Lead

---

## 9. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Owner | | | |
| Security Officer | | | |
| Data Protection Officer | | | |
| Quality Manager | | | |

---

## 10. References

- ISO 27001:2013 - Information Security Management
- GDPR Articles 5, 25, 32
- Attensi Information Security Policy [reference]
- Attensi Risk Management Framework [reference]

---

**Document Control:**
- Version: 1.0
- Classification: Internal
- Review Status: Draft
- Next Review: TBD
