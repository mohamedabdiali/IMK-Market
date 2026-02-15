import 'package:flutter/material.dart';

class WishlistProvider extends ChangeNotifier {
  final Set<String> _favoriteIds = {};

  Set<String> get favoriteIds => Set.unmodifiable(_favoriteIds);

  bool isFavorite(String productId) => _favoriteIds.contains(productId);

  void toggleFavorite(String productId) {
    if (_favoriteIds.contains(productId)) {
      _favoriteIds.remove(productId);
    } else {
      _favoriteIds.add(productId);
    }
    notifyListeners();
  }

  void addToWishlist(String productId) {
    _favoriteIds.add(productId);
    notifyListeners();
  }

  void removeFromWishlist(String productId) {
    _favoriteIds.remove(productId);
    notifyListeners();
  }
}
