import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'package:flutter_app/features/auth/sign_in_page.dart';
import 'package:flutter_app/features/home/home_page.dart';

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: SafeArea(child: Center(child: CircularProgressIndicator())),
          );
        }

        final user = snapshot.data;
        if (user == null) return const SignInPage();
        return HomePage(user: user);
      },
    );
  }
}
