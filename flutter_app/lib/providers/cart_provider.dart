import 'package:flutter/material.dart';
import '../models/cart_item.dart';
import '../models/product_model.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  int get itemCount => _items.fold(0, (sum, it) => sum + it.quantity);

  double get totalAmount => _items.fold(0.0, (sum, it) => sum + it.totalPrice);

  void addProduct(Product product) {
    final idx = _items.indexWhere((it) => it.product.id == product.id);
    if (idx >= 0) {
      _items[idx].quantity += 1;
    } else {
      _items.add(CartItem(product: product));
    }
    notifyListeners();
  }

  void removeProduct(String productId) {
    _items.removeWhere((it) => it.product.id == productId);
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }

  void changeQuantity(String productId, int qty) {
    final idx = _items.indexWhere((it) => it.product.id == productId);
    if (idx >= 0) {
      if (qty <= 0) {
        _items.removeAt(idx);
      } else {
        _items[idx].quantity = qty;
      }
      notifyListeners();
    }
  }
}
