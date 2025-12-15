# Data Protection and Privacy Policy - Attensi Spin
**Document Version:** 1.0
**Date:** 2025-12-12
**Project:** Attensi Spin - Name Wheel Application
**Owner:** Data Protection Officer
**Status:** Draft - Requires DPO Review

## 1. Purpose and Scope

This document defines the data protection and privacy practices for Attensi Spin in compliance with:
- General Data Protection Regulation (GDPR)
- ISO 27001 Information Security Management
- Attensi's corporate data protection policies

**Scope:** This policy applies to all personal data processed by Attensi Spin.

---

## 2. Data Protection Principles

Attensi Spin adheres to the following GDPR principles:

1. **Lawfulness, Fairness, and Transparency** - Data processed with user awareness
2. **Purpose Limitation** - Data used only for name wheel functionality
3. **Data Minimization** - Only essential data collected (names, session IDs)
4. **Accuracy** - Users control their own data entry
5. **Storage Limitation** - Data retained only as long as necessary
6. **Integrity and Confidentiality** - Appropriate security measures implemented
7. **Accountability** - Attensi demonstrates compliance

---

## 3. Data Inventory

### 3.1 Personal Data Collected

| Data Element | Type | Purpose | Legal Basis | Retention |
|--------------|------|---------|-------------|-----------|
| Participant Name | Personal Data (potentially PII) | Display on wheel, select winner | Legitimate Interest / Consent | 30 days |
| Session ID | Technical Data | Isolate sessions, enable sharing | Legitimate Interest | 30 days |
| Timestamp | Technical Data | Order participants, enable cleanup | Legitimate Interest | 30 days |
| IP Address (indirect) | Technical Data | Managed by Supabase/Vercel | Legitimate Interest | Per provider policy |

### 3.2 Data We Do NOT Collect
- Email addresses
- Phone numbers
- Physical addresses
- Payment information
- Precise geolocation
- Demographic data
- Behavioral tracking (beyond basic analytics)

### 3.3 Special Categories of Personal Data
**None.** We do not process sensitive personal data (racial origin, health data, etc.)

---

## 4. Legal Basis for Processing

### Primary Legal Basis: Legitimate Interest
**Interest:** Facilitate team-building activities and random selection events
**Necessity Test:** Name display is essential for wheel functionality
**Balancing Test:** Minimal privacy impact, users voluntarily participate

### Secondary Legal Basis: Consent (where applicable)
- Users voluntarily enter names
- Clear purpose communicated
- Can withdraw by not using service

### GDPR Article 6(1)(f) Assessment
✓ Legitimate business interest identified
✓ Processing necessary for that interest
✓ Individual rights and freedoms considered
✓ Data minimization applied
✓ No special category data involved

---

## 5. Data Lifecycle Management

### 5.1 Data Collection
**Method:** Direct entry via web forms
**Interface:**
- Main wheel page: Host enters names
- Mobile page: Participants enter their own names via QR code

**User Notification:**
- Privacy notice displayed at entry point
- Purpose clearly stated
- Optional participation

**Validation:**
- Name length: 1-50 characters
- No special validation beyond length
- Real-time sanitization applied

---

### 5.2 Data Storage

**Storage Location:** Supabase (PostgreSQL database)
**Supabase Region:** [To be specified - should be EU for GDPR compliance]
**Data Residency:** [Confirm EU data residency]

**Database Schema:**
```sql
Table: participants
- id (UUID, primary key)
- name (TEXT, max 50 chars)
- session_id (UUID, indexed)
- created_at (TIMESTAMP)
```

**Security Measures:**
- Encryption at rest (Supabase default)
- Encryption in transit (HTTPS/TLS 1.2+)
- Row Level Security (RLS) policies enforced
- Session-based access control
- Regular security updates

---

### 5.3 Data Usage

**Primary Use:** Display names on spinning wheel for random selection

**Secondary Uses:**
- Display participant count
- Show participant list to session host
- Track winners within session

**Prohibited Uses:**
- Marketing or promotional purposes
- Sharing with third parties (except service providers)
- Profiling or automated decision-making
- Cross-session data analysis

---

### 5.4 Data Retention

**Retention Period:** 30 days from session creation

**Rationale:**
- Sessions typically last < 1 hour
- 30-day retention allows session recovery if needed
- Aligns with "storage limitation" principle

