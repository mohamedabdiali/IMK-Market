class User {
  final String id;
  final String email;
  final String? name;
  final String? phone;
  final String? photoUrl;
  final String role; // 'admin' or 'user'
  final DateTime createdAt;
  final DateTime? updatedAt;

  User({
    required this.id,
    required this.email,
    this.name,
    this.phone,
    this.photoUrl,
    required this.role,
    required this.createdAt,
    this.updatedAt,
  });

  factory User.fromFirestore(Map<String, dynamic> doc) {
    return User(
      id: doc['id'] ?? '',
      email: doc['email'] ?? '',
      name: doc['name'],
      phone: doc['phone'],
      photoUrl: doc['photoUrl'],
      role: doc['role'] ?? 'user',
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
      'email': email,
      'name': name,
      'phone': phone,
      'photoUrl': photoUrl,
      'role': role,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
