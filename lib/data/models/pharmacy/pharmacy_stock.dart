// Pharmacy stock management model
class PharmacyStockModel {
  final String id;
  final String pharmacyId;
  final String drugId;
  final int quantity;
  final double price;
  final String? batchNumber;
  final DateTime? expiryDate;
  final String? supplier;
  final DateTime lastUpdated;
  final bool isActive;

  PharmacyStockModel({
    required this.id,
    required this.pharmacyId,
    required this.drugId,
    required this.quantity,
    required this.price,
    this.batchNumber,
    this.expiryDate,
    this.supplier,
    required this.lastUpdated,
    this.isActive = true,
  });

  factory PharmacyStockModel.fromJson(Map<String, dynamic> json) {
    return PharmacyStockModel(
      id: json['id'] ?? '',
      pharmacyId: json['pharmacy_id'] ?? '',
      drugId: json['drug_id'] ?? '',
      quantity: json['quantity'] ?? 0,
      price: (json['price'] ?? 0.0).toDouble(),
      batchNumber: json['batch_number'],
      expiryDate: json['expiry_date'] != null
          ? DateTime.parse(json['expiry_date'])
          : null,
      supplier: json['supplier'],
      lastUpdated: DateTime.parse(json['last_updated']),
      isActive: json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'pharmacy_id': pharmacyId,
      'drug_id': drugId,
      'quantity': quantity,
      'price': price,
      'batch_number': batchNumber,
      'expiry_date': expiryDate?.toIso8601String(),
      'supplier': supplier,
      'last_updated': lastUpdated.toIso8601String(),
      'is_active': isActive,
    };
  }

  bool get isLowStock => quantity <= 5;
  bool get isExpiringSoon => expiryDate != null &&
      expiryDate!.difference(DateTime.now()).inDays <= 30;
  bool get isExpired => expiryDate != null &&
      expiryDate!.isBefore(DateTime.now());
}
