import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_app/models/cart_item.dart';
import 'package:flutter_app/models/product_model.dart';
import 'package:flutter_app/services/firestore_service.dart';

class CartProvider extends ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();
  final List<CartItem> _items = [];
  StreamSubscription<List<CartItem>>? _subscription;
  String? _userId;
  bool _isLoading = false;
  String? _error;

  List<CartItem> get items => List.unmodifiable(_items);
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get itemCount => _items.fold(0, (sum, it) => sum + it.quantity);

  double get totalAmount => _items.fold(0.0, (sum, it) => sum + it.totalPrice);

  void updateUser(String? userId) {
    if (_userId == userId) return;
    _userId = userId;
    _subscription?.cancel();
    _items.clear();
    _error = null;

    if (userId == null) {
      _isLoading = false;
      notifyListeners();
      return;
    }

    _isLoading = true;
    notifyListeners();
    _subscription = _firestoreService.getCartItems(userId).listen(
      (items) {
        _items
          ..clear()
          ..addAll(items);
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

  Future<void> addProduct(Product product, {int quantity = 1}) async {
    if (_userId == null) {
      final idx = _items.indexWhere((it) => it.product.id == product.id);
      if (idx >= 0) {
        _items[idx].quantity += quantity;
      } else {
        _items.add(CartItem(product: product, quantity: quantity));
      }
      notifyListeners();
      return;
    }

    final existing = _items.firstWhere(
      (item) => item.product.id == product.id,
      orElse: () => CartItem(product: product, quantity: 0),
    );
    final updated = CartItem(
      product: product,
      quantity: existing.quantity + quantity,
    );
    await _firestoreService.setCartItem(_userId!, updated);
  }

  Future<void> removeProduct(String productId) async {
    if (_userId == null) {
      _items.removeWhere((it) => it.product.id == productId);
      notifyListeners();
      return;
    }
    await _firestoreService.removeCartItem(_userId!, productId);
  }

  Future<void> clear() async {
    if (_userId == null) {
      _items.clear();
      notifyListeners();
      return;
    }
    await _firestoreService.clearCart(_userId!);
  }

  Future<void> changeQuantity(String productId, int qty) async {
    final idx = _items.indexWhere((it) => it.product.id == productId);
    if (idx < 0) return;
    if (qty <= 0) {
      await removeProduct(productId);
      return;
    }

    if (_userId == null) {
      _items[idx].quantity = qty;
      notifyListeners();
      return;
    }

    final item = _items[idx];
    final updated = CartItem(product: item.product, quantity: qty);
    await _firestoreService.setCartItem(_userId!, updated);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
