import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key, required this.user});

  final User user;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('E-commerce Market'),
        actions: [
          TextButton(
            onPressed: () => FirebaseAuth.instance.signOut(),
            child: const Text('Sign out'),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Signed in',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Text('Email: ${user.email ?? '(unknown)'}'),
              const SizedBox(height: 16),
              const Text(
                'Next steps',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              const Text(
                '- Add a products collection in Firestore\n'
                '- Implement cart + checkout\n'
                '- Lock down Firestore/Storage rules',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
