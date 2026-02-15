# IMK-MARKET - E-Commerce Platform

IMK-MARKET is a modern, fully-featured e-commerce marketplace platform with **dual implementations**: original React web app and brand new **Flutter mobile-first application**.

## 🎯 What's in this repo

### 📱 **Flutter App (Recommended)** ⭐ NEW
**Location**: `flutter_app/` 

A complete **Flutter + Firebase** implementation with advanced UI features:
- ✨ **Beautiful UI** with gradients, animations, and Material Design 3
- 🔍 **Real-time Search** with product filtering
- ❤️ **Wishlist System** for saving favorites
- 🛒 **Smart Shopping Cart** with quantity management
- 👤 **User Profile & Account Management**
- 📱 **Multi-Platform**: Web, Android, iOS, Windows, macOS
- 🔒 **Firebase Security** with email authentication
- 📊 **Real-time Firestore** database integration
- 🚀 **Production-Ready** with comprehensive documentation

**Status**: ✅ **COMPLETE & PRODUCTION READY** (v2.0 - Advanced UI Edition)

**Quick Start**: 
```bash
cd flutter_app
flutter pub get
flutter run -d web
```

**Documentation**:
- [Complete Implementation Guide](./flutter_app/docs/COMPLETE_GUIDE.md) ⭐ START HERE
- [UI Enhancements Guide](./flutter_app/docs/UI_ENHANCEMENTS.md)
- [Architecture & Data Flow](./flutter_app/docs/ARCHITECTURE_GUIDE.md)
- [Quick Start](./flutter_app/docs/QUICK_START.md)
- [Firebase Setup](./flutter_app/docs/FIREBASE_SETUP.md)

---

### 🌐 **React Web App** (Original)
**Location**: Root directory

Original Vite + React + TypeScript + Tailwind/shadcn-ui web application:
- **Web app**: Vite + React + TypeScript + Tailwind/shadcn-ui
- **API server**: Node.js + Express + Prisma (PostgreSQL)
- **Mobile builds**: Capacitor (Android/iOS) using the web app build output

**Status**: ✅ Functional (legacy, superseded by Flutter)

## 🚀 Getting Started

### 🔴 **Option 1: Flutter App (Recommended)** ⭐

For mobile-first, cross-platform development with beautiful UI:

```bash
cd flutter_app
flutter pub get
flutter run -d web        # Run on web
# or
flutter run -d android    # Run on Android emulator
flutter run -d ios        # Run on iOS simulator (macOS only)
```

**Features**:
- ✅ 5 advanced pages with animations
- ✅ Search & category filtering
- ✅ Wishlist system
- ✅ Firebase authentication
- ✅ Responsive design
- ✅ Multi-platform (Web, Android, iOS, macOS, Windows)

**Setup Time**: ~10 minutes  
**Complexity**: Low (Firebase-based, no backend server needed)

See [Installation Guide](./flutter_app/docs/QUICK_START.md) for detailed steps.

---

### 🟢 **Option 2: React Web + Express API (Original)**

For traditional web-first development:

## Local development (Web + API)

1) Install dependencies:

```bash
npm ci
```

2) Create `.env`:

```bash
cp .env.example .env
```

3) Start Postgres, run migrations + seed:

```bash
npm run db:migrate
npm run server:seed
```

4) Start the API server:

```bash
npm run server:dev
```

5) Start the web app:

```bash
npm run dev
```

The web app runs on `http://localhost:8080` and proxies API calls to `http://localhost:5050` via `/api` (`vite.config.ts`).

---

## 📊 Flutter vs React Comparison

| Feature | Flutter | React |
|---------|---------|-------|
| **Platforms** | Web, Android, iOS, Windows, macOS | Web only (Capacitor for mobile) |
| **UI/UX** | Material Design 3, animations | Tailwind CSS + shadcn-ui |
| **Backend** | Firebase (no backend needed) | Express + PostgreSQL |
| **State Management** | Provider | React Context |
| **Mobile Build** | Native (best performance) | Capacitor wrapper |
| **Setup Time** | 10 minutes | 20+ minutes |
| **Documentation** | Comprehensive | Good |
| **Learning Curve** | Easier for mobile devs | Easier for web devs |
| **Recommendation** | ✅ START HERE | Legacy, use as reference |

---

## 📚 Documentation

### Flutter (Recommended)
- **[Complete Implementation Guide](./flutter_app/docs/COMPLETE_GUIDE.md)** ⭐ **START HERE**
- [UI Enhancements Guide](./flutter_app/docs/UI_ENHANCEMENTS.md) - All 5 new pages
- [Architecture & Data Flow](./flutter_app/docs/ARCHITECTURE_GUIDE.md) - System design
- [Quick Start](./flutter_app/docs/QUICK_START.md) - 5-minute setup
- [Firebase Setup](./flutter_app/docs/FIREBASE_SETUP.md) - Firebase configuration
- [Implementation Summary](./flutter_app/docs/UI_IMPLEMENTATION_SUMMARY.md) - Feature details

### React (Legacy)
- [Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)
- [Security Summary](./docs/SECURITY_SUMMARY.md)
- [PostgreSQL Migration](./docs/MIGRATION_POSTGRESQL.md)
- [Endpoint Migration Guide](./docs/ENDPOINT_MIGRATION_GUIDE.md)

---

## 🎯 Quick Links

### I want to...

**Build a mobile app**
→ Use [Flutter](./flutter_app/docs/QUICK_START.md) (recommended)

**Test the UI**
→ Run `cd flutter_app && flutter run -d web`

**Understand the architecture**
→ Read [Architecture Guide](./flutter_app/docs/ARCHITECTURE_GUIDE.md)

**Set up Firebase**
→ Follow [Firebase Setup](./flutter_app/docs/FIREBASE_SETUP.md)

**Deploy to production**
→ Check [Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)

**Use the React original**
→ Continue with npm commands below

---

## Production notes

- Use PostgreSQL (see `docs/MIGRATION_POSTGRESQL.md`).
- Configure secrets and CORS (`ALLOWED_ORIGINS`) via environment variables (`.env.example`).
- Review security docs: `SECURITY.md` and `docs/SECURITY_SUMMARY.md`.

## Docker (API)

```bash
docker build -t imk-market .
docker run --env-file .env -p 5050:5050 imk-market
```

Or:

```bash
docker-compose up --build
```

## GitHub Deployment Quick Steps

1. Initialize git (already done in this workspace):

```bash
git init -b main
```

2. Commit your project:

```bash
git add .
git commit -m "Initial project setup"
```

3. Create an empty GitHub repository, then connect and push:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

4. In GitHub repo settings, configure required secrets for CI/deploy:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYMENT_WEBHOOK_SECRET`
- `ALLOWED_ORIGINS`
