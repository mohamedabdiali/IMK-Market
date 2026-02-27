# IMK-Market Local Mock API Test Results
Date: 2026-02-26
Environment: Local mock API (server/mock-api-full.cjs) on http://localhost:5050
Notes: Results reflect mock server behavior and do not confirm production.

## Authentication
- Admin login (admin@imkmarket.com / Demo123456!) returns roles ["Manager"], isSuperAdmin false.
- Super Admin login (admin@primmesisc.com / SuperSecure123!@#) returns roles ["Super Admin"], isSuperAdmin true.
- Seller login (seller@example.com / Seller123!@#) returns roles ["Seller"], seller status active.
- Customer login (+23270000000 / Demo@12345) returns roles ["Customer"].
- Invalid admin password returns 401.

## Admin Analytics
- totalRevenue: 9099.63
- totalOrders: 8
- totalProducts: 304
- totalCustomers: 4

## Orders
- /api/admin/orders returns Count=8.
- Create order with client price=0 results in total=0 and paymentStatus initialized (sample run order id: ORD-D7C210).
- Order tracking requires email or phone; without verification returns 400; with email returns order.

## Payments
- /api/payments/initiate accepts client price=0 and returns amount=0 (sample run payment id: PAY-2E79BAC7).

## Products
- /api/products?search=phone&sort=price returns Count=304.

## Seller Onboarding
- /api/admin/pending-products returns pending list (sample id: PEND-ACB00A).
- Approve endpoint returns status approved for pending product.

## Additional Auth + Validation
- Refresh without CSRF returns 403; refresh with CSRF succeeds and rotates token.
- Logout without CSRF returns 403; logout with CSRF succeeds.
- Password reset requires valid session; short password returns 400; valid password succeeds.
- Customer registration: invalid email returns 400; duplicate phone returns 409; valid registration succeeds.

## RBAC (Mock Limitation)
- Admin endpoints require only a non-empty Bearer token in mock; customer token can access admin analytics.
- No-token access returns 401.

## Orders + Payments
- Order creation with invalid items returns 400.
- Approving COD payment returns 400 (as expected).
- Manual payment approval without proof returns 400; proof upload succeeds; approval then marks payment paid and order processing.
- Order status patch rejects invalid status (400) and accepts valid status updates (e.g., shipped).

## TESTING.md Credential Check (Mock)
- Admin login with manager@imk-market.com / Manager123!@# returns 401 in mock.
- Customer login with +232-76-123-4567 / Customer123!@# returns 401 in mock.
- Indicates TESTING.md credentials do not align with mock defaults unless database is seeded with those values.
