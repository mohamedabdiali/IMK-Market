# E-commerce Market Flutter App

A cross-platform Flutter e-commerce application with Firebase backend, supporting Android, iOS, Web, macOS, and Windows.

## Features

- 🔐 **Firebase Authentication** — Email/password login & registration
- 🛒 **Product Catalog** — Browse and search products by category
- 💳 **Firebase Storage** — Product images & user profiles
- 🔄 **Real-time Updates** — Firestore integration for live data
- 📱 **Multi-platform** — Android, iOS, Web, macOS, Windows support
- 🎨 **Material Design** — Clean, modern UI with Dart/Flutter

## Project Structure

```
lib/
├── main.dart                    # App entry point with Bootstrap
├── firebase_options.dart        # Firebase configuration template
├── pages/
│   ├── login_page.dart         # Login & registration UI
│   ├── home_page.dart          # Product catalog & detail pages
├── models/
│   ├── user_model.dart         # User model (Firestore)
│   ├── product_model.dart      # Product model (Firestore)
│   ├── category_model.dart     # Category model (Firestore)
├── providers/
│   ├── auth_provider.dart      # Auth state management (Provider)
│   ├── product_provider.dart   # Product state management
├── services/
│   ├── firebase_auth_service.dart    # Firebase Auth wrapper
│   ├── firestore_service.dart        # Firestore CRUD operations
│   └── firebase_storage_service.dart # Cloud Storage wrapper
```

## Prerequisites

- **Flutter SDK** — [Download Flutter](https://flutter.dev/docs/get-started/install)
- **Dart SDK** — Included with Flutter
- **Android Studio / Xcode** (for Android/iOS builds)
- **Firebase Project** — [Create at console.firebase.google.com](https://console.firebase.google.com)

## Getting Started

### 1. Configure Firebase

Follow the detailed steps in [FIREBASE_SETUP.md](FIREBASE_SETUP.md):

1. Create a Firebase project
2. Download config files (`google-services.json`, `GoogleService-Info.plist`)
3. Update `lib/firebase_options.dart` with credentials
4. Enable Authentication, Firestore, and Cloud Storage

### 2. Install Dependencies

```bash
flutter clean
flutter pub get
```

### 3. Run the App

```bash
# Android
flutter run -d android

# iOS (requires macOS with Xcode)
flutter run -d ios

# Web
flutter run -d web

# macOS (requires macOS)
flutter run -d macos

# Windows
flutter run -d windows
```

## Architecture

### State Management
- **Provider** — Simple, scalable state management with `ChangeNotifier`
- `AuthProvider` — Manages user authentication state
- `ProductProvider` — Manages product catalog & search

### Backend Services
- **Firebase Authentication** — Secure user login/registration
- **Firestore** — Real-time product, category, and user data
- **Cloud Storage** — Product images and user profile pictures

### Models
- **User** — { id, email, role, createdAt }
- **Product** — { id, name, price, categoryId, images[], rating, stock, ... }
- **Category** — { id, name, image, createdAt }

## Data Models (Firestore Collections)

### `users` Collection
```json
{
  "id": "user123",
  "email": "user@example.com",
  "role": "user|admin",
  "createdAt": "2026-02-09T12:00:00Z"
}
```

### `products` Collection
```json
{
  "id": "prod123",
  "name": "Product Name",
  "description": "...",
  "price": 29.99,
  "categoryId": "cat123",
  "sellerId": "user123",
  "images": ["https://..."],
  "stock": 50,
  "rating": 4.5,
  "createdAt": "2026-02-09T12:00:00Z"
}
```

### `categories` Collection
```json
{
  "id": "cat123",
  "name": "Electronics",
  "image": "https://...",
  "createdAt": "2026-02-09T12:00:00Z"
}
```

## Development

### Hot Reload
```bash
flutter run
# Press 'r' to hot reload code
# Press 'R' to hot restart
```

### Debugging
```bash
# Run with debug info
flutter run --verbose

# Use DevTools inspector
flutter pub global run devtools
```

### Testing
```bash
flutter test
```

## Building for Production

### Android
```bash
flutter build apk
# Or for App Bundle (Google Play):
flutter build appbundle
```

### iOS
```bash
flutter build ios
# Output: build/ios/ipa/
```

### Web
```bash
flutter build web
# Output: build/web/
```

### macOS / Windows
```bash
flutter build macos
flutter build windows
```

## Environment Configuration

Create a `.env` file (add to `.gitignore`):

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
```

Load with `flutter_dotenv` package (optional).

## Security Considerations

- ✅ Credentials stored in `firebase_options.dart` (use environment variables in production)
- ✅ Firestore Security Rules enforce authentication
- ✅ Cloud Storage signed URLs for secure image access
- ✅ Password hashing via Firebase Auth

## Troubleshooting

### Firebase not initialized?
- Check `isConfigured` in `firebase_options.dart`
- Ensure all `YOUR_*` placeholders are replaced with real credentials
- See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

### Build fails on Android?
- Ensure `google-services.json` is in `android/app/`
- Run `flutter clean && flutter pub get`

### Build fails on iOS?
- Run `cd ios && pod install --repo-update && cd ..`
- Ensure `GoogleService-Info.plist` is added to Xcode build phase

### Firestore permission denied?
- Update Security Rules to allow authenticated users
- Check Firestore > Rules in Firebase Console

## Next Steps

1. ✅ **Migrate remaining React pages** to Flutter pages
2. ✅ **Add cart management** with Provider
3. ✅ **Implement checkout flow** with Stripe/Paystack
4. ✅ **Add product search & filtering**
5. ✅ **Implement order history** with Firestore queries
6. ✅ **Add admin dashboard** for sellers
7. ✅ **Deploy to AppStore, Google Play, & Web**

## Resources

- [FlutterFire Docs](https://firebase.flutter.dev/)
- [Flutter Widgets Catalog](https://flutter.dev/docs/development/ui/widgets)
- [Provider Pattern](https://pub.dev/packages/provider)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)

## License

MIT License — See LICENSE file for details

## Support

For issues:
1. Check [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for configuration help
2. Review [Flutter Troubleshooting](https://flutter.dev/docs/testing/troubleshooting)
3. Check [Firebase Support](https://firebase.google.com/support)
