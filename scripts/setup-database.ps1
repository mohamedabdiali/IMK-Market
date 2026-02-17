#!/usr/bin/env pwsh
# IMK-Market Database Setup Script
# This script automates the database setup process

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IMK-Market Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your DATABASE_URL" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host 'DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"' -ForegroundColor Gray
    exit 1
}

# Check if DATABASE_URL is set
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch 'DATABASE_URL=') {
    Write-Host "❌ Error: DATABASE_URL not found in .env file!" -ForegroundColor Red
    Write-Host "Please add your Supabase connection string to .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green
Write-Host ""

# Step 1: Generate Prisma Client
Write-Host "📦 Step 1: Generating Prisma Client..." -ForegroundColor Cyan
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generated successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Run Migrations
Write-Host "🔄 Step 2: Running database migrations..." -ForegroundColor Cyan
npm run db:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run migrations" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check your DATABASE_URL in .env" -ForegroundColor Yellow
    Write-Host "2. Ensure your Supabase project is active" -ForegroundColor Yellow
    Write-Host "3. Check your internet connection" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Migrations completed successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Seed Database
Write-Host "🌱 Step 3: Seeding database..." -ForegroundColor Cyan
npm run server:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database seeded successfully" -ForegroundColor Green
Write-Host ""

# Success message
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ DATABASE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Save the Super Admin password shown above" -ForegroundColor White
Write-Host "2. Start the backend server:" -ForegroundColor White
Write-Host "   npm run server:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the frontend:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test login with any of the seeded accounts" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more information, see:" -ForegroundColor Cyan
Write-Host "   - Database Setup Guide: brain/database_setup.md" -ForegroundColor Gray
Write-Host "   - Implementation Plan: brain/implementation_plan.md" -ForegroundColor Gray
Write-Host "   - Walkthrough: brain/walkthrough.md" -ForegroundColor Gray
Write-Host ""
