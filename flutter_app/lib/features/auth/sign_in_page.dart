import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit({required bool createAccount}) async {
    setState(() {
      _errorMessage = null;
    });
    if (!_formKey.currentState!.validate()) return;

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    setState(() => _isSubmitting = true);
    try {
      if (createAccount) {
        await FirebaseAuth.instance.createUserWithEmailAndPassword(
          email: email,
          password: password,
        );
      } else {
        await FirebaseAuth.instance.signInWithEmailAndPassword(
          email: email,
          password: password,
        );
      }
    } on FirebaseAuthException catch (e) {
      setState(() => _errorMessage = _friendlyAuthError(e));
    } catch (_) {
      setState(() => _errorMessage = 'Sign-in failed. Please try again.');
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  String _friendlyAuthError(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'user-disabled':
        return 'This account has been disabled.';
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
        return 'Invalid email or password.';
      case 'email-already-in-use':
        return 'An account with this email already exists.';
      case 'weak-password':
        return 'Password is too weak. Use at least 8 characters.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return e.message ?? 'Authentication failed.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isBusy = _isSubmitting;

    return Scaffold(
      appBar: AppBar(title: const Text('Sign in')),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const SizedBox(height: 12),
                const Text(
                  'Welcome back',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                const Text('Sign in to continue.'),
                const SizedBox(height: 16),
                if (_errorMessage != null) ...[
                  MaterialBanner(
                    content: Text(_errorMessage!),
                    actions: [
                      TextButton(
                        onPressed: () => setState(() => _errorMessage = null),
                        child: const Text('Dismiss'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
                Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const [AutofillHints.email],
                        textInputAction: TextInputAction.next,
                        decoration: const InputDecoration(labelText: 'Email'),
                        validator: (value) {
                          final v = value?.trim() ?? '';
                          if (v.isEmpty) return 'Email is required';
                          if (!v.contains('@')) return 'Enter a valid email';
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: true,
                        autofillHints: const [AutofillHints.password],
                        textInputAction: TextInputAction.done,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                        ),
                        validator: (value) {
                          final v = value ?? '';
                          if (v.isEmpty) return 'Password is required';
                          if (v.length < 8) return 'Use at least 8 characters';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: isBusy
                            ? null
                            : () => _submit(createAccount: false),
                        child: isBusy
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('Sign in'),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton(
                        onPressed: isBusy
                            ? null
                            : () => _submit(createAccount: true),
                        child: const Text('Create account'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
