# Production Deployment Checklist — IMK-MARKET

Complete this checklist before deploying to production. All items must be verified.

## Secrets & Environment

- [ ] `JWT_SECRET` — Set to a strong, random 32+ char value (use `openssl rand -hex 32`)
- [ ] `ADMIN_PASSWORD` — Rotated from seeded default; stored securely in secret manager
- [ ] `PAYMENT_WEBHOOK_SECRET` — Obtained from Stripe dashboard (live keys)
- [ ] `STRIPE_SECRET_KEY` — Using production (`sk_live_*`) keys, not test keys
- [ ] `STRIPE_WEBHOOK_SECRET` — From Stripe webhook endpoint setup
- [ ] `ALLOWED_ORIGINS` — Set to exact frontend URL(s); no wildcards or localhost
- [ ] `DATABASE_URL` — Points to production PostgreSQL instance, no local/dev URLs
- [ ] `SUPPORT_EMAIL` — Valid contact email for order/payment notifications
- [ ] No `.env` file in repository; only `.env.example` committed
- [ ] All secrets stored in a secret manager (GitHub Secrets, AWS Secrets Manager, Vault, etc.)

## Database

- [ ] PostgreSQL instance created (managed service: AWS RDS, Supabase, Railway, Heroku Postgres)
- [ ] Migrations applied: `npm run db:migrate:prod`
- [ ] Database seeded: `npm run server:seed`
- [ ] Backup policy configured (automated daily snapshots, multi-AZ or replication)
- [ ] Connection pooling enabled (PgBouncer or cloud provider's built-in)
- [ ] Database credentials rotated from any defaults
- [ ] Network security: Database only accessible from app servers, not public internet

## Server Security

- [ ] `NODE_ENV=production` set
- [ ] HTTPS enforced (TLS at load balancer / reverse proxy)
- [ ] HSTS header enabled (via helmet)
- [ ] Rate limiting active on all endpoints (general and admin login)
- [ ] CORS restricted to `ALLOWED_ORIGINS` only (no wildcards)
- [ ] Helmet security headers enabled
- [ ] Error responses don't leak stack traces (production mode sends generic messages)

## Authentication & Authorization

- [ ] Admin credentials rotated from defaults
- [ ] JWT tokens use strong `JWT_SECRET`
- [ ] Token expiry short (12h recommended)
- [ ] Admin endpoints protected with `requireAdmin` middleware
- [ ] Admin login rate limited (5 attempts per 15 minutes)

## Payments & Webhooks

- [ ] Stripe account set up with production (live) keys
- [ ] Webhook endpoint registered in Stripe dashboard
- [ ] Webhook signature verification implemented (we use `stripe.webhooks.constructEvent`)
- [ ] Webhook secret stored securely in env
- [ ] Test webhook delivery with Stripe CLI before going live
- [ ] Payment success/cancel URLs point to production frontend
- [ ] PCI-DSS scope documented (we minimize scope using Stripe Checkout hosted flow)

## Testing

- [ ] Unit tests pass: `npm run test`
- [ ] Integration tests pass (payment flow, order creation)
- [ ] Strict TypeScript check passes: `npm run typecheck:strict` (or acceptable errors documented)
- [ ] Linter passes: `npm run lint`
- [ ] No security vulnerabilities: `npm audit` shows 0 vulnerabilities (low/high)
- [ ] Manual smoke test on staging: login, create order, payment flow, webhooks

## Deployment

- [ ] CI/CD pipeline set up (GitHub Actions, GitLab CI, etc.)
- [ ] Secrets injected via CI provider's secrets store (not in code)
- [ ] Build passes: `npm run build` (frontend)
- [ ] Docker build passes: `docker build -t imk-market .` (if using containers)
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] Logging configured (structured logs, sent to log aggregator if available)
- [ ] Monitoring & alerting set up (error rates, failed logins, payment failures)

## Infrastructure

- [ ] HTTPS/TLS certificate valid and auto-renewed (Let's Encrypt or provider's cert)
- [ ] Load balancer (if applicable) configured with sticky sessions / session affinity for JWT
- [ ] Reverse proxy (nginx, etc.) configured to forward headers for proxy detection
- [ ] Firewall rules restrict database access to app servers only
- [ ] DDoS protection enabled (Cloudflare, AWS Shield, etc. if available)

## Front-end

- [ ] API base URL points to production backend
- [ ] No dev URLs or localhost references in code/config
- [ ] Payment success/cancel redirect URLs configured
- [ ] CORS credentials sent correctly (if using httpOnly cookies / JWT)

## Documentation & Handover

- [ ] SECURITY.md reviewed by team
- [ ] docs/MIGRATION_POSTGRESQL.md reviewed and followed
- [ ] Runbook created for common ops tasks (restart, backup, restore, scaling)
- [ ] Incident response plan prepared (breach, DDoS, payment provider outage)
- [ ] Contact info documented (ops, security, payment provider support)

## Post-Deployment

- [ ] Verify health check: `curl https://your-api.example.com/api/health`
- [ ] Test admin login and place test order (COD or Stripe test mode if available)
- [ ] Monitor error logs for first 24 hours
- [ ] Confirm backup snapshots are being created
- [ ] Verify TLS certificate and HSTS headers: `curl -I https://your-api.example.com`
- [ ] Test payment webhook delivery (Stripe sends test event)

## Ongoing

- [ ] Run `npm audit` periodically; update dependencies
- [ ] Review security logs monthly
- [ ] Rotate secrets quarterly
- [ ] Test backup recovery procedure
- [ ] Review payment provider security bulletins
- [ ] Monitor uptime and latency

---

**Before going live, have security and ops teams sign off on this checklist.**

For issues or questions, consult:
- SECURITY.md
- docs/MIGRATION_POSTGRESQL.md
- docs/ENDPOINT_MIGRATION_GUIDE.md
