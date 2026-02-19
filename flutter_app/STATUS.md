# Flutter App Status - Publish Checklist

## Completed
- Firebase auth + Firestore integration (users, products, categories, cart, wishlist, orders, addresses, reviews)
- Product catalog, search, category filtering
- Cart, checkout, and order placement (COD + payment initiation support)
- Order history + order detail + tracking flow
- Address management (add/edit/delete, default address)
- Reviews and ratings flow
- Profile settings, payment methods info, support page

## Manual Steps Required Before Publish
1. Firebase credentials
   - Update `flutter_app/lib/firebase_options.dart` with real project values
   - Add `google-services.json` and `GoogleService-Info.plist`
2. Firestore rules + indexes
   - Lock down read/write rules (users scoped to their own data)
   - Add indexes for `products` and `categories` as needed
3. Seed data
   - Add categories, products, and sample images in Firestore
4. API environment
   - Configure API base for production if you are using server endpoints
5. Release signing
   - Android keystore + `android/key.properties`
   - iOS signing + provisioning profiles

## Publish Steps
1. `flutter pub get`
2. `flutter build apk` or `flutter build appbundle`
3. `flutter build ios` (on macOS)
4. Upload to Play Console / App Store Connect

## Notes
- Payment initiation returns instructions and optional payment links. COD works end-to-end.
- Mobile money proof uploads are not implemented; if required, add image upload and call `/api/payments/:id/proof`.
