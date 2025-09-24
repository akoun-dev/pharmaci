import 'dart:convert';
import '../validators/health_assistant_validator.dart';
import '../exceptions/app_exceptions.dart';

/// Base interface for all entities
///
/// Defines the contract that all domain entities must implement,
/// ensuring consistent behavior across the application.
abstract class BaseEntity {
  String get id;
  DateTime get createdAt;
  DateTime? get updatedAt;
  Map<String, dynamic> toJson();
}

/// Base abstract class for entities with common functionality
///
/// Provides implementation of common entity behaviors including
/// JSON serialization and copy methods. Designed to be extended
/// by concrete entity classes.
abstract class BaseEntityImpl implements BaseEntity {
  @override
  final String id;
  @override
  final DateTime createdAt;
  @override
  final DateTime? updatedAt;

  BaseEntityImpl({
    required this.id,
    required this.createdAt,
    this.updatedAt,
  });

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  /// Creates a copy of the entity with updated fields
  BaseEntityImpl copyWith({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
  });
}

/// Mixin for entities with user ownership
mixin UserOwned on BaseEntityImpl {
  String get userId;

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json['user_id'] = userId;
    return json;
  }

  void validateOwnership(String currentUserId) {
    if (userId != currentUserId) {
      throw ForbiddenException('You can only access your own resources');
    }
  }
}

/// Mixin for entities that can be soft deleted
mixin SoftDeletable on BaseEntityImpl {
  bool get isDeleted;
  DateTime? get deletedAt;

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json['is_deleted'] = isDeleted;
    json['deleted_at'] = deletedAt?.toIso8601String();
    return json;
  }
}

/// Mixin for entities with status tracking
mixin StatusTracked on BaseEntityImpl {
  String get status;
  DateTime? get statusChangedAt;

  List<String> get validStatuses;

  void validateStatus(String newStatus) {
    if (!validStatuses.contains(newStatus)) {
      throw ValidationException('Invalid status: $newStatus. Must be one of: ${validStatuses.join(', ')}');
    }
  }

  void updateStatus(String newStatus) {
    validateStatus(newStatus);
    // This would be implemented by the concrete class
  }

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json['status'] = status;
    json['status_changed_at'] = statusChangedAt?.toIso8601String();
    return json;
  }
}

/// Mixin for entities with ratings
mixin Rated on BaseEntityImpl {
  double get rating;
  int get reviewCount;

  void validateRating(double newRating) {
    if (newRating < 0 || newRating > 5) {
      throw ValidationException('Rating must be between 0 and 5');
    }
  }

  void updateRating(double newRating, {int incrementReviewCount = 0}) {
    validateRating(newRating);
    // This would be implemented by the concrete class
  }

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json['rating'] = rating;
    json['review_count'] = reviewCount;
    return json;
  }
}

/// Mixin for entities with geographic data
mixin Geolocated on BaseEntityImpl {
  double get latitude;
  double get longitude;

  void validateCoordinates(double lat, double lon) {
    if (lat < -90 || lat > 90) {
      throw ValidationException('Latitude must be between -90 and 90');
    }
    if (lon < -180 || lon > 180) {
      throw ValidationException('Longitude must be between -180 and 180');
    }
  }

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json['latitude'] = latitude;
    json['longitude'] = longitude;
    return json;
  }
}

/// Mixin for entities with audit trail
mixin Audited on BaseEntityImpl {
  String get createdBy;
  String? get updatedBy;
  String? get deletedBy;

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json['created_by'] = createdBy;
    json['updated_by'] = updatedBy;
    json['deleted_by'] = deletedBy;
    return json;
  }
}

/// Base validation utility for entities
class EntityValidator {
  /// Validates required string fields
  static void validateRequiredString(String value, String fieldName) {
    if (value.trim().isEmpty) {
      throw ValidationException('$fieldName is required', fieldName);
    }
  }

  /// Validates string length
  static void validateStringLength(String value, String fieldName, int minLength, int maxLength) {
    if (value.length < minLength) {
      throw ValidationException('$fieldName must be at least $minLength characters', fieldName);
    }
    if (value.length > maxLength) {
      throw ValidationException('$fieldName must be at most $maxLength characters', fieldName);
    }
  }

  /// Validates numeric ranges
  static void validateNumericRange(num value, String fieldName, num min, num max) {
    if (value < min || value > max) {
      throw ValidationException('$fieldName must be between $min and $max', fieldName);
    }
  }

  /// Validates email format
  static void validateEmail(String email) {
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(email)) {
      throw ValidationException('Invalid email format', 'email');
    }
  }

  /// Validates phone number format (Ivorian format)
  static void validatePhoneNumber(String phoneNumber) {
    final phoneRegex = RegExp(r'^(\+225|0)?[01]\d{8}$');
    if (!phoneRegex.hasMatch(phoneNumber)) {
      throw ValidationException('Invalid Ivorian phone number format', 'phone_number');
    }
  }

  /// Validates URLs
  static void validateUrl(String url) {
    try {
      Uri.parse(url);
    } catch (e) {
      throw ValidationException('Invalid URL format', 'url');
    }
  }

  /// Validates JSON data
  static void validateJson(String jsonString, String fieldName) {
    try {
      jsonDecode(jsonString);
    } catch (e) {
      throw ValidationException('Invalid JSON format for $fieldName', fieldName);
    }
  }

  /// Validates enum values
  static void validateEnum<T>(T value, List<T> validValues, String fieldName) {
    if (!validValues.contains(value)) {
      throw ValidationException(
        'Invalid $fieldName. Must be one of: ${validValues.join(', ')}',
        fieldName,
      );
    }
  }

  /// Validates date ranges
  static void validateDateRange(DateTime start, DateTime end, String fieldName) {
    if (start.isAfter(end)) {
      throw ValidationException('Start date must be before end date for $fieldName', fieldName);
    }
  }

  /// Validates future dates
  static void validateFutureDate(DateTime date, String fieldName) {
    if (date.isBefore(DateTime.now())) {
      throw ValidationException('$fieldName must be in the future', fieldName);
    }
  }

  /// Validates past dates
  static void validatePastDate(DateTime date, String fieldName) {
    if (date.isAfter(DateTime.now())) {
      throw ValidationException('$fieldName must be in the past', fieldName);
    }
  }
}