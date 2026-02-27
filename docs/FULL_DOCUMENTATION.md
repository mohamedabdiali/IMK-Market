# IMK-Market Full Documentation
Date: 2026-02-26
Status: Generated from repository review and local mock API validation. Live production verification was blocked in this environment.

## Overview
IMK-Market is a multi-role e-commerce platform with a web app, mobile apps, and an API backend. The system supports system administrators, managers, sales associates, sellers, and customers. It includes seller onboarding, product management, order processing, payments, notifications, analytics, and admin controls.

## Architecture Summary
- Web app: React + Vite + TypeScript + Tailwind (client routes, role-based UI, storefront and admin panels).
- API server: Express + Prisma + PostgreSQL (auth, RBAC, products, orders, payments, notifications, analytics).
- Mobile app: Flutter + Firebase (auth and data not currently shared with the Express API).
- Deployment: Vercel for web and serverless API, plus local Docker and PostgreSQL guidance.

High-level flow:
- Web and mobile clients authenticate and call API endpoints.
- API enforces roles and permissions, reads and writes to PostgreSQL via Prisma.
- Payments integrate with Stripe and manual proof flows.
- Notifications are stored server-side; delivery is currently pull-based.

## Tech Stack
- Frontend: React, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- Backend: Node.js, Express, Prisma, PostgreSQL.
- Mobile: Flutter, Firebase Auth/Firestore (separate backend).
- Dev tooling: ESLint, Prettier, npm scripts, Vercel deployment.

## Environments
- Development: Local Node server and Vite web app, optional mock API.
- Staging: Recommended for QA, security, and performance validation.
- Production: Vercel web + API with PostgreSQL and Stripe live keys.

## Configuration (.env)
Environment variables are defined in `.env.example`. Do not store secrets in the repo.

Required for production:
- DATABASE_URL
- JWT_SECRET
- ALLOWED_ORIGINS
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- PAYMENT_SUCCESS_URL
- PAYMENT_CANCEL_URL

Common variables:
- NODE_ENV
- API_PORT
- SUPPORT_EMAIL
- SUPPORT_PHONE
- ADMIN_EMAIL
- ADMIN_PASSWORD
- DEMO_CUSTOMER_PHONE
- DEMO_CUSTOMER_PASSWORD
- VITE_USE_MOCK_API
- VITE_DEMO_CUSTOMER_PHONE
- VITE_DEMO_CUSTOMER_PASSWORD
- GOOGLE_CLIENT_ID
- VITE_GOOGLE_CLIENT_ID

## Local Setup
1. Install dependencies: `npm install`
2. Configure `.env` from `.env.example`
3. Provision PostgreSQL
4. Run migrations: `npm run db:migrate`
5. Seed data: `npm run server:seed`
6. Start API: `npm run server:dev`
7. Start web: `npm run dev`

Optional mock stack:
- `npm run server:mock:full`
- `npm run dev:web`
- Or run `node scripts/dev-mock.mjs`

## Database Models (Prisma)
Key models from `prisma/schema.prisma`:
- Tenant: multi-tenant container for data separation.
- User: accounts with roles and optional seller profiles.
- Role, Permission, RolePermission, UserRole: RBAC.
- SellerProfile, SellerStatus: seller metadata and approval state.
- Category, Product, PendingProduct: catalog data.
- Order, OrderItem, OrderTrackingEvent: order lifecycle.
- Payment: payment records and proof metadata.
- Notification: user notifications.
- AuditLog: admin and system activity tracking.
- Subscription: tenant subscription metadata.
- RefreshToken: refresh token storage.
- SystemSetting, FeatureToggle: system configuration.
- EmailHistory: email activity.

## Authentication and Session Management
- Login endpoints exist for Super Admin, Admin, Seller, and Customer.
- JWT access tokens are issued with refresh tokens.
- CSRF protection is used for refresh and logout endpoints.
- Password reset endpoint exists (server-side only).
- Google OAuth is supported for seller login.

Known gaps (from audit):
- Admin login role checks are not enforced in all flows.
- Access tokens are stored in localStorage in the web app.
- Rate limiting is defined but not consistently applied on login routes.

## Role Matrix (Summary)
- Super Admin: multi-tenant management, system settings, global roles/permissions.
- Manager: admin dashboard for orders, products, inventory, analytics.
- Sales Associate: limited admin access (orders, view only).
- Seller (approved): seller dashboard, product CRUD, order view.
- Seller (pending): restricted from seller dashboard.
- Customer: storefront browsing and ordering.

## Core Workflows
Seller onboarding:
- Seller submits registration.
- Super Admin approves or rejects.
- Approved sellers gain access to seller dashboard.

Product lifecycle:
- Seller creates and manages own products.
- Admin can view and manage all products.
- Product status and inventory are tracked.

Order lifecycle:
- Customer places order (COD or payment-initiate).
- Order transitions: pending -> processing -> shipped -> delivered, with tracking events.
- Admin can update order status and tracking details.

Payments:
- Stripe checkout is supported.
- Manual proof flows exist for non-card methods.
- COD orders bypass payment approval.

Notifications:
- Notifications are stored and retrieved per-user.
- Mark read and delete endpoints exist.
- Real-time delivery is not implemented.

Analytics:
- Admin analytics endpoint summarizes revenue, orders, products, customers.
- Export and deeper reporting are limited in current implementation.

