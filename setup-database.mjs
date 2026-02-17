# ============================================
# IMK - Market Database Setup Script
# ============================================
# This script automates the database setup process
# Run with: node setup - database.mjs

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';

console.log('🚀 IMK-Market Database Setup\n');

// ============================================
// Step 1: Check Environment
// ============================================
console.log('📋 Step 1: Checking environment configuration...');

let envContent = '';
try {
    envContent = readFileSync('.env', 'utf-8');
} catch (error) {
    console.log('⚠️  No .env file found, creating one...');
    envContent = '';
}

// Check for DATABASE_URL
if (!envContent.includes('DATABASE_URL=')) {
    console.log('\n❌ DATABASE_URL not found in .env file');
    console.log('\n📝 Please add your database connection string to .env:');
    console.log('\nFor Supabase:');
    console.log('DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"');
    console.log('\nFor local PostgreSQL:');
    console.log('DATABASE_URL="postgresql://username:password@localhost:5432/imk_market"');
    console.log('\n💡 See database_setup.md for detailed instructions');
    process.exit(1);
}

// Check for JWT_SECRET
if (!envContent.includes('JWT_SECRET=')) {
    console.log('🔐 Generating JWT_SECRET...');
    const jwtSecret = randomBytes(32).toString('hex');
    envContent += `\nJWT_SECRET="${jwtSecret}"\n`;
    writeFileSync('.env', envContent);
    console.log('✅ JWT_SECRET generated and added to .env');
}

console.log('✅ Environment configuration looks good\n');

// ============================================
// Step 2: Generate Prisma Client
// ============================================
console.log('📋 Step 2: Generating Prisma Client...');
try {
    execSync('npm run db:generate', { stdio: 'inherit' });
    console.log('✅ Prisma Client generated\n');
} catch (error) {
    console.error('❌ Failed to generate Prisma Client');
    process.exit(1);
}

// ============================================
// Step 3: Run Migrations
// ============================================
console.log('📋 Step 3: Running database migrations...');
console.log('⚠️  This will create all tables in your database');

try {
    execSync('npm run db:migrate', { stdio: 'inherit' });
    console.log('✅ Database migrations completed\n');
} catch (error) {
    console.error('❌ Failed to run migrations');
    console.error('💡 Make sure your DATABASE_URL is correct and the database is accessible');
    process.exit(1);
}

// ============================================
// Step 4: Seed Database
// ============================================
console.log('📋 Step 4: Seeding database with default data...');
console.log('This will create:');
console.log('  - Default tenant (IMK-Market)');
console.log('  - Roles and permissions');
console.log('  - Super Admin account');
console.log('  - Demo accounts (Manager, Sales, Customer, Seller)');

try {
    execSync('npm run server:seed', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully\n');
} catch (error) {
    console.error('❌ Failed to seed database');
    process.exit(1);
}

// ============================================
// Success!
// ============================================
console.log('\n🎉 Database setup complete!\n');
console.log('📝 Default Accounts Created:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Super Admin:');
console.log('  Email: admin@primmesisc.com');
console.log('  Password: SuperSecure123!@#');
console.log('  Access: /super-admin');
console.log('');
console.log('Manager:');
console.log('  Email: manager@imk-market.com');
console.log('  Password: Manager123!@#');
console.log('  Access: /admin');
console.log('');
console.log('Seller:');
console.log('  Email: seller@example.com');
console.log('  Password: Seller123!@#');
console.log('  Access: /seller');
console.log('');
console.log('Customer:');
console.log('  Phone: +232-76-123-4567');
console.log('  Password: Customer123!@#');
console.log('  Access: /');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n🚀 Next Steps:');
console.log('1. Start the backend: npm run server:dev');
console.log('2. Start the frontend: npm run dev:web');
console.log('3. Visit http://localhost:5173/login');
console.log('4. Test the authentication flows');
console.log('\n📚 Documentation:');
console.log('  - Next Steps: .gemini/antigravity/brain/[conversation-id]/next_steps.md');
console.log('  - API Reference: .gemini/antigravity/brain/[conversation-id]/api_reference.md');
console.log('  - Walkthrough: .gemini/antigravity/brain/[conversation-id]/walkthrough.md');
console.log('');
