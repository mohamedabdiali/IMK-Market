// Firebase configuration file for Flutter E-commerce App
//
// TO CONFIGURE:
// 1. Get your Firebase credentials from: https://console.firebase.google.com
// 2. Project Settings > Your apps > Download config files
// 3. Replace empty string values below with your actual Firebase credentials
// 4. See FIREBASE_SETUP.md for detailed instructions

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class DefaultFirebaseOptions {
  // ============================================
  // REPLACE THESE PLACEHOLDERS WITH YOUR CREDENTIALS
  // ============================================

  static const String _projectId =
      'YOUR_PROJECT_ID'; // e.g., 'ecommerce-market'
  static const String _apiKey = 'YOUR_WEB_API_KEY'; // From Firebase Console
  static const String _appId = 'YOUR_WEB_APP_ID'; // From Firebase Console
  static const String _messagingSenderId =
      'YOUR_MESSAGING_SENDER_ID'; // From Firebase Console
  static const String _authDomain =
      'YOUR_AUTH_DOMAIN'; // e.g., 'ecommerce-market.firebaseapp.com'
  static const String _storageBucket =
      'YOUR_STORAGE_BUCKET'; // e.g., 'ecommerce-market.appspot.com'

  static FirebaseOptions? tryGetCurrentPlatform() {
    try {
      return currentPlatform;
    } on UnsupportedError {
      return null;
    }
  }

  static bool get isConfigured {
    final options = tryGetCurrentPlatform();
    if (options == null) return false;
    // Check if any placeholder values remain (indicates not configured)
    if (_projectId.contains('YOUR_')) return false;
    if (_apiKey.contains('YOUR_')) return false;
    return options.apiKey.isNotEmpty &&
        options.appId.isNotEmpty &&
        options.messagingSenderId.isNotEmpty &&
        options.projectId.isNotEmpty;
  }

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
        throw UnsupportedError(
          'Firebase is not configured for Linux. See FIREBASE_SETUP.md.',
        );
      case TargetPlatform.fuchsia:
        throw UnsupportedError(
          'Firebase is not configured for Fuchsia. See FIREBASE_SETUP.md.',
        );
    }
  }

  // Web configuration
  // Get these values from Firebase Console > Project Settings > Web app
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: _apiKey, // YOUR_WEB_API_KEY
    appId: _appId, // YOUR_WEB_APP_ID
    messagingSenderId: _messagingSenderId,
    projectId: _projectId,
    authDomain: _authDomain, // e.g., 'my-project.firebaseapp.com'
    storageBucket: _storageBucket, // e.g., 'my-project.appspot.com'
  );

  // Android configuration
  // Credentials come from google-services.json (in android/app/)
  static const FirebaseOptions android = FirebaseOptions(
    apiKey:
        'AIzaSyDqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq', // From google-services.json
    appId:
        '1:123456789:android:abcdef1234567890abcdef', // From google-services.json
    messagingSenderId: _messagingSenderId,
    projectId: _projectId,
    storageBucket: _storageBucket,
  );

  // iOS configuration
  // Credentials come from GoogleService-Info.plist (in ios/Runner/)
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey:
        'AIzaSyDqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq', // From GoogleService-Info.plist
    appId:
        '1:123456789:ios:abcdef1234567890abcdef', // From GoogleService-Info.plist
    messagingSenderId: _messagingSenderId,
    projectId: _projectId,
    storageBucket: _storageBucket,
    iosBundleId: 'com.example.ecommerceMarket', // Your iOS Bundle ID
  );

  // macOS configuration (same as iOS)
  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyDqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
    appId: '1:123456789:ios:abcdef1234567890abcdef',
    messagingSenderId: _messagingSenderId,
    projectId: _projectId,
    storageBucket: _storageBucket,
    iosBundleId: 'com.example.ecommerceMarket',
  );

  // Windows configuration
  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: _apiKey,
    appId: 'YOUR_WINDOWS_APP_ID',
    messagingSenderId: _messagingSenderId,
    projectId: _projectId,
    authDomain: _authDomain,
    storageBucket: _storageBucket,
  );
}
