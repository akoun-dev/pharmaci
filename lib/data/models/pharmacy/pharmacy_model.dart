// Pharmacy information model
class PharmacyModel {
  final String id;
  final String name;
  final String address;
  final String city;
  final String country;
  final double latitude;
  final double longitude;
  final String phone;
  final String? email;
  final bool isVerified;
  final bool isOpenNow;
  final String? openHours;
  final String? closeHours;
  final String? imageUrl;
  final double rating;
  final int reviewCount;
  final List<String> services;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  PharmacyModel({
    required this.id,
    required this.name,
    required this.address,
    required this.city,
    required this.country,
    required this.latitude,
    required this.longitude,
    required this.phone,
    this.email,
    this.isVerified = false,
    this.isOpenNow = false,
    this.openHours,
    this.closeHours,
    this.imageUrl,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.services = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory PharmacyModel.fromJson(Map<String, dynamic> json) {
    return PharmacyModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      city: json['city'] ?? '',
      country: json['country'] ?? '',
      latitude: (json['latitude'] ?? 0.0).toDouble(),
      longitude: (json['longitude'] ?? 0.0).toDouble(),
      phone: json['phone'] ?? '',
      email: json['email'],
      isVerified: json['is_verified'] ?? false,
      isOpenNow: json['is_open_now'] ?? false,
      openHours: json['open_hours'],
      closeHours: json['close_hours'],
      imageUrl: json['image_url'],
      rating: (json['rating'] ?? 0.0).toDouble(),
      reviewCount: json['review_count'] ?? 0,
      services: List<String>.from(json['services'] ?? []),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'city': city,
      'country': country,
      'latitude': latitude,
      'longitude': longitude,
      'phone': phone,
      'email': email,
      'is_verified': isVerified,
      'is_open_now': isOpenNow,
      'open_hours': openHours,
      'close_hours': closeHours,
      'image_url': imageUrl,
      'rating': rating,
      'review_count': reviewCount,
      'services': services,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
