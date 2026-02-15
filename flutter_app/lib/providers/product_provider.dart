import 'package:flutter/material.dart';
import 'package:flutter_app/models/product_model.dart';
import 'package:flutter_app/services/firestore_service.dart';

class ProductProvider extends ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();

  List<Product> _products = [];
  bool _isLoading = false;
  String? _error;
  String? _selectedCategoryId;

  List<Product> get products => _products;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get selectedCategoryId => _selectedCategoryId;

  ProductProvider() {
    _loadProducts();
  }

  void _loadProducts() {
    _isLoading = true;
    notifyListeners();

    _firestoreService
        .getProducts(categoryId: _selectedCategoryId)
        .listen(
          (products) {
            _products = products;
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

  void filterByCategory(String? categoryId) {
    _selectedCategoryId = categoryId;
    _loadProducts();
  }

  Future<void> searchProducts(String query) async {
    _isLoading = true;
    notifyListeners();

    try {
      _firestoreService.getProducts(searchQuery: query).listen((products) {
        _products = products;
        _isLoading = false;
        _error = null;
        notifyListeners();
      });
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createProduct(Product product) async {
    try {
      await _firestoreService.createProduct(product);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> updateProduct(Product product) async {
    try {
      await _firestoreService.updateProduct(product);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> deleteProduct(String productId) async {
    try {
      await _firestoreService.deleteProduct(productId);
      _products.removeWhere((p) => p.id == productId);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }
}
