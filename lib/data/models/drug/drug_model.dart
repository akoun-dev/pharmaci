// Drug model representing medication information
class DrugModel {
  final String id;
  final String name;
  final String molecule;
  final String description;
  final String dosage;
  final String form;
  final String laboratory;
  final String? imageUrl;
  final bool requiresPrescription;
  final List<String> categories;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  DrugModel({
    required this.id,
    required this.name,
    required this.molecule,
    required this.description,
    required this.dosage,
    required this.form,
    required this.laboratory,
    this.imageUrl,
    this.requiresPrescription = false,
    this.categories = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory DrugModel.fromJson(Map<String, dynamic> json) {
    return DrugModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      molecule: json['molecule'] ?? '',
      description: json['description'] ?? '',
      dosage: json['dosage'] ?? '',
      form: json['form'] ?? '',
      laboratory: json['laboratory'] ?? '',
      imageUrl: json['image_url'],
      requiresPrescription: json['requires_prescription'] ?? false,
      categories: List<String>.from(json['categories'] ?? []),
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
      'molecule': molecule,
      'description': description,
      'dosage': dosage,
      'form': form,
      'laboratory': laboratory,
      'image_url': imageUrl,
      'requires_prescription': requiresPrescription,
      'categories': categories,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
