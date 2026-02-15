# 🚀 Flutter E-commerce App — Quick Start (5 Steps)

## 1️⃣ Get Firebase Credentials (5 mins)
Go to [console.firebase.google.com](https://console.firebase.google.com)
- Create new project (name: `e-commerce-market`)
- Download 3 files:
  - `google-services.json` → Place in `android/app/`
  - `GoogleService-Info.plist` → Place in `ios/Runner/`
  - Web config → Copy API key & Project ID

## 2️⃣ Update Firebase Config (2 mins)
Open: `flutter_app/lib/firebase_options.dart`

Replace these lines with YOUR actual credentials:
```dart
static const String _projectId = 'YOUR_PROJECT_ID';           // From Firebase Console
static const String _apiKey = 'YOUR_WEB_API_KEY';              // From Firebase Console
static const String _appId = 'YOUR_WEB_APP_ID';                // From Firebase Console
static const String _messagingSenderId = 'YOUR_MESSAGING_ID';  // From Firebase Console
static const String _authDomain = 'YOUR_AUTH_DOMAIN';          // e.g., project.firebaseapp.com
static const String _storageBucket = 'YOUR_STORAGE_BUCKET';    // e.g., project.appspot.com
```

## 3️⃣ Set Up Firestore (3 mins)
In Firebase Console:
1. Go to **Firestore Database** → **Create Database**
2. Choose region: `us-central1` (default)
3. Start in **Test mode** (for development)
4. Create collections:
   - `users`
   - `products`
   - `categories`
   - `orders` (optional)

## 4️⃣ Enable Authentication (1 min)
In Firebase Console:
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**

## 5️⃣ Run the App! (2 mins)
```bash
cd "C:\Users\PRIME\Desktop\E-commerce-market app\flutter_app"

# Get dependencies
flutter pub get

# Run on Web (fastest for testing)
flutter run -d web

# OR run on Android emulator
flutter run -d android

# OR run on iOS (macOS only)
flutter run -d ios
```

---

## 📋 Checklist

- [ ] Firebase project created
- [ ] `google-services.json` placed in `android/app/`
- [ ] `GoogleService-Info.plist` placed in `ios/Runner/`
- [ ] `firebase_options.dart` updated with credentials
- [ ] Firestore collections created (users, products, categories)
- [ ] Authentication enabled (Email/Password)
- [ ] `flutter pub get` completed
- [ ] App runs on web/Android/iOS

---

## 🔗 Detailed Guides

- **Full Firebase Setup** → See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
- **Project Architecture** → See [README_FLUTTER.md](README_FLUTTER.md)
- **Migration Details** → See [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)

---

## ⚡ Test the App

Once running:
1. Click **Don't have an account? Register**
2. Create a test user (email: `test@example.com`, password: `Test123!`)
3. See product list from Firestore (empty initially)
4. Go to Firebase Console to **manually add test products** to Firestore

---

## 🐛 Issues?

**Firebase not initializing?**
- All `YOUR_*` in `firebase_options.dart` must be replaced, OR
- Run `flutter run --verbose` to see exact error

**`google-services.json` not found?**
- Place in `android/app/google-services.json`
- Run `flutter clean && flutter pub get`

**Firestore permission denied?**
- Make sure you're logged in with test user
- Security rules should allow authenticated users by default in test mode

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) **Troubleshooting** section for more help.

---

You're all set! 🎉 Start with step 1 above.
