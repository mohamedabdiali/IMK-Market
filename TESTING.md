# IMK-Market Testing Guide

## 🧪 Quick Test Checklist

After setting up the database, use this checklist to verify everything works:

### 1. Database Setup ✓
```bash
# Run the automated setup script
node setup-database.mjs

# OR manually:
npm run db:generate
npm run db:migrate
npm run server:seed
```

### 2. Start Servers ✓
```bash
# Terminal 1: Start backend
npm run server:dev

# Terminal 2: Start frontend
npm run dev:web
```

### 3. Test Authentication Flows

#### ✅ Super Admin Login
- [ ] Navigate to http://localhost:5173/login
- [ ] Click "Super Admin" tab (shield icon)
- [ ] Login with: `admin@primmesisc.com` / `SuperSecure123!@#`
- [ ] Should redirect to `/super-admin`
- [ ] Should see platform statistics
- [ ] Should see pending seller approvals section

#### ✅ Seller Registration & Approval
- [ ] Navigate to http://localhost:5173/seller/register
- [ ] Fill out registration form with test data
- [ ] Submit registration
- [ ] Should see "pending approval" message
- [ ] Login as super admin
- [ ] Approve the new seller
- [ ] Logout and login as the new seller
- [ ] Should access `/seller` dashboard

#### ✅ Seller Dashboard
- [ ] Login as seller: `seller@example.com` / `Seller123!@#`
- [ ] Should see seller analytics (products, orders, revenue)
- [ ] Click "Add Product"
- [ ] Fill out product form and submit
- [ ] Product should appear in list
- [ ] Edit the product
- [ ] Delete the product

#### ✅ Manager Login
- [ ] Login as manager: `manager@imk-market.com` / `Manager123!@#`
- [ ] Should access `/admin` dashboard
- [ ] Try to access `/super-admin` - should redirect to `/unauthorized`

#### ✅ Customer Login
- [ ] Click "Customer" tab (user icon)
- [ ] Login with phone: `+232-76-123-4567` / `Customer123!@#`
- [ ] Should redirect to home page
- [ ] Try to access `/admin` - should redirect to `/login`
- [ ] Try to access `/seller` - should redirect to `/login`

### 4. Test Permission Gates

Add this test component anywhere to verify permission gates work:

```tsx
import { PermissionGate, RoleGate } from "@/components/PermissionGate";

function TestPermissions() {
  return (
    <div>
      <RoleGate roles="Seller">
        <p>✅ You are a seller</p>
      </RoleGate>
      
      <RoleGate roles={["Manager", "Super Admin"]}>
        <p>✅ You are a manager or super admin</p>
      </RoleGate>
      
      <PermissionGate resource="products" action="create">
        <p>✅ You can create products</p>
      </PermissionGate>
    </div>
  );
}
```

### 5. Test API Endpoints

Use these curl commands to test the API directly:

```bash
# Super Admin Login
curl -X POST http://localhost:5050/api/auth/super-admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@primmesisc.com","password":"SuperSecure123!@#"}'

# Get Dashboard Stats (replace TOKEN)
curl http://localhost:5050/api/super-admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Seller Login
curl -X POST http://localhost:5050/api/auth/seller/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@example.com","password":"Seller123!@#"}'

# Customer Login
curl -X POST http://localhost:5050/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+232-76-123-4567","password":"Customer123!@#"}'
```

### 6. Common Issues & Solutions

#### Issue: "Prisma Client not found"
```bash
npm run db:generate
```

#### Issue: "Database connection failed"
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

#### Issue: "JWT_SECRET not found"
- Add to .env: `JWT_SECRET="your-secret-here"`
- Or run setup script: `node setup-database.mjs`

#### Issue: Routes not working
- Clear browser cache
- Check browser console for errors
- Verify imports in App.tsx

#### Issue: TypeScript errors
```bash
npm run db:generate
# Restart your IDE/editor
```

### 7. Production Deployment Test

Before deploying to production:

- [ ] All authentication flows work locally
- [ ] All dashboards load correctly
- [ ] Permission gates work as expected
- [ ] Seller registration and approval workflow works
- [ ] Product CRUD operations work
- [ ] No console errors in browser
- [ ] No TypeScript errors
- [ ] Database migrations run successfully
- [ ] Seed script creates default accounts

## 📊 Expected Results

### Super Admin Dashboard
- Platform statistics cards
- Pending seller approvals list
- Approve/reject buttons functional

### Seller Dashboard
- Analytics cards (products, orders, revenue, low stock)
- Product list with status badges
- Add/Edit/Delete product functionality
- Product ownership validation

### Authentication
- 4 different login types work
- Proper redirects based on role
- Protected routes block unauthorized access
- Permission gates show/hide content correctly

## 🎯 Success Criteria

✅ All 4 authentication types work  
✅ Super admin can approve sellers  
✅ Sellers can manage products  
✅ Permission-based access control works  
✅ No TypeScript or runtime errors  
✅ All routes properly protected  

---

**If all tests pass, you're ready for production deployment!** 🚀
