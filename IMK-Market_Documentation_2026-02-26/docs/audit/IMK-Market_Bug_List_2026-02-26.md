# IMK-Market Bug List
Date: 2026-02-26

| ID | Severity | Title | Repro | Expected | Actual | Evidence | Fix |
| BUG-01 | Critical | Order totals trust client prices | 1. Create order 2. Tamper payload price 3. Submit | Server recalculates or rejects | Order accepted with low total | `server/index.ts` | Recalculate from product IDs |
| BUG-02 | Critical | Stripe line items use client prices | 1. Initiate Stripe payment 2. Tamper line item price | Server uses canonical price | Stripe session uses tampered price | `server/index.ts` | Build line items from DB |
| BUG-03 | High | Login rate limiters not applied | 1. Attempt repeated logins | Requests throttled | No login throttling | `server/index.ts`, `server/routes/auth.ts` | Apply rate limiters |
| BUG-04 | High | Admin login assigns admin role locally | 1. Login via admin tab with customer account | Access denied | Admin UI opens but API returns 403 | `src/context/AuthContext.tsx` | Remove client role override |
| BUG-05 | Medium | Access token stored in localStorage | 1. Login 2. Inspect storage | Token protected | Token stored in localStorage | `src/context/AuthContext.tsx` | Use httpOnly cookies |
| BUG-06 | Medium | Stock not validated or decremented | 1. Order items with low stock | Order blocked or stock updated | Order succeeds without stock update | `server/index.ts` | Validate and decrement stock |
| BUG-07 | Medium | Tracking lookup without email or phone | 1. Query /api/orders/track with tracking id | Verification required | Tracking data returned | `server/index.ts` | Require email or phone |
| BUG-08 | Medium | Mock API fallback in production | 1. Deploy without DATABASE_URL | API fails closed | Mock API serves data | `api/[...all].ts` | Fail closed on missing DB |
| BUG-09 | Medium | Missing forgot password flow | 1. Attempt password recovery | Reset email flow | No endpoint | `server/routes/auth.ts` | Implement reset request |
| BUG-10 | Low | Audit logs missing on key admin actions | 1. Update order status | Audit log written | No audit log entry | `server/index.ts` | Add createAuditLog calls |
| BUG-11 | Low | Docs mismatch for test credentials | 1. Follow TESTING.md | Credentials work | Random passwords generated | `TESTING.md`, `server/db-seed.ts` | Update docs |
| BUG-12 | Low | Mobile and API divergence | 1. Compare mobile auth to API | Same backend | Firebase used instead | `flutter_app/lib/*` | Align or document split |
