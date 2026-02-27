# Quick Start Guide — IMK-MARKET

Get up and running with IMK-MARKET securely. Estimated time: 10 minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Docker)
- Git

## 1. Clone & Install

```bash
git clone <your-repo-url>
cd E-commerce-market\ app
npm install
```

## 2. Setup Database (Choose One)

### Option A: PostgreSQL in Docker (Fastest)

```bash
docker run -d --name postgres-imk \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=imkmarket \
  -p 5432:5432 \
  postgres:16-alpine
```

### Option B: Cloud Database

Sign up for:
- **Supabase** (free tier: https://supabase.com)
- **Railway** (free tier: https://railway.app)
- **Render** (free tier: https://render.com)
- **Heroku Postgres** (requires credit card)

Copy the connection string from the provider.

## 3. Create `.env`

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/imkmarket

# Server (generated on first seed)
JWT_SECRET=your-secure-random-secret-here
ADMIN_EMAIL=admin@imkmarket.com
ADMIN_PASSWORD=ChangeMeToSomethingSecure123!

# Stripe (optional, for payments)
STRIPE_SECRET_KEY=sk_test_...  # from Stripe dashboard
STRIPE_WEBHOOK_SECRET=whsec_...

# Other
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8080
```

> To generate a secure JWT_SECRET:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

## 4. Setup Database

```bash
# Create tables
npm run db:migrate

# Seed initial data
npm run server:seed
```

You should see:
```
✅ Database seeded successfully!
🔐 Generated ADMIN_PASSWORD: ...
```

## 5. Start Development

**Terminal 1: API Server**
```bash
npm run server:dev
```

You should see:
```
API listening on http://localhost:5050
```

**Terminal 2: Web App** (in the same project directory)
```bash
npm run dev
```

Open http://localhost:8080 in your browser.

## 6. Test the App

### Admin Access
Visit http://localhost:8080/admin

Login with:
- Email: `admin@imkmarket.com`
- Password: The value from `.env` `ADMIN_PASSWORD` (or printed during seed)

### API Health Check
```bash
curl http://localhost:5050/api/health
```

Response:
```json
{"status":"ok","time":"2026-02-08T..."}
```

### Try a Product Search
```bash
curl "http://localhost:5050/api/products?q=dress"
```

## 7. Inspect Database

Open Prisma Studio:
```bash
npm run db:studio
```

Opens http://localhost:5555 with a GUI to view/edit your data.

## Next Steps

### Add Stripe Support
1. Sign up at https://stripe.com (free account)
2. Get test keys from Stripe dashboard
3. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   PAYMENT_SUCCESS_URL=http://localhost:8080/payment-success
   PAYMENT_CANCEL_URL=http://localhost:8080/payment-cancel
   ```
4. Restart server

### Run Tests
```bash
npm run test
```

### Type Check (Strict)
```bash
npm run typecheck:strict
```

Some errors may appear (lowdb types, etc.). Fix progressively or ignore for now.

### Lint
```bash
npm run lint
```

## Common Issues

**Issue**: `connect ECONNREFUSED 127.0.0.1:5432`
- PostgreSQL not running. Start docker container or check DB connection.

**Issue**: `P1000 Can't reach database server`
- Check `DATABASE_URL` in `.env` is correct.

**Issue**: `Admin login fails`
- Ensure `ADMIN_PASSWORD` is set in `.env` (or use value printed during seed).

**Issue**: Out of date migrations
- Run `npm run db:migrate` to apply pending migrations.

## Docker Compose (Optional)

Start everything with docker-compose:

```bash
docker-compose up
```

This starts PostgreSQL + app (if you update the compose file with service definitions).

## Running in Production

See [docs/DEPLOYMENT_CHECKLIST.md](../docs/DEPLOYMENT_CHECKLIST.md) for production setup steps.

Key points:
- Use managed PostgreSQL (AWS RDS, Supabase, etc.)
- Store secrets in a secret manager
- Enable HTTPS and rate limiting
- Setup Stripe webhooks
- Test the full payment flow

## Documentation

- [SECURITY.md](../SECURITY.md) — Security guidelines
- [docs/MIGRATION_POSTGRESQL.md](../docs/MIGRATION_POSTGRESQL.md) — PostgreSQL setup details
- [docs/ENDPOINT_MIGRATION_GUIDE.md](../docs/ENDPOINT_MIGRATION_GUIDE.md) — Migrating endpoints to Prisma
- [docs/DEPLOYMENT_CHECKLIST.md](../docs/DEPLOYMENT_CHECKLIST.md) — Production readiness

## Need Help?

- Check logs: `npm run server:dev` outputs errors
- Open Prisma Studio: `npm run db:studio`
- Review test files for usage examples
- Check GitHub Issues or reach out to team

Happy hacking! 🚀
