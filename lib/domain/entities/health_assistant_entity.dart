import 'package:equatable/equatable.dart';
import '../../core/entities/base_entity.dart';

class HealthAssistantEntity extends BaseEntityImpl with UserOwned, Equatable {
  final String userId;
  final String query;
  final String response;
  final HealthAssistantType type;
  final bool isSaved;
  final double? confidence;

  const HealthAssistantEntity({
    required this.id,
    required this.userId,
    required this.query,
    required this.response,
    required this.createdAt,
    required this.type,
    this.isSaved = false,
    this.confidence,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        query,
        response,
        createdAt,
        type,
        isSaved,
        confidence,
      ];

  @override
  HealthAssistantEntity copyWith({
    String? id,
    String? userId,
    String? query,
    String? response,
    DateTime? createdAt,
    DateTime? updatedAt,
    HealthAssistantType? type,
    bool? isSaved,
    double? confidence,
  }) {
    return HealthAssistantEntity(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      query: query ?? this.query,
      response: response ?? this.response,
      createdAt: createdAt ?? this.createdAt,
      type: type ?? this.type,
      isSaved: isSaved ?? this.isSaved,
      confidence: confidence ?? this.confidence,
    );
  }

  factory HealthAssistantEntity.fromJson(Map<String, dynamic> json) {
    return HealthAssistantEntity(
      id: json['id'],
      userId: json['user_id'],
      query: json['query'],
      response: json['response'],
      createdAt: DateTime.parse(json['created_at']),
      type: HealthAssistantType.fromString(json['type']),
      isSaved: json['is_saved'] ?? false,
      confidence: json['confidence'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'query': query,
      'response': response,
      'created_at': createdAt.toIso8601String(),
      'type': type.name,
      'is_saved': isSaved,
      'confidence': confidence,
    };
  }
}

enum HealthAssistantType {
  drugInformation,
  symptomChecker,
  dosageAdvice,
  interactionWarning,
  generalHealth,
  emergencyGuidance;

  static HealthAssistantType fromString(String type) {
    switch (type.toLowerCase()) {
      case 'drug_information':
        return HealthAssistantType.drugInformation;
      case 'symptom_checker':
        return HealthAssistantType.symptomChecker;
      case 'dosage_advice':
        return HealthAssistantType.dosageAdvice;
      case 'interaction_warning':
        return HealthAssistantType.interactionWarning;
      case 'general_health':
        return HealthAssistantType.generalHealth;
      case 'emergency_guidance':
        return HealthAssistantType.emergencyGuidance;
      default:
        return HealthAssistantType.generalHealth;
    }
  }
}