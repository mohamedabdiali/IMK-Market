import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_app/models/address_model.dart';
import 'package:flutter_app/models/cart_item.dart';
import 'package:flutter_app/models/category_model.dart';
import 'package:flutter_app/models/order_model.dart';
import 'package:flutter_app/models/product_model.dart';
import 'package:flutter_app/models/review_model.dart';
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

  // ============ Cart ============

  Stream<List<CartItem>> getCartItems(String userId) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('cart')
        .orderBy('updatedAt', descending: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => CartItem.fromFirestore(doc.data()))
              .toList(),
        );
  }

  Future<void> setCartItem(String userId, CartItem item) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('cart')
        .doc(item.product.id)
        .set({
          ...item.toFirestore(),
          'productId': item.product.id,
        });
  }

  Future<void> removeCartItem(String userId, String productId) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('cart')
        .doc(productId)
        .delete();
  }

  Future<void> clearCart(String userId) async {
    final snapshot =
        await _db.collection('users').doc(userId).collection('cart').get();
    final batch = _db.batch();
    for (final doc in snapshot.docs) {
      batch.delete(doc.reference);
    }
    await batch.commit();
  }

  // ============ Wishlist ============

  Stream<Set<String>> getWishlistIds(String userId) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('wishlist')
        .snapshots()
        .map(
          (snapshot) =>
              snapshot.docs.map((doc) => doc.id.toString()).toSet(),
        );
  }

  Future<void> addWishlistItem(String userId, String productId) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('wishlist')
        .doc(productId)
        .set({
          'productId': productId,
          'createdAt': DateTime.now().toIso8601String(),
        });
  }

  Future<void> removeWishlistItem(String userId, String productId) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('wishlist')
        .doc(productId)
        .delete();
  }

  // ============ Addresses ============

  Stream<List<Address>> getAddresses(String userId) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('addresses')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => Address.fromFirestore(doc.data()))
              .toList(),
        );
  }

  Future<void> upsertAddress(String userId, Address address) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('addresses')
        .doc(address.id)
        .set(address.toFirestore(), SetOptions(merge: true));
  }

  Future<void> deleteAddress(String userId, String addressId) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('addresses')
        .doc(addressId)
        .delete();
  }

  Future<void> setDefaultAddress(String userId, String addressId) async {
    final snapshot =
        await _db.collection('users').doc(userId).collection('addresses').get();
    final batch = _db.batch();
    for (final doc in snapshot.docs) {
      batch.update(doc.reference, {'isDefault': doc.id == addressId});
    }
    await batch.commit();
  }

  // ============ Orders ============

  Stream<List<OrderRecord>> getOrders(String userId) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('orders')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => OrderRecord.fromFirestore(doc.data()))
              .toList(),
        );
  }

  Future<void> createOrderRecord(String userId, OrderRecord order) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('orders')
        .doc(order.id)
        .set(order.toFirestore());
  }

  Future<void> updateOrderRecord(String userId, OrderRecord order) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('orders')
        .doc(order.id)
        .update(order.toFirestore());
  }

  // ============ Reviews ============

  Stream<List<Review>> getReviews(String productId) {
    return _db
        .collection('products')
        .doc(productId)
        .collection('reviews')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => Review.fromFirestore(doc.data()))
              .toList(),
        );
  }

  Future<void> addReview(String productId, Review review) {
    return _db
        .collection('products')
        .doc(productId)
        .collection('reviews')
        .doc(review.id)
        .set(review.toFirestore());
  }
}
