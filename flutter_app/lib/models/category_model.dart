class Category {
  final String id;
  final String name;
  final String image;
  final DateTime createdAt;

  Category({
    required this.id,
    required this.name,
    required this.image,
    required this.createdAt,
  });

  factory Category.fromFirestore(Map<String, dynamic> doc) {
    return Category(
      id: doc['id'] ?? '',
      name: doc['name'] ?? '',
      image: doc['image'] ?? '',
      createdAt: doc['createdAt'] != null
          ? DateTime.parse(doc['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'id': id,
      'name': name,
      'image': image,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
