# IMK-Market GitHub Issue Payloads
Date: 2026-02-26
Repo: https://github.com/mohamedabdiali/IMK-Market
Status: Prepared offline (live GitHub access blocked in tooling)

Use these as issue bodies in GitHub. Labels are suggestions.

---

**Issue 1: Order totals trust client prices (P0)**
Severity: Critical
Labels: `security`, `payment`, `p0`
Repro: Create an order and tamper `items[].price` before submission.
Expected: Server recalculates totals from product catalog and rejects mismatches.
Actual: Order is accepted and total is based on tampered price.
Evidence: `server/index.ts` (createOrderRecord, /api/orders).
Fix: Fetch product prices server-side by `productId`, compute totals, reject mismatches.

---

**Issue 2: Stripe line items use client prices (P0)**
Severity: Critical
Labels: `security`, `payment`, `stripe`, `p0`
Repro: Initiate Stripe payment and tamper `items[].price`.
Expected: Stripe line items use server-validated prices.
Actual: Stripe session uses client-provided price.
Evidence: `server/index.ts` (/api/payments/initiate).
Fix: Build Stripe line items from server-side prices.

---

**Issue 3: Login rate limiting not applied (P1)**
Severity: High
Labels: `security`, `auth`, `p1`
Repro: Attempt rapid login attempts on /auth/*/login.
Expected: Rate limiting throttles repeated attempts.
Actual: No rate limiting is applied.
Evidence: `server/index.ts` defines limiters; `server/routes/auth.ts` does not apply them.
Fix: Apply `adminLoginLimiter` and `customerAuthLimiter` to login routes.

---

**Issue 4: Admin login does not enforce roles (P1)**
Severity: High
Labels: `security`, `rbac`, `p1`
Repro: Login on Admin tab with a non-admin account.
Expected: Login rejected due to missing admin role.
Actual: Login succeeds, client marks role as admin, UI opens but API blocks.
Evidence: `server/routes/auth.ts` (/auth/admin/login), `src/context/AuthContext.tsx`.
Fix: Enforce admin roles server-side and remove client role override.

---

**Issue 5: Access token stored in localStorage (P1)**
Severity: Medium
Labels: `security`, `auth`, `p1`
Repro: Login and inspect localStorage.
Expected: Access token stored in httpOnly cookie or memory only.
Actual: Token stored in `localStorage`.
Evidence: `src/context/AuthContext.tsx`.
Fix: Use httpOnly cookies or memory-only storage.

---

**Issue 6: Stock not validated or decremented on order (P2)**
Severity: Medium
Labels: `data-integrity`, `orders`, `p2`
Repro: Place orders for low-stock products.
Expected: Server blocks or updates stock accordingly.
Actual: Order succeeds without stock checks or decrement.
Evidence: `server/index.ts`.
Fix: Validate stock and decrement in a transaction.

---

**Issue 7: Order tracking accessible without verification (P2)**
Severity: Medium
Labels: `security`, `privacy`, `p2`
Repro: Call `/api/orders/track` with only tracking id.
Expected: Require email or phone verification.
Actual: Tracking data returned.
Evidence: `server/index.ts` (/api/orders/track).
Fix: Require email/phone or OTP verification for all tracking lookups.

---

**Issue 8: Mock API fallback in production if DATABASE_URL missing (P2)**
Severity: Medium
Labels: `deployment`, `p2`
Repro: Deploy without `DATABASE_URL` or set `USE_MOCK_API=true`.
Expected: API fails closed.
Actual: Mock API serves non-persistent data.
Evidence: `api/[...all].ts`.
Fix: Disable mock in production and fail closed.

---

**Issue 9: Missing forgot-password flow (P2)**
Severity: Medium
Labels: `auth`, `p2`
Repro: Attempt to reset password when logged out.
Expected: Reset email or token flow exists.
Actual: Only authenticated reset endpoint exists.
Evidence: `server/routes/auth.ts`.
Fix: Implement password reset request and token validation.

---

**Issue 10: Audit logs missing on key admin actions (P3)**
Severity: Low
Labels: `audit`, `p3`
Repro: Update order status or approve payment.
Expected: Audit log entries created.
Actual: No audit entries.
Evidence: `server/index.ts`.
Fix: Add `createAuditLog` to admin mutations.

---

**Issue 11: Documentation mismatch for test credentials (P3)**
Severity: Low
Labels: `docs`, `p3`
Repro: Follow `TESTING.md` creds.
Expected: Credentials work.
Actual: Seed generates random passwords.
Evidence: `TESTING.md`, `server/db-seed.ts`.
Fix: Update docs or seed deterministically for tests.

---

**Issue 12: Mobile app not aligned with API backend (P3)**
Severity: Low
Labels: `mobile`, `architecture`, `p3`
Repro: Compare Flutter app backend vs Express API.
Expected: Shared backend or documented split.
Actual: Flutter uses Firebase; web uses Express.
Evidence: `flutter_app/lib/*`.
Fix: Align or document split and data sync plan.
