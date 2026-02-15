import 'package:firebase_auth/firebase_auth.dart';

class FirebaseAuthService {
  static final FirebaseAuthService _instance = FirebaseAuthService._internal();

  factory FirebaseAuthService() {
    return _instance;
  }

  FirebaseAuthService._internal();

  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;

  // Auth state stream
  Stream<User?> get authStateChanges => _firebaseAuth.authStateChanges();

  // Current user
  User? get currentUser => _firebaseAuth.currentUser;

  // Register with email and password
  Future<UserCredential> registerWithEmail(String email, String password) {
    return _firebaseAuth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  // Login with email and password
  Future<UserCredential> loginWithEmail(String email, String password) {
    return _firebaseAuth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  // Logout
  Future<void> logout() {
    return _firebaseAuth.signOut();
  }

  // Update user profile
  Future<void> updateProfile(String displayName, {String? photoUrl}) async {
    await _firebaseAuth.currentUser?.updateDisplayName(displayName);
    if (photoUrl != null) {
      await _firebaseAuth.currentUser?.updatePhotoURL(photoUrl);
    }
  }

  // Reset password
  Future<void> resetPassword(String email) {
    return _firebaseAuth.sendPasswordResetEmail(email: email);
  }

  // Get ID token
  Future<String?> getIdToken() async {
    final user = _firebaseAuth.currentUser;
    if (user == null) return null;
    return await user.getIdToken();
  }

  // Check if user is authenticated
  bool get isAuthenticated => _firebaseAuth.currentUser != null;
}
