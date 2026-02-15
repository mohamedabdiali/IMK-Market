class User {
  final String id;
  final String email;
  final String role; // 'admin' or 'user'
  final DateTime createdAt;

  User({
    required this.id,
    required this.email,
    required this.role,
    required this.createdAt,
  });

  factory User.fromFirestore(Map<String, dynamic> doc) {
    return User(
      id: doc['id'] ?? '',
      email: doc['email'] ?? '',
      role: doc['role'] ?? 'user',
      createdAt: doc['createdAt'] != null
          ? DateTime.parse(doc['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'id': id,
      'email': email,
      'role': role,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
