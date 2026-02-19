class Review {
  final String id;
  final String productId;
  final String userId;
  final String userName;
  final double rating;
  final String comment;
  final DateTime createdAt;

  Review({
    required this.id,
    required this.productId,
    required this.userId,
    required this.userName,
    required this.rating,
    required this.comment,
    required this.createdAt,
  });

  factory Review.fromFirestore(Map<String, dynamic> doc) {
    return Review(
      id: doc['id'] ?? '',
      productId: doc['productId'] ?? '',
      userId: doc['userId'] ?? '',
      userName: doc['userName'] ?? '',
      rating: (doc['rating'] ?? 0).toDouble(),
      comment: doc['comment'] ?? '',
      createdAt: doc['createdAt'] != null
          ? DateTime.parse(doc['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'id': id,
      'productId': productId,
      'userId': userId,
      'userName': userName,
      'rating': rating,
      'comment': comment,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
