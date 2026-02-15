# Capacitor Plugins → Flutter Plugin Mapping

This project previously used Capacitor plugins for native functionality. Below are recommended Flutter plugin equivalents and quick migration notes.

- Camera
  - Capacitor: `@capacitor/camera`
  - Flutter: `image_picker` or `camera` (for advanced control)

- Filesystem
  - Capacitor: `@capacitor/filesystem`
  - Flutter: `path_provider` + `dart:io` or `file_picker` for picking files

- Push Notifications
  - Capacitor: `@capacitor/push-notifications`
  - Flutter: `firebase_messaging`

- Geolocation
  - Capacitor: `@capacitor/geolocation`
  - Flutter: `geolocator` or `location`

- Network Status
  - Capacitor: `@capacitor/network`
  - Flutter: `connectivity_plus`

- Device Info
  - Capacitor: `@capacitor/device`
  - Flutter: `device_info_plus`

- Share
  - Capacitor: `@capacitor/share`
  - Flutter: `share_plus`

- Local Notifications
  - Capacitor: `LocalNotifications`
  - Flutter: `flutter_local_notifications`

- In-App Browser
  - Capacitor: `Browser`
  - Flutter: `url_launcher` or `webview_flutter` for embedded webview

- Native Storage
  - Capacitor: `Storage`
  - Flutter: `shared_preferences` or `flutter_secure_storage` for sensitive data

Migration notes:
- Replace Capacitor plugin calls with the Flutter plugin API in your Dart code.
- Use `flutter_svg` or `cached_network_image` for optimized image handling.
- For platform-specific native code, use `platform channels` or write a Flutter plugin.
- Remove Capacitor build folders if no longer needed (`android`, `ios` inside root were kept for reference). Be careful not to delete original `android/` and `ios/` used by the Flutter app.

Example: Replacing Camera usage
- Capacitor (JS): `const photo = await Camera.getPhoto({ ... })`
- Flutter (Dart):
  ```dart
  final XFile? image = await ImagePicker().pickImage(source: ImageSource.camera);
  ```

Store this document with the Flutter project to guide the final native replacements.
