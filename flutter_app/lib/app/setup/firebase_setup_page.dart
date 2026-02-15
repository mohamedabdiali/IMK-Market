import 'package:flutter/material.dart';

class FirebaseSetupPage extends StatelessWidget {
  const FirebaseSetupPage({super.key});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Firebase Setup Required')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Firebase is not configured for this app yet.',
              style: textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'To finish setup, create a Firebase project and generate platform config using FlutterFire.',
              style: textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            const _Step(
              number: 1,
              title: 'Install FlutterFire CLI (one time)',
              body: 'dart pub global activate flutterfire_cli',
            ),
            const _Step(
              number: 2,
              title: 'Configure Firebase for this app',
              body: 'flutterfire configure',
            ),
            const _Step(
              number: 3,
              title: 'Verify config files',
              body:
                  'Android: flutter_app/android/app/google-services.json\n'
                  'iOS: flutter_app/ios/Runner/GoogleService-Info.plist',
            ),
            const SizedBox(height: 16),
            Text(
              'This screen is shown because `flutter_app/lib/firebase_options.dart` still contains placeholder values.',
              style: textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.number, required this.title, required this.body});

  final int number;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$number. $title', style: textTheme.titleMedium),
          const SizedBox(height: 4),
          SelectableText(
            body,
            style: textTheme.bodyMedium?.copyWith(fontFamily: 'monospace'),
          ),
        ],
      ),
    );
  }
}
