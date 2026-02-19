class Address {
  final String id;
  final String label;
  final String fullName;
  final String phone;
  final String line1;
  final String line2;
  final String city;
  final String state;
  final String country;
  final String postalCode;
  final bool isDefault;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Address({
    required this.id,
    required this.label,
    required this.fullName,
    required this.phone,
    required this.line1,
    this.line2 = '',
    required this.city,
    required this.state,
    required this.country,
    this.postalCode = '',
    this.isDefault = false,
    required this.createdAt,
    this.updatedAt,
  });

  factory Address.fromFirestore(Map<String, dynamic> doc) {
    return Address(
      id: doc['id'] ?? '',
      label: doc['label'] ?? 'Address',
      fullName: doc['fullName'] ?? '',
      phone: doc['phone'] ?? '',
      line1: doc['line1'] ?? '',
      line2: doc['line2'] ?? '',
      city: doc['city'] ?? '',
      state: doc['state'] ?? '',
      country: doc['country'] ?? '',
      postalCode: doc['postalCode'] ?? '',
      isDefault: doc['isDefault'] == true,
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
      'label': label,
      'fullName': fullName,
      'phone': phone,
      'line1': line1,
      'line2': line2,
      'city': city,
      'state': state,
      'country': country,
      'postalCode': postalCode,
      'isDefault': isDefault,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  String get formatted => [
        line1,
        if (line2.isNotEmpty) line2,
        city,
        state,
        postalCode,
        country,
      ].where((value) => value.trim().isNotEmpty).join(', ');
}