**Deletion Mechanism:**
- Automated: Supabase scheduled function runs daily
- Manual: Session host can delete session immediately
- Verification: Monthly audit of deletion job

**Implementation Status:** ⚠️ TO BE IMPLEMENTED

**SQL for Automated Deletion:**
```sql
-- Run daily at 02:00 UTC
DELETE FROM participants
WHERE created_at < NOW() - INTERVAL '30 days';
```

---

### 5.5 Data Deletion

**User Rights:**
1. **Right to Erasure:** Session hosts can delete entire session
2. **Individual Deletion:** Names can be removed from wheel before spin
3. **Automated Deletion:** After 30 days automatically

**Deletion Process:**
1. Soft delete not used (hard delete immediately)
2. Backups retained per backup policy (max 30 days)
3. Logs sanitized to remove personal data after 90 days

**Verification:**
- Deletion confirmed via database query
- User receives confirmation (if requested)

---

## 6. Data Sharing and Third-Party Processors

### 6.1 Data Processors

| Processor | Purpose | Data Shared | Location | DPA Status |
|-----------|---------|-------------|----------|------------|
| Supabase Inc. | Database & real-time backend | Names, Session IDs | [Region TBD] | Required |
| Vercel Inc. | Application hosting | Indirect (HTTP requests) | Global CDN | Required |
| Vercel Analytics | Usage statistics | Anonymized metrics only | Global | Review needed |

**Data Processing Agreements (DPA):**
- ⚠️ Review and execute DPA with Supabase
- ⚠️ Review Vercel's data processing terms
- ⚠️ Ensure sub-processor list is documented

### 6.2 Data Transfers Outside EU/EEA

**Status:** To be confirmed based on Supabase region selection

**If Non-EU Transfer Required:**
- Standard Contractual Clauses (SCCs) must be in place
- Transfer Impact Assessment (TIA) required
- Document in Data Transfer Register
- User notification required

**Recommendation:** Select EU region for Supabase deployment

---

## 7. Data Subject Rights (GDPR Chapter III)

Users have the following rights under GDPR:

### 7.1 Right to Information (Articles 13-14)
**Implementation:** Privacy notice displayed on entry page
**Status:** To be implemented

### 7.2 Right of Access (Article 15)
**Implementation:** Users can contact Attensi to request their data
**Response Time:** Within 30 days
**Format:** Electronic copy provided

### 7.3 Right to Rectification (Article 16)
**Implementation:** Users can re-enter names or contact host to correct
**Response Time:** Immediate (self-service) or 30 days (via request)

### 7.4 Right to Erasure (Article 17)
**Implementation:**
- Hosts can delete entire session
- Individual names removable from wheel
- Automated deletion after 30 days
**Response Time:** Immediate

### 7.5 Right to Restriction (Article 18)
**Implementation:** User can request processing restriction
**Response Time:** Within 30 days

### 7.6 Right to Data Portability (Article 20)
**Implementation:** Provide data in JSON format
**Response Time:** Within 30 days

### 7.7 Right to Object (Article 21)
**Implementation:** Users can opt-out by not participating
**Response Time:** Immediate

### 7.8 Rights Related to Automated Decision-Making (Article 22)
**Not Applicable:** No automated decision-making occurs (wheel is random)

**Contact for Data Subject Requests:**
- Email: privacy@attensi.com [Update with actual contact]
- Web form: [If available]
- Response SLA: 30 days maximum

---

## 8. Privacy by Design and Default

### 8.1 Privacy by Design Measures

**Data Minimization:**
- ✓ Only names collected (no email, phone, etc.)
- ✓ No tracking cookies
- ✓ Session IDs generated locally (UUID)

**Session Isolation:**
- ✓ Data filtered by session_id
- ✓ No cross-session access
- ✓ Row Level Security enforced

**Pseudonymization:**
- Considered but not necessary (names are inherently identifiable)
- Session IDs act as pseudonymous identifiers for session data

**Security by Default:**
- ✓ HTTPS enforced
- ✓ No public API endpoints
- ⚠️ RLS policies to be implemented
- ⚠️ Rate limiting to be added

### 8.2 Privacy by Default Measures

**Minimal Data Sharing:**
- Data not shared between sessions by default
- No social sharing features
- No data export to third parties

**Short Retention:**
- 30-day retention (shorter than typical)
- Automatic deletion

**User Control:**
- Host controls entire session
- Individual control over own name entry
- Clear session deletion option

---