## API Surface (High-Level)
Authentication:
- POST /api/auth/super-admin/login
- POST /api/auth/admin/login
- POST /api/auth/seller/login
- POST /api/auth/seller/google
- POST /api/auth/customer/login
- POST /api/auth/customer/register
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/password/reset

Catalog and storefront:
- GET /api/categories
- GET /api/products
- GET /api/products/:id
- GET /api/products/search/suggestions
- GET /api/featured
- GET /api/trending
- GET /api/flash-deals
- GET /api/flash-ads
- GET /api/reviews/:productId

Orders and payments:
- POST /api/orders
- GET /api/orders/track
- POST /api/payments/initiate
- GET /api/payments/:id
- PATCH /api/payments/:id/proof

Admin:
- GET /api/admin/analytics
- GET /api/admin/orders
- POST /api/admin/orders/:id/approve-payment
- PATCH /api/admin/orders/:id/status
- PATCH /api/admin/orders/:id/tracking
- GET /api/admin/pending-products
- POST /api/admin/pending-products/:id/approve
- POST /api/admin/pending-products/:id/reject
- GET /api/admin/products
- POST /api/admin/products
- PATCH /api/admin/products/:id
- DELETE /api/admin/products/:id
- GET /api/admin/inventory
- PATCH /api/admin/inventory/:id
- GET /api/admin/categories
- POST /api/admin/categories
- PATCH /api/admin/categories/:id
- DELETE /api/admin/categories/:id
- GET /api/admin/flash-deals
- PUT /api/admin/flash-deals
- GET /api/admin/flash-ads
- PUT /api/admin/flash-ads
- GET /api/admin/email-history
- POST /api/admin/email/send-test
- POST /api/admin/email/low-stock-alerts

Super Admin:
- GET /api/super-admin/dashboard
- GET /api/super-admin/tenants
- POST /api/super-admin/tenants
- PATCH /api/super-admin/tenants/:id
- GET /api/super-admin/subscriptions
- POST /api/super-admin/subscriptions
- PATCH /api/super-admin/subscriptions/:id
- GET /api/super-admin/tenants/:id/analytics
- GET /api/super-admin/users
- POST /api/super-admin/users
- PATCH /api/super-admin/users/:id/roles
- DELETE /api/super-admin/users/:id
- GET /api/super-admin/permissions
- GET /api/super-admin/roles
- POST /api/super-admin/roles
- PATCH /api/super-admin/roles/:id
- DELETE /api/super-admin/roles/:id
- GET /api/super-admin/sellers/pending
- POST /api/super-admin/sellers/:id/approve
- POST /api/super-admin/sellers/:id/reject
- GET /api/super-admin/system/settings
- GET /api/super-admin/feature-toggles
- PATCH /api/super-admin/feature-toggles/:key
- GET /api/super-admin/audit-logs

Seller:
- GET /api/seller/profile
- PATCH /api/seller/profile
- GET /api/seller/products
- POST /api/seller/products
- PATCH /api/seller/products/:id
- DELETE /api/seller/products/:id
- GET /api/seller/orders
- GET /api/seller/analytics

Notifications:
- GET /api/notifications
- PATCH /api/notifications/:id/read
- PATCH /api/notifications/read-all
- DELETE /api/notifications/:id

## Frontend Routes (High-Level)
- Storefront: /, /products, /product/:id, /cart, /checkout
- Auth: /login, /register, /seller/register
- Admin: /admin, /super-admin
- Seller: /seller

## Mobile App
- Located in `flutter_app/`.
- Uses Firebase Auth and Firestore.
- Not fully aligned with the Express/Prisma backend.
- Firebase config uses placeholder values and must be replaced for production.

## Deployment
- Vercel is configured via `vercel.json`.
- CI pipeline is defined in `.github/workflows/ci.yml`.
- Use `docs/DEPLOYMENT_CHECKLIST.md` before production releases.
- Ensure secrets are stored in a secret manager and not in repo files.

## Security Notes
- HTTPS enforcement in production is configured.
- CORS is restricted by `ALLOWED_ORIGINS`.
- Rate limiters are defined but must be applied consistently.
- Access tokens should be stored in httpOnly cookies or in memory to reduce XSS risk.
- Payments must compute totals server-side from product IDs to prevent tampering.

## Known Gaps and Risks (From Audit)
- Order totals and payment amounts can be computed from client input.
- Admin login role checks are incomplete and the client can elevate role locally.
- Login rate limiters are not applied in all auth routes.
- Access tokens stored in localStorage.
- Mobile app is not using the same backend as web.
- Audit logs missing for some admin actions.

## Troubleshooting
- If admin login fails after seeding, check seed output for generated passwords.
- If API returns mock data, verify DATABASE_URL is set and mock is disabled for production.
- If CORS errors appear, ensure ALLOWED_ORIGINS includes your frontend URL.
- If Stripe webhooks fail, ensure PAYMENT_WEBHOOK_SECRET is set and raw body capture is enabled.

## References
- README.md
- SECURITY.md
- TESTING.md
- docs/DEPLOYMENT_CHECKLIST.md
- docs/SECURITY_SUMMARY.md
- docs/QUICK_START.md
- docs/CHANGES_MADE.md
- docs/ENDPOINT_MIGRATION_GUIDE.md
- docs/MIGRATION_POSTGRESQL.md
- docs/audit/*
