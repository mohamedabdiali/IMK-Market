class OrderItem {
  final String productId;
  final String productName;
  final double price;
  final int quantity;
  final String? image;

  OrderItem({
    required this.productId,
    required this.productName,
    required this.price,
    required this.quantity,
    this.image,
  });

  factory OrderItem.fromJson(Map<String, dynamic> doc) {
    return OrderItem(
      productId: doc['productId']?.toString() ?? '',
      productName: doc['productName'] ?? '',
      price: (doc['price'] ?? 0).toDouble(),
      quantity: (doc['quantity'] ?? 0).toInt(),
      image: doc['image'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'productName': productName,
      'price': price,
      'quantity': quantity,
      'image': image,
    };
  }

  double get total => price * quantity;
}

class OrderRecord {
  final String id;
  final String backendOrderId;
  final String? trackingNumber;
  final String status;
  final String paymentMethod;
  final String paymentStatus;
  final double total;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String shippingAddress;
  final List<OrderItem> items;
  final DateTime createdAt;
  final DateTime? updatedAt;

  OrderRecord({
    required this.id,
    required this.backendOrderId,
    required this.status,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.total,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    required this.shippingAddress,
    required this.items,
    required this.createdAt,
    this.trackingNumber,
    this.updatedAt,
  });

  factory OrderRecord.fromFirestore(Map<String, dynamic> doc) {
    return OrderRecord(
      id: doc['id'] ?? '',
      backendOrderId: doc['backendOrderId'] ?? '',
      trackingNumber: doc['trackingNumber'],
      status: doc['status'] ?? 'pending',
      paymentMethod: doc['paymentMethod'] ?? 'cod',
      paymentStatus: doc['paymentStatus'] ?? 'pending',
      total: (doc['total'] ?? 0).toDouble(),
      customerName: doc['customerName'] ?? '',
      customerEmail: doc['customerEmail'] ?? '',
      customerPhone: doc['customerPhone'] ?? '',
      shippingAddress: doc['shippingAddress'] ?? '',
      items: (doc['items'] as List<dynamic>? ?? [])
          .map((item) => OrderItem.fromJson(item as Map<String, dynamic>))
          .toList(),
      createdAt: doc['createdAt'] != null
          ? DateTime.parse(doc['createdAt'])
          : DateTime.now(),
      updatedAt: doc['updatedAt'] != null
          ? DateTime.parse(doc['updatedAt'])
          : null,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'id': id,
      'backendOrderId': backendOrderId,
      'trackingNumber': trackingNumber,
      'status': status,
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
      'total': total,
      'customerName': customerName,
      'customerEmail': customerEmail,
      'customerPhone': customerPhone,
      'shippingAddress': shippingAddress,
      'items': items.map((item) => item.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