## 9. Data Breach Response

### 9.1 Detection
**Monitoring:** Error tracking, Supabase audit logs, security alerts

### 9.2 Assessment
**Criteria:** Determine if personal data breach has occurred
**Risk Assessment:** Evaluate risk to rights and freedoms

### 9.3 Notification
**To Supervisory Authority:** Within 72 hours if high risk
**To Data Subjects:** Without undue delay if high risk
**Documentation:** All breaches documented

### 9.4 Response Team
- Incident Commander: [Name]
- Data Protection Officer: [Name]
- Technical Lead: [Name]
- Communications Lead: [Name]

**See:** INCIDENT-RESPONSE-PLAN.md for detailed procedures

---

## 10. Data Protection Impact Assessment (DPIA)

**DPIA Required?** Assessed: NO

**Rationale:**
- Not large-scale processing
- No special category data
- No systematic monitoring
- No profiling or automated decisions
- Minimal privacy risk

**However:** Given Attensi's ISO certification, a lightweight DPIA is recommended.

**DPIA Conclusion:**
- Risk to data subjects: LOW
- Appropriate safeguards: Implemented
- Residual risk: ACCEPTABLE

---

## 11. Children's Privacy

**Age Restriction:** None specified
**Risk:** Participants may be children

**Safeguards:**
- No special category data collected
- No tracking or profiling
- Parental oversight expected in team contexts
- Consider adding age notice: "Intended for ages 13+"

**Recommendation:** Add notice that parental consent required for users under 16 (GDPR Article 8)

---

## 12. International Data Transfers

**Current Status:** To be confirmed

**If Using Non-EU Supabase Region:**
- Standard Contractual Clauses required
- Transfer Impact Assessment (TIA) required
- Additional safeguards may be needed

**Recommendation:** Use EU region to avoid transfer complexity

---

## 13. Compliance Verification

### 13.1 Regular Reviews
- **Frequency:** Quarterly
- **Owner:** Data Protection Officer
- **Checklist:** Data inventory, retention compliance, security measures

### 13.2 Audits
- **Internal Audit:** Annually
- **External Audit:** As part of ISO 27001 surveillance

### 13.3 Metrics
- Data subject requests received and resolved
- Data breaches (target: 0)
- Retention policy compliance (target: 100%)
- DPA coverage (target: 100%)

---

## 14. Training and Awareness

**Required for:**
- Development team: Data protection principles, secure coding
- Support team: Data subject rights handling
- Management: GDPR obligations and accountability

**Training Schedule:** Annually + onboarding

---

## 15. Policy Review and Updates

**Review Frequency:** Annually or upon:
- Significant system changes
- New data processing activities
- Regulatory changes
- Data breach incidents

**Next Review Date:** [12 months from approval]

---

## 16. Related Documents

- SECURITY-RISK-ASSESSMENT.md
- INCIDENT-RESPONSE-PLAN.md
- PRIVACY-NOTICE.md (user-facing)
- TERMS-OF-USE.md (user-facing)
- Attensi Corporate Data Protection Policy
- Attensi Information Security Policy

---

## 17. Action Items for Implementation

| # | Action | Owner | Status | Target Date |
|---|--------|-------|--------|-------------|
| 1 | Implement 30-day auto-deletion | Backend Dev | OPEN | Before prod |
| 2 | Add Supabase RLS policies | Backend Dev | OPEN | Before prod |
| 3 | Execute DPA with Supabase | Legal/DPO | OPEN | Before prod |
| 4 | Confirm Supabase region (EU) | DevOps | OPEN | Before prod |
| 5 | Create user-facing Privacy Notice | Legal/Product | OPEN | Before prod |
| 6 | Add privacy notice to UI | Frontend Dev | OPEN | Before prod |
| 7 | Implement session deletion feature | Frontend Dev | OPEN | 1 week |
| 8 | Set up data subject request process | DPO | OPEN | 2 weeks |
| 9 | Configure log sanitization | DevOps | OPEN | 1 week |
| 10 | Document data breach response | Security | OPEN | Before prod |

---

## 18. Approval and Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Data Protection Officer | | | |
| Information Security Manager | | | |
| Legal Counsel | | | |
| Project Owner | | | |

---

**Document Control:**
- Version: 1.0
- Classification: Internal
- Review Status: Draft - Requires DPO Approval
- Next Review: [Date]
- Document ID: ATTENSISPIN-DPP-001
