import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class StartupErrorPage extends StatelessWidget {
  const StartupErrorPage({super.key, required this.error});

  final Object? error;

  @override
  Widget build(BuildContext context) {
    final message = error is Error
        ? (error as Error).toString()
        : error is Exception
        ? (error as Exception).toString()
        : error?.toString() ?? 'Unknown error';

    return Scaffold(
      appBar: AppBar(title: const Text('Startup Error')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'The app failed to start.',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              const Text(
                'This is usually caused by missing Firebase configuration or an invalid Firebase project setup.',
              ),
              const SizedBox(height: 16),
              const Text('Error details:'),
              const SizedBox(height: 8),
              SelectableText(
                message,
                style: const TextStyle(fontFamily: 'monospace'),
              ),
              const SizedBox(height: 16),
              if (kDebugMode)
                const Text(
                  'Tip: run `flutterfire configure` and ensure the generated options and platform config files are present.',
                ),
            ],
          ),
        ),
      ),
    );
  }
}
