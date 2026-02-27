# PostgreSQL Migration Guide — IMK-MARKET

This guide covers migrating from `lowdb` (JSON file) to **PostgreSQL** with **Prisma ORM**, recommended for production.

## Why PostgreSQL?

✅ **Durability** — ACID guarantees, WAL (write-ahead logs)
✅ **Scalability** — Connection pooling, replication
✅ **Security** — Parameterized queries prevent SQL injection
✅ **Performance** — Indexes, query optimization
✅ **Managed services** — AWS RDS, Supabase, Railway, Heroku Postgres all support it

## Setup Steps

### 1. Install Dependencies

Dependencies already added to `package.json`:
- `@prisma/client`: ^5.7.1
- `prisma`: ^5.7.1 (dev)

### 2. Configure Database URL

Set `DATABASE_URL` in your `.env`:

**Local development (with Docker):**
```bash
docker run -d --name postgres-imk \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=imkmarket \
  -p 5432:5432 \
  postgres:16-alpine
```

Then set `.env`:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/imkmarket
```

**Cloud (examples):**
- Supabase: `postgresql://[user]:[password]@db.[region].supabase.co:5432/[db]?schema=public`
- AWS RDS: `postgresql://[user]:[password]@[host]:5432/[db]`
- Railway: Provided in dashboard
- Heroku Postgres: `postgresql://[connection-string]`

### 3. Run Migrations

Create and apply migrations:

```bash
# Create migration from schema
npm run db:migrate

# Or for production, just apply existing migrations
npm run db:migrate:prod
```

### 4. Seed Database

```bash
npm run server:seed
```

Generates admin user with secure password (printed to console if `ADMIN_PASSWORD` not set).

### 5. Update Server Code

The server code has been partially migrated to use Prisma. Key changes:

**Before (lowdb):**
```typescript
const products = db.data.products.filter(p => p.status === "active");
```

**After (Prisma):**
```typescript
const products = await prisma.product.findMany({
  where: { status: "active" }
});
```

Complete migration of all endpoints in `server/index.ts` is required. Ensure:
- Replace `db.data.*` with `prisma.*`
- All database queries return Promises (use `await`)
- Wrap in try/catch for error handling

### 6. Update Seed Script

Old: `server/seed.ts` (uses lowdb)
New: `server/db-seed.ts` (uses Prisma)

Run with: `npm run server:seed`

### 7. Connection Pooling (Production)

For production, use **PgBouncer** or a managed connection pool:

**Using Prisma with built-in pooling (recommended):**
```
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
```

**Using PgBouncer (for high concurrency):**
```
DATABASE_URL="postgresql://user:pass@pgbouncer-host:6432/db"
```

### 8. Backup & Recovery

**Local backups:**
```bash
pg_dump postgresql://user:pass@localhost/imkmarket > backup.sql
psql postgresql://user:pass@localhost/imkmarket < backup.sql
```

**Automated cloud backups:**
- Supabase: Automatic daily backups, point-in-time recovery
- AWS RDS: Multi-AZ, automated snapshots
- Railway: Built-in backups

### 9. Environment Variables

Add to production `.env`:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/imkmarket
JWT_SECRET=<your-secure-secret>
PAYMENT_WEBHOOK_SECRET=<stripe-webhook-secret>
ALLOWED_ORIGINS=https://your-frontend.example.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Troubleshooting

**"Error: P1000 Can't reach database server"**
- Verify `DATABASE_URL` is correct
- Check network access (security groups, firewall)
- Ensure database is running

**"Error: P2025 An operation failed because it depends on one or more records that were required but not found"**
- Foreign key constraint violation; ensure related records exist

**"Connection pool exhausted"**
- Increase `DATABASE_URL` connection limit or use PgBouncer

## Prisma Studio

Inspect/edit data graphically:
```bash
npm run db:studio
```

Opens browser UI to your database.

## Migration from lowdb

Old JSON data at `data/imk-market.json` can be imported into PostgreSQL:

```bash
# Export lowdb to JSON
node -e "const db = require('./server/db').getDb(); console.log(JSON.stringify(db.data))" > export.json

# Import via migration script (create custom migration if needed)
```

## Next Steps

1. ✅ Set `DATABASE_URL` and run migrations
2. ✅ Run `npm run server:seed`
3. ⚠️ **Complete Prisma migration in `server/index.ts`** (all CRUD operations)
4. ✅ Test endpoints locally
5. ✅ Deploy to production with managed PostgreSQL

---

For Prisma docs, see: https://www.prisma.io/docs/
