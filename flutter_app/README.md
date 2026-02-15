# Flutter + Firebase App (`flutter_app/`)

This is the **Flutter/Firebase** client app in this repository. It uses:

- Firebase Authentication (email/password)
- Cloud Firestore (planned data layer)
- Firebase Storage (planned media layer)

## Supported Platforms

- Android ✅
- iOS ✅ (requires macOS to build)
- Web ✅
- Windows ✅
- macOS ✅

Linux is currently **not configured** for Firebase in this project.

## Project Structure (lib/)

- `lib/main.dart` — safe bootstrap + Firebase initialization guard
- `lib/firebase_options.dart` — **placeholder**; must be generated via FlutterFire
- `lib/app/` — app shell (theme, setup screens)
- `lib/features/` — feature folders (auth, home)

## Setup (Required)

1) Install Flutter SDK (stable) and run:

```bash
flutter --version
flutter pub get
```

2) Create a Firebase project and configure this app using **FlutterFire**:

```bash
dart pub global activate flutterfire_cli
flutterfire configure
```

This will generate a real `lib/firebase_options.dart` and create the platform config files:

- Android: `android/app/google-services.json`
- iOS: `ios/Runner/GoogleService-Info.plist`

3) In Firebase Console, enable **Authentication → Email/Password**.

## Run

```bash
flutter run
```

If Firebase isn’t configured, the app will show a “Firebase Setup Required” screen.

## Security Notes (Do This Before Production)

- **Lock down Firestore/Storage rules** (do not use test/open rules in production).
- Templates live in `firebase/` (see `firebase/README.md`).
- Enable **Firebase App Check** to reduce abuse of your backend resources.
- Never commit **service account** JSON keys to the repo.
- Prefer least-privilege data models (users can only access their own data).

If you add Firebase CLI deployment, keep security rules in version control and deploy them in CI.
