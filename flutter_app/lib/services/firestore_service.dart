import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_app/models/category_model.dart';
import 'package:flutter_app/models/product_model.dart';
import 'package:flutter_app/models/user_model.dart';

class FirestoreService {
  static final FirestoreService _instance = FirestoreService._internal();

  factory FirestoreService() {
    return _instance;
  }

  FirestoreService._internal();

  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // ============ Users ============

  Future<void> createUser(User user) {
    return _db.collection('users').doc(user.id).set(user.toFirestore());
  }

  Future<User?> getUser(String userId) async {
    final doc = await _db.collection('users').doc(userId).get();
    if (!doc.exists) return null;
    return User.fromFirestore(doc.data()!);
  }

  Future<void> updateUser(User user) {
    return _db.collection('users').doc(user.id).update(user.toFirestore());
  }

  // ============ Categories ============

  Stream<List<Category>> getCategories() {
    return _db
        .collection('categories')
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => Category.fromFirestore(doc.data()))
              .toList(),
        );
  }

  Future<Category?> getCategory(String categoryId) async {
    final doc = await _db.collection('categories').doc(categoryId).get();
    if (!doc.exists) return null;
    return Category.fromFirestore(doc.data()!);
  }

  Future<void> createCategory(Category category) {
    return _db
        .collection('categories')
        .doc(category.id)
        .set(category.toFirestore());
  }

  // ============ Products ============

  Stream<List<Product>> getProducts({
    String? categoryId,
    String? searchQuery,
    int limit = 20,
  }) {
    var query = _db
        .collection('products')
        .orderBy('createdAt', descending: true);

    if (categoryId != null) {
      query = query.where('categoryId', isEqualTo: categoryId);
    }

    if (searchQuery != null && searchQuery.isNotEmpty) {
      query = query
          .where('name', isGreaterThanOrEqualTo: searchQuery)
          .where('name', isLessThan: '${searchQuery}z');
    }

    query = query.limit(limit);

    return query.snapshots().map(
      (snapshot) => snapshot.docs
          .map((doc) => Product.fromFirestore(doc.data()))
          .toList(),
    );
  }

  Future<Product?> getProduct(String productId) async {
    final doc = await _db.collection('products').doc(productId).get();
    if (!doc.exists) return null;
    return Product.fromFirestore(doc.data()!);
  }

  Future<void> createProduct(Product product) {
    return _db
        .collection('products')
        .doc(product.id)
        .set(product.toFirestore());
  }

  Future<void> updateProduct(Product product) {
    return _db
        .collection('products')
        .doc(product.id)
        .update(product.toFirestore());
  }

  Future<void> deleteProduct(String productId) {
    return _db.collection('products').doc(productId).delete();
  }

  Future<List<Product>> getProductsByCategory(String categoryId) async {
    final snapshot = await _db
        .collection('products')
        .where('categoryId', isEqualTo: categoryId)
        .get();
    return snapshot.docs
        .map((doc) => Product.fromFirestore(doc.data()))
        .toList();
  }

  Future<List<Product>> getProductsBySeller(String sellerId) async {
    final snapshot = await _db
        .collection('products')
        .where('sellerId', isEqualTo: sellerId)
        .get();
    return snapshot.docs
        .map((doc) => Product.fromFirestore(doc.data()))
        .toList();
  }
}
