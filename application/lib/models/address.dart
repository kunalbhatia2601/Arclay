class Address {
  final String id;
  final String label;
  final String fullName;
  final String phone;
  final String addressLine1;
  final String addressLine2;
  final String city;
  final String state;
  final String pincode;
  final String country;
  final bool isDefault;
  final DateTime createdAt;

  Address({
    required this.id,
    required this.label,
    required this.fullName,
    required this.phone,
    required this.addressLine1,
    required this.addressLine2,
    required this.city,
    required this.state,
    required this.pincode,
    required this.country,
    required this.isDefault,
    required this.createdAt,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['_id'] ?? '',
      label: json['label'] ?? 'Home',
      fullName: json['fullName'] ?? '',
      phone: json['phone'] ?? '',
      addressLine1: json['addressLine1'] ?? '',
      addressLine2: json['addressLine2'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      pincode: json['pincode'] ?? '',
      country: json['country'] ?? 'India',
      isDefault: json['isDefault'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'fullName': fullName,
      'phone': phone,
      'addressLine1': addressLine1,
      'addressLine2': addressLine2,
      'city': city,
      'state': state,
      'pincode': pincode,
      'country': country,
      'isDefault': isDefault,
    };
  }

  String get fullAddress {
    final parts = <String>[
      addressLine1,
      if (addressLine2.isNotEmpty) addressLine2,
      city,
      state,
      pincode,
      country,
    ];
    return parts.join(', ');
  }

  String get shortAddress {
    return '$addressLine1, $city';
  }
}
