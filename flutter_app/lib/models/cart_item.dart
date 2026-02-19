import 'product_model.dart';

class CartItem {
  final Product product;
  int quantity;
  final DateTime? updatedAt;

  CartItem({required this.product, this.quantity = 1, this.updatedAt});

  double get totalPrice => product.price * quantity;

  factory CartItem.fromFirestore(Map<String, dynamic> doc) {
    final productData = doc['product'] as Map<String, dynamic>? ?? {};
    return CartItem(
      product: Product.fromFirestore(productData),
      quantity: (doc['quantity'] ?? 1) as int,
      updatedAt: doc['updatedAt'] != null
          ? DateTime.parse(doc['updatedAt'])
          : null,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'product': product.toFirestore(),
      'quantity': quantity,
      'updatedAt': (updatedAt ?? DateTime.now()).toIso8601String(),
    };
  }
}
