# Firebase Setup Guide for Flutter E-commerce App

## Steps to Configure Firebase for Your Flutter Project

### 1. Create (or Use Existing) Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** (or use existing)
3. Name your project: `e-commerce-market` (or your preference)
4. Click **Continue** and complete setup

### 2. Get Firebase Configuration Files

#### For Android:
1. In Firebase Console, go to **Project Settings** (⚙️)
2. Under **Your apps**, click **Android app** or add one if missing
3. Download `google-services.json`
4. Place it in: `android/app/google-services.json`

#### For iOS:
1. In Firebase Console, go to **Project Settings**
2. Download `GoogleService-Info.plist`
3. Place it in: `ios/Runner/GoogleService-Info.plist`
4. In Xcode, add to **Copy Bundle Resources** build phase

#### For Web:
1. In Firebase Console, go to **Project Settings**
2. Under **Your apps**, add a **Web app**
3. Copy the `firebaseConfig` object (contains `apiKey`, `projectId`, etc.)
4. Keep safe for Step 3 below

### 3. Update `lib/firebase_options.dart`

Replace the placeholder values in `lib/firebase_options.dart` with your actual credentials from Firebase:

```dart
// Example structure (replace with REAL values):
static const FirebaseOptions web = FirebaseOptions(
  apiKey: 'YOUR_WEB_API_KEY',           // From web app config
  appId: 'YOUR_WEB_APP_ID',              // From web app config
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  projectId: 'your-project-id',
  authDomain: 'your-project-id.firebaseapp.com',
  storageBucket: 'your-project-id.appspot.com',
);
```

### 4. Enable Firebase Services in Console

In Firebase Console:

1. **Authentication**
   - Go to **Authentication** → **Sign-in method**
   - Enable **Email/Password**

2. **Firestore Database**
   - Go to **Firestore Database** → **Create Database**
   - Choose location (us-central1 recommended)
   - Start in **Test mode** (for development)
   - Create collections: `users`, `products`, `categories`, `orders`

3. **Cloud Storage**
   - Go to **Cloud Storage** → **Create bucket**
   - Use default settings
   - Update rules to allow signed-in users to upload/read

### 5. Configure Android

1. Add Firebase to Android build files:
   ```bash
   # In android/build.gradle, add:
   classpath 'com.google.gms:google-services:4.3.15'
   ```

2. In `android/app/build.gradle`, add at bottom:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

3. Add `google-services.json` to `android/app/`

### 6. Configure iOS

1. In Xcode:
   - Select **Runner** project
   - Go to **Build Phases**
   - Under **Copy Bundle Resources**, add `GoogleService-Info.plist`

2. In `ios/Podfile`, ensure Firebase pods are included (flutter handle this via pubspec.yaml)

3. Run:
   ```bash
   cd ios
   pod install --repo-update
   cd ..
   ```

### 7. Run the App

```bash
# Clear build and get fresh dependencies
flutter clean
flutter pub get

# Run on your target (Android/iOS/Web)
flutter run
```

### 8. Firestore Security Rules (Development)

After creating Firestore, set these rules for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read all data
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email_verified;
    }
    
    // Admin-only operations
    match /users/{userId} {
      allow write: if request.auth.uid == userId;
    }
  }
}
```

### 9. Environment Variables (Optional)

Create a `.env` file (add to `.gitignore`):

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
```

Then load in code using `flutter_dotenv` package.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `google-services.json not found` | Ensure file is in `android/app/` and `android/app/build.gradle` applies the plugin |
| `GoogleService-Info.plist not found` | Add to Xcode **Copy Bundle Resources** build phase |
| Firebase init fails | Run `flutter clean && flutter pub get` and restart app |
| Web config missing | Check Firebase Console > Project Settings > Web app config |
| Firestore rules error | Ensure Security Rules allow authenticated users in test mode |

---

## Next Steps

1. ✅ Configure Authentication (Email/Password)
2. ✅ Set up Firestore collections (users, products, categories, orders)
3. ✅ Configure Cloud Storage for product images
4. ✅ Seed initial data (products, categories) into Firestore
5. ✅ Build & deploy to Android/iOS/Web

---

For more help, see:
- [FlutterFire Setup](https://firebase.flutter.dev/docs/overview/)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com)
