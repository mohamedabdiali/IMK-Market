class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final String categoryId;
  final String sellerId;
  final List<String> images;
  final List<String> videos;
  final int stock;
  final double rating;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.categoryId,
    required this.sellerId,
    required this.images,
    required this.videos,
    required this.stock,
    this.rating = 0.0,
    required this.createdAt,
    this.updatedAt,
  });

  factory Product.fromFirestore(Map<String, dynamic> doc) {
    return Product(
      id: doc['id'] ?? '',
      name: doc['name'] ?? '',
      description: doc['description'] ?? '',
      price: (doc['price'] ?? 0).toDouble(),
      categoryId: doc['categoryId'] ?? '',
      sellerId: doc['sellerId'] ?? '',
      images: List<String>.from(doc['images'] ?? []),
      videos: List<String>.from(doc['videos'] ?? []),
      stock: doc['stock'] ?? 0,
      rating: (doc['rating'] ?? 0).toDouble(),
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
      'name': name,
      'description': description,
      'price': price,
      'categoryId': categoryId,
      'sellerId': sellerId,
      'images': images,
      'videos': videos,
      'stock': stock,
      'rating': rating,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
