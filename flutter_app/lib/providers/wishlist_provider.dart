import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_app/services/firestore_service.dart';

class WishlistProvider extends ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();
  final Set<String> _favoriteIds = {};
  StreamSubscription<Set<String>>? _subscription;
  String? _userId;
  bool _isLoading = false;
  String? _error;

  Set<String> get favoriteIds => Set.unmodifiable(_favoriteIds);
  bool get isLoading => _isLoading;
  String? get error => _error;

  bool isFavorite(String productId) => _favoriteIds.contains(productId);

  void updateUser(String? userId) {
    if (_userId == userId) return;
    _userId = userId;
    _subscription?.cancel();
    _favoriteIds.clear();
    _error = null;

    if (userId == null) {
      _isLoading = false;
      notifyListeners();
      return;
    }

    _isLoading = true;
    notifyListeners();
    _subscription = _firestoreService.getWishlistIds(userId).listen(
      (ids) {
        _favoriteIds
          ..clear()
          ..addAll(ids);
        _isLoading = false;
        _error = null;
        notifyListeners();
      },
      onError: (e) {
        _error = e.toString();
        _isLoading = false;
        notifyListeners();
      },
    );
  }

  Future<void> toggleFavorite(String productId) async {
    if (_userId == null) {
      if (_favoriteIds.contains(productId)) {
        _favoriteIds.remove(productId);
      } else {
        _favoriteIds.add(productId);
      }
      notifyListeners();
      return;
    }

    if (_favoriteIds.contains(productId)) {
      await _firestoreService.removeWishlistItem(_userId!, productId);
    } else {
      await _firestoreService.addWishlistItem(_userId!, productId);
    }
  }

  Future<void> addToWishlist(String productId) async {
    if (_userId == null) {
      _favoriteIds.add(productId);
      notifyListeners();
      return;
    }
    await _firestoreService.addWishlistItem(_userId!, productId);
  }

  Future<void> removeFromWishlist(String productId) async {
    if (_userId == null) {
      _favoriteIds.remove(productId);
      notifyListeners();
      return;
    }
    await _firestoreService.removeWishlistItem(_userId!, productId);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
