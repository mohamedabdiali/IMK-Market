# Security Guidelines — IMK-MARKET

This document lists recommended best practices to keep IMK-MARKET secure in development and production.

1. Secrets & environment
   - Never commit secrets. Keep a single `.env.example` in repo and use a secret manager (AWS Secrets Manager, HashiCorp Vault, or GitHub Actions Secrets) in CI/CD.
   - Required secrets: `JWT_SECRET`, `PAYMENT_WEBHOOK_SECRET`, `ADMIN_PASSWORD` (or create admin via console), `ALLOWED_ORIGINS`.
   - Rotate secrets regularly and revoke unused keys.

2. Webhooks & payments
   - Verify webhooks using HMAC signature (we implement HMAC-SHA256 over the raw request body). Configure your payment provider to sign webhook payloads.
   - In production, webhook verification is required; never rely on a plaintext shared-secret header.
   - Use official payment SDKs and follow the provider's security recommendations and PCI-DSS scope minimization.

3. Transport & TLS
   - Enforce TLS termination at the load balancer or reverse proxy. The app redirects HTTP to HTTPS when `NODE_ENV=production`.
   - Use HSTS and secure cookies for auth tokens.

4. Authentication & authorization
   - Use a strong `JWT_SECRET` and short expiry for tokens. Store tokens securely client-side (httpOnly cookies recommended for web).
   - Protect admin routes with role checks and rate limiting (implemented for `POST /api/admin/login`).

5. Input validation & sanitization
   - Validate all incoming data (Zod is used for server payloads). Sanitize outputs shown in UI to prevent XSS.

6. Infrastructure & persistence
   - **Database**: Use PostgreSQL in production (see docs/MIGRATION_POSTGRESQL.md).
     - ACID guarantees, transaction support, connection pooling
     - Use managed services (Supabase, AWS RDS, Railway, Heroku Postgres) for backups and replication
   - **ORM**: Prisma provides parameterized queries to prevent SQL injection
   - Backups: Automated daily snapshots (cloud providers), point-in-time recovery
   - Legacy lowdb (JSON file) is not recommended for production use

7. Dependency & supply-chain security
   - Enable Dependabot or similar. Run `npm audit` and fix vulnerabilities promptly.

8. Logging & monitoring
   - Avoid logging secrets. Use structured logs and central log aggregation (ELK, Datadog, CloudWatch).
   - Alert on suspicious activity (failed logins, payment failures, repeated webhook failures).

9. CI/CD
   - Store secrets in CI provider's secrets store. Do not expose secrets in build logs.

10. Compliance
   - Payments may bring PCI-DSS requirements — consult your payment provider. Scope your system to minimize PCI obligations (use redirect flows or hosted payment pages whenever possible).

If you want, I can help integrate a cloud secret manager and migrate data to Postgres and wire a supported payment provider (e.g., Paystack, Stripe) with official SDK and test hooks.
