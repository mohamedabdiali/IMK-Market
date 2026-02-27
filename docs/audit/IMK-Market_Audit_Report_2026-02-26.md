# IMK-Market Deep Audit Report
Date: 2026-02-26
Target: https://imk-market.vercel.app/
Repo: c:\Users\PRIME\Desktop\E-commerce-market app

**Scope**
- Web app (React + Vite)
- API server (Express + Prisma + PostgreSQL)
- Mobile apps (Flutter + Firebase)
- Multi-role access and seller workflows
- Payments, orders, notifications, analytics
- Deployment and documentation

**Methodology**
- Static review of `server/`, `src/`, `prisma/`, `api/`, `docs/`, `flutter_app/`
- Review of CI/CD and environment configuration
- Live UI, navigation, and performance checks attempted but blocked by tooling access

**Executive Summary**
- Production readiness is blocked by payment integrity and auth hardening gaps.
- The mobile app uses Firebase while the web app uses Express + Postgres, so parity is not met.
- Admin UI access can be granted to non-admin users because the client assigns `role: "admin"` after admin login regardless of server roles.
- The API can fall back to mock data if `DATABASE_URL` is missing, which is unsafe for production.

**Key P0/P1 Risks**
- P0: Order totals and Stripe line items are calculated from client-supplied prices.
- P1: Login rate limiting is defined but not applied to auth routes.
- P1: Admin login lacks role enforcement and the client forces admin role locally.
- P1: Access tokens are stored in `localStorage`, increasing XSS impact.

**Results Overview**
- Pass/Fail matrix: `docs/audit/IMK-Market_Test_Cases_2026-02-26.csv`
- Security findings: `docs/audit/IMK-Market_Security_Results_2026-02-26.md`
- Bug list: `docs/audit/IMK-Market_Bug_List_2026-02-26.md`

**Security Vulnerabilities (CVSS)**
| ID | CVSS | Severity | Finding | Evidence |
| SEC-01 | 7.5 | High | Server trusts client price in orders | `server/index.ts` createOrderRecord, /api/orders |
| SEC-02 | 7.5 | High | Stripe checkout uses client price | `server/index.ts` /api/payments/initiate |
| SEC-03 | 5.3 | Medium | Login rate limiting not applied | `server/index.ts`, `server/routes/auth.ts` |
| SEC-04 | 5.3 | Medium | Admin login lacks role enforcement and client forces admin role | `server/routes/auth.ts`, `src/context/AuthContext.tsx` |
| SEC-05 | 4.8 | Medium | Access token stored in localStorage | `src/context/AuthContext.tsx` |
| SEC-06 | 4.0 | Medium | Order tracking can be accessed with tracking id alone | `server/index.ts` /api/orders/track |
| SEC-07 | 4.0 | Medium | Mock API fallback if DATABASE_URL missing | `api/[...all].ts` |

**Functional Correctness**
- Product listing, search, filter, and sorting are implemented in web and API (`src/pages/Products.tsx`, `server/index.ts`).
- Seller registration and approval flows exist (`server/routes/auth.ts`, `server/routes/super-admin.ts`).
- Orders can be created for COD and via payment initiation (`server/index.ts`).
- Missing: customer-initiated cancellation, returns/refunds, and server-side stock enforcement.

**Role-Based Access Control**
- Server-side RBAC is enforced via JWT roles and permissions (`server/auth-utils.ts`).
- Admin UI uses `isAdmin` derived from client state; admin login assigns `role: "admin"` regardless of server roles (`src/context/AuthContext.tsx`).
- `requireAdmin` allows Sales Associate, but the admin UI blocks them (`src/components/auth/ProtectedRoute.tsx`).
- Recommendation: remove client-side role overrides and gate UI by server roles and permissions only.

**Authentication and Session Security**
- JWT tokens use 12h expiry (`server/auth-utils.ts`).
- Refresh tokens are hashed and rotated (`server/routes/auth.ts`).
- CSRF uses double-submit for refresh and logout, but the token is stored in localStorage (`src/lib/api.ts`).
- No MFA and no forgot-password flow.

**Seller Onboarding**
- Seller registration and validation are present (`server/routes/auth.ts`, `src/pages/SellerRegistration.tsx`).
- Approval and rejection are present (`server/routes/super-admin.ts`).
- Tokens are not revoked on seller status changes; consider revoking refresh tokens on suspend or reject.

**Product Lifecycle**
- Seller CRUD enforces ownership checks (`server/routes/sellers.ts`).
- Admin product management is available (`server/index.ts`).
- SKU uniqueness enforced in Prisma (`prisma/schema.prisma`).

