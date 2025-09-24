import 'package:latlong2/latlong.dart';

class PharmacyEntity {
  final String id;
  final String name;
  final String address;
  final double latitude;
  final double longitude;
  final String phone;
  final String? email;
  final bool isOpen;
  final bool hasDrug;
  final double distance;
  final String? openingHours;
  final int? rating;
  final String? website;

  PharmacyEntity({
    required this.id,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.phone,
    this.email,
    this.isOpen = true,
    this.hasDrug = false,
    this.distance = 0.0,
    this.openingHours,
    this.rating,
    this.website,
  });

  LatLng get location => LatLng(latitude, longitude);

  factory PharmacyEntity.fromJson(Map<String, dynamic> json) {
    return PharmacyEntity(
      id: json['id'],
      name: json['name'],
      address: json['address'],
      latitude: json['latitude'],
      longitude: json['longitude'],
      phone: json['phone'],
      email: json['email'],
      isOpen: json['is_open'] ?? true,
      hasDrug: json['has_drug'] ?? false,
      distance: json['distance'] ?? 0.0,
      openingHours: json['opening_hours'],
      rating: json['rating'],
      website: json['website'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'phone': phone,
      'email': email,
      'is_open': isOpen,
      'has_drug': hasDrug,
      'distance': distance,
      'opening_hours': openingHours,
      'rating': rating,
      'website': website,
    };
  }
}