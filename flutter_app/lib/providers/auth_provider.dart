import 'package:flutter/material.dart';
import 'package:flutter_app/models/user_model.dart';
import 'package:flutter_app/services/firebase_auth_service.dart';
import 'package:flutter_app/services/firestore_service.dart';

class AuthProvider extends ChangeNotifier {
  final FirebaseAuthService _authService = FirebaseAuthService();
  final FirestoreService _firestoreService = FirestoreService();

  User? _currentUser;
  bool _isTrackingSession = false;
  String? _trackingOrderId;
  String? _trackingNumber;
  bool _isLoading = false;
  String? _error;

  User? get currentUser => _currentUser;
  bool get isTrackingSession => _isTrackingSession;
  String? get trackingOrderId => _trackingOrderId;
  String? get trackingNumber => _trackingNumber;
  bool get isLoading => _isLoading;
  bool get isAuthenticated =>
      _authService.isAuthenticated || _isTrackingSession;
  String? get error => _error;

  AuthProvider() {
    _authService.authStateChanges.listen((firebaseUser) async {
      if (firebaseUser != null) {
        _isTrackingSession = false;
        _trackingOrderId = null;
        _trackingNumber = null;
        _currentUser =
            await _firestoreService.getUser(firebaseUser.uid) ??
            User(
              id: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              role: 'user',
              createdAt: DateTime.now(),
            );
      } else {
        if (!_isTrackingSession) {
          _currentUser = null;
        }
      }
      notifyListeners();
    });
  }

  Future<void> register(String email, String password, String name) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final userCredential = await _authService.registerWithEmail(
        email,
        password,
      );

      final user = User(
        id: userCredential.user!.uid,
        email: email,
        role: 'user',
        createdAt: DateTime.now(),
      );

      await _firestoreService.createUser(user);
      if (userCredential.user != null) {
        await _authService.updateProfile(name);
      }

      _currentUser = user;
      _isTrackingSession = false;
      _trackingOrderId = null;
      _trackingNumber = null;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authService.loginWithEmail(email, password);
      _isTrackingSession = false;
      _trackingOrderId = null;
      _trackingNumber = null;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      if (_authService.currentUser != null) {
        await _authService.logout();
      }
      _currentUser = null;
      _isTrackingSession = false;
      _trackingOrderId = null;
      _trackingNumber = null;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  void loginAsTrackingCustomer(String orderId, String trackingNumber) {
    _isTrackingSession = true;
    _trackingOrderId = orderId.trim().toUpperCase();
    _trackingNumber = trackingNumber.trim().toUpperCase();
    _currentUser = User(
      id: 'tracking-${_trackingOrderId!}',
      email: '${_trackingOrderId!.toLowerCase()}@tracking.local',
      role: 'user',
      createdAt: DateTime.now(),
    );
    notifyListeners();
  }

  Future<void> resetPassword(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authService.resetPassword(email);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
}
