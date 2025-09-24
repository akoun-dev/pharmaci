import 'package:equatable/equatable.dart';

class ReviewEntity extends Equatable {
  final String id;
  final String userId;
  final String pharmacyId;
  final double rating;
  final String comment;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final List<String> pros;
  final List<String> cons;
  final bool isVerified;
  final bool isAnonymous;
  final int helpfulCount;
  final int? drugId;
  final ReviewType type;

  const ReviewEntity({
    required this.id,
    required this.userId,
    required this.pharmacyId,
    required this.rating,
    required this.comment,
    required this.createdAt,
    this.updatedAt,
    this.pros = const [],
    this.cons = const [],
    this.isVerified = false,
    this.isAnonymous = false,
    this.helpfulCount = 0,
    this.drugId,
    required this.type,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        pharmacyId,
        rating,
        comment,
        createdAt,
        updatedAt,
        pros,
        cons,
        isVerified,
        isAnonymous,
        helpfulCount,
        drugId,
        type,
      ];

  ReviewEntity copyWith({
    String? id,
    String? userId,
    String? pharmacyId,
    double? rating,
    String? comment,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<String>? pros,
    List<String>? cons,
    bool? isVerified,
    bool? isAnonymous,
    int? helpfulCount,
    int? drugId,
    ReviewType? type,
  }) {
    return ReviewEntity(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      pharmacyId: pharmacyId ?? this.pharmacyId,
      rating: rating ?? this.rating,
      comment: comment ?? this.comment,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      pros: pros ?? this.pros,
      cons: cons ?? this.cons,
      isVerified: isVerified ?? this.isVerified,
      isAnonymous: isAnonymous ?? this.isAnonymous,
      helpfulCount: helpfulCount ?? this.helpfulCount,
      drugId: drugId ?? this.drugId,
      type: type ?? this.type,
    );
  }

  factory ReviewEntity.fromJson(Map<String, dynamic> json) {
    return ReviewEntity(
      id: json['id'],
      userId: json['user_id'],
      pharmacyId: json['pharmacy_id'],
      rating: (json['rating'] as num).toDouble(),
      comment: json['comment'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
      pros: List<String>.from(json['pros'] ?? []),
      cons: List<String>.from(json['cons'] ?? []),
      isVerified: json['is_verified'] ?? false,
      isAnonymous: json['is_anonymous'] ?? false,
      helpfulCount: json['helpful_count'] ?? 0,
      drugId: json['drug_id'],
      type: ReviewType.fromString(json['type']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'pharmacy_id': pharmacyId,
      'rating': rating,
      'comment': comment,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'pros': pros,
      'cons': cons,
      'is_verified': isVerified,
      'is_anonymous': isAnonymous,
      'helpful_count': helpfulCount,
      'drug_id': drugId,
      'type': type.name,
    };
  }
}

enum ReviewType {
  pharmacy,
  drug,
  service,
  delivery;

  static ReviewType fromString(String type) {
    switch (type.toLowerCase()) {
      case 'pharmacy':
        return ReviewType.pharmacy;
      case 'drug':
        return ReviewType.drug;
      case 'service':
        return ReviewType.service;
      case 'delivery':
        return ReviewType.delivery;
      default:
        return ReviewType.pharmacy;
    }
  }
}