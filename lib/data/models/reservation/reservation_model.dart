// Reservation model for drug orders
import 'reservation_status.dart';

class ReservationModel {
  final String id;
  final String userId;
  final String pharmacyId;
  final String drugId;
  final int quantity;
  final double totalPrice;
  final ReservationStatus status;
  final String? prescriptionId;
  final String? notes;
  final DateTime? pickupDate;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? confirmedAt;
  final DateTime? cancelledAt;
  final DateTime? completedAt;

  ReservationModel({
    required this.id,
    required this.userId,
    required this.pharmacyId,
    required this.drugId,
    required this.quantity,
    required this.totalPrice,
    required this.status,
    this.prescriptionId,
    this.notes,
    this.pickupDate,
    required this.createdAt,
    this.updatedAt,
    this.confirmedAt,
    this.cancelledAt,
    this.completedAt,
  });

  factory ReservationModel.fromJson(Map<String, dynamic> json) {
    return ReservationModel(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      pharmacyId: json['pharmacy_id'] ?? '',
      drugId: json['drug_id'] ?? '',
      quantity: json['quantity'] ?? 0,
      totalPrice: (json['total_price'] ?? 0.0).toDouble(),
      status: ReservationStatusExtension.fromString(json['status'] ?? 'pending'),
      prescriptionId: json['prescription_id'],
      notes: json['notes'],
      pickupDate: json['pickup_date'] != null
          ? DateTime.parse(json['pickup_date'])
          : null,
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      confirmedAt: json['confirmed_at'] != null
          ? DateTime.parse(json['confirmed_at'])
          : null,
      cancelledAt: json['cancelled_at'] != null
          ? DateTime.parse(json['cancelled_at'])
          : null,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'pharmacy_id': pharmacyId,
      'drug_id': drugId,
      'quantity': quantity,
      'total_price': totalPrice,
      'status': status.toString(),
      'prescription_id': prescriptionId,
      'notes': notes,
      'pickup_date': pickupDate?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'confirmed_at': confirmedAt?.toIso8601String(),
      'cancelled_at': cancelledAt?.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
    };
  }

  bool get isPending => status == ReservationStatus.pending;
  bool get isConfirmed => status == ReservationStatus.confirmed;
  bool get isCancelled => status == ReservationStatus.cancelled;
  bool get isCompleted => status == ReservationStatus.completed;
  bool get isReadyForPickup => status == ReservationStatus.readyForPickup;
}
