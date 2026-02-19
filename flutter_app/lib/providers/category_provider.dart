import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_app/models/category_model.dart';
import 'package:flutter_app/services/firestore_service.dart';

class CategoryProvider extends ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();

  List<Category> _categories = [];
  bool _isLoading = false;
  String? _error;
  StreamSubscription<List<Category>>? _subscription;

  List<Category> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get error => _error;

  CategoryProvider() {
    _loadCategories();
  }

  void _loadCategories() {
    _isLoading = true;
    notifyListeners();

    _subscription?.cancel();
    _subscription = _firestoreService.getCategories().listen(
      (categories) {
        _categories = categories;
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

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
