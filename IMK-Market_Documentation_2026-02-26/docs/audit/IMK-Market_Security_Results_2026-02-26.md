# IMK-Market Security Test Results
Date: 2026-02-26

**Summary**
- Static security review completed.
- Live security testing blocked due to lack of live access and credentials.

**Tests Performed (Static)**
- Auth token handling and refresh flow (`server/routes/auth.ts`, `server/auth-utils.ts`)
- RBAC enforcement and route guards (`server/auth-utils.ts`, `server/index.ts`)
- Input validation and ORM usage (Zod and Prisma)
- CSRF handling for refresh and logout (`server/routes/auth.ts`, `src/lib/api.ts`)
- Payment webhook verification logic (`server/index.ts`)

**Findings (CVSS)**
- SEC-01: Client price trusted in order creation (7.5 High)
- SEC-02: Stripe line items built from client price (7.5 High)
- SEC-03: Login rate limiters not applied (5.3 Medium)
- SEC-04: Admin login role enforcement missing and client role override (5.3 Medium)
- SEC-05: Access token stored in localStorage (4.8 Medium)
- SEC-06: Tracking lookup without email or phone (4.0 Medium)
- SEC-07: Mock API fallback if DATABASE_URL missing (4.0 Medium)

**Not Tested (Blocked)**
- Live HTTPS and HSTS verification
- Automated vuln scanning (OWASP ZAP)
- Rate limit behavior under load
- Real payment provider callbacks

**Recommendations**
- Compute prices server-side and validate product IDs.
- Apply login rate limiting on auth endpoints.
- Remove client-side role overrides and enforce server roles.
- Store tokens in httpOnly cookies or memory.
- Require email or phone for tracking lookup.

**Re-test Plan**
- Attempt price tampering and verify rejection.
- Attempt brute-force logins and verify throttling.
- Validate that non-admin users cannot access admin UI or APIs.
- Run ZAP against staging.

**Local Mock Validation (2026-02-26)**
- Confirmed SEC-01/SEC-02 via mock API: order creation and payment initiation accept client price=0 and return total/amount=0.
- Confirmed tracking endpoint requires email/phone when using orderId.