**Order Management**
- Order creation exists for COD and payment-init (`server/index.ts`).
- Payment approval and status transitions exist for admin (`server/index.ts`).
- Missing: server-side stock checks and decrement on order placement.
- Tracking can be accessed without email or phone if tracking id is provided.

**Notifications**
- Notification storage and per-user fetch endpoints exist (`server/auth-utils.ts`, `server/routes/notifications.ts`).
- No realtime delivery channel.

**Analytics**
- Admin analytics endpoint exists (`server/index.ts` /api/admin/analytics).
- No exports, trends, or customer metrics.

**Payment and Cart**
- Stripe Checkout is implemented; however line items use client prices (`server/index.ts`).
- Manual proof flows exist for Orange Money, Afrimoney, and QMoney (`server/index.ts`).
- No tax or discount logic.

**Data Integrity**
- Order totals rely on client input.
- Audit logging exists but missing on key admin order actions (`server/index.ts`).
- Some JSON columns are stored as strings (bankDetails, notifications, audit changes) instead of JSON objects.

**Mobile and API Coverage**
- Flutter app uses Firebase Auth and Firestore (`flutter_app/lib/*`).
- Express API is not used by the Flutter app; data and auth are not shared.
- Firebase config is placeholder (`flutter_app/lib/firebase_options.dart`).

**Performance**
- Live performance metrics are blocked due to tool access issues.
- Recommended to run Lighthouse and API latency profiling on staging.

**UX and Accessibility**
- Live UX checks are blocked.
- Static review suggests adding UI permission gating in admin panels and clearer seller status messaging.

**Deployment and Environment**
- Vercel serverless routes are configured (`vercel.json`, `api/[...all].ts`).
- Mock API is used when `DATABASE_URL` is missing; ensure production envs set DB.
- CI workflow exists (`.github/workflows/ci.yml`).
- No rollback plan documented.

**Documentation**
- Deployment checklist and security summary exist (`docs/DEPLOYMENT_CHECKLIST.md`, `docs/SECURITY_SUMMARY.md`).
- Missing: API reference, role matrix, Firebase setup doc.
- `TESTING.md` credentials do not match `server/db-seed.ts` behavior.

**Compliance**
- Stripe Checkout reduces PCI scope, but PCI and privacy compliance are not fully documented.

**Blocked Defects**
- Live site access and UI or performance verification blocked by tooling.
- No staging credentials were provided for each role.

**Fix Suggestions (Priority)**
- P0: Recalculate order totals and Stripe line items server-side using product IDs.
- P1: Apply login rate limiting to auth routes.
- P1: Enforce admin roles on /auth/admin/login and remove client role overrides.
- P1: Move access tokens to httpOnly cookies or in-memory storage.
- P2: Implement stock availability checks and decrements within transactions.
- P2: Require email or phone verification for all order tracking lookups.
- P2: Align mobile app with chosen backend or document the split clearly.
- P3: Add API docs, role matrix, and a rollback plan.

**Re-test Plan**
- Re-run order and payment flows with price tampering attempts.
- Verify login rate limits and admin role enforcement.
- Test role-based UI visibility with Manager, Sales, Seller, Customer accounts.
- Run Lighthouse and API timing on staging.

**Artifacts**
- `docs/audit/IMK-Market_Audit_Report_2026-02-26.md`
- `docs/audit/IMK-Market_Test_Cases_2026-02-26.csv`
- `docs/audit/IMK-Market_Bug_List_2026-02-26.md`
- `docs/audit/IMK-Market_Security_Results_2026-02-26.md`
- `docs/audit/IMK-Market_Performance_Report_2026-02-26.md`
- `docs/audit/IMK-Market_UI_UX_Screenshots_2026-02-26.md`
- `docs/audit/IMK-Market_Submission_Artifacts_2026-02-26.md`

---

**Addendum (2026-02-26)**
- Bug tracker link provided: https://github.com/mohamedabdiali/IMK-Market
- Live GitHub access for issue creation is blocked in current tooling.
- Prepared issue payloads and CSV at:
  - docs/audit/IMK-Market_GitHub_Issues_2026-02-26.md
  - docs/audit/IMK-Market_GitHub_Issues_2026-02-26.csv

**Addendum (2026-02-26) - Local Mock API Validation**
- Local mock server tests executed against server/mock-api-full.cjs (http://localhost:5050).
- Confirmed auth responses for Super Admin, Admin (role Manager), Seller, and Customer; invalid admin login returns 401.
- Confirmed admin analytics and orders endpoints respond.
- Confirmed price tampering: order creation and payment initiation accept client price=0 and return total/amount=0.
- Confirmed order tracking requires email/phone verification (400 without verification).
- Details recorded in docs/audit/IMK-Market_Local_Mock_Test_Results_2026-02-26.md
