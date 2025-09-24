// Search results model
import 'package:flutter/material.dart';
import 'package:pharmaci/data/models/pharmacy/pharmacy_model.dart';
import 'package:pharmaci/data/models/drug/drug_model.dart';
import 'package:pharmaci/data/models/pharmacy/pharmacy_stock.dart';

class SearchResultModel {
  final DrugModel drug;
  final List<PharmacySearchResult> pharmacies;
  final int totalCount;
  final String searchQuery;
  final DateTime searchTimestamp;

  SearchResultModel({
    required this.drug,
    required this.pharmacies,
    required this.totalCount,
    required this.searchQuery,
    required this.searchTimestamp,
  });

  factory SearchResultModel.fromJson(Map<String, dynamic> json) {
    return SearchResultModel(
      drug: DrugModel.fromJson(json['drug']),
      pharmacies: (json['pharmacies'] as List)
          .map((p) => PharmacySearchResult.fromJson(p))
          .toList(),
      totalCount: json['total_count'] ?? 0,
      searchQuery: json['search_query'] ?? '',
      searchTimestamp: DateTime.parse(json['search_timestamp']),
    );
  }
}

class PharmacySearchResult {
  final PharmacyModel pharmacy;
  final PharmacyStockModel stock;
  final double distance;
  final bool isInStock;
  final double? price;
  final DateTime? lastUpdated;

  PharmacySearchResult({
    required this.pharmacy,
    required this.stock,
    required this.distance,
    required this.isInStock,
    this.price,
    this.lastUpdated,
  });

  factory PharmacySearchResult.fromJson(Map<String, dynamic> json) {
    return PharmacySearchResult(
      pharmacy: PharmacyModel.fromJson(json['pharmacy']),
      stock: PharmacyStockModel.fromJson(json['stock']),
      distance: (json['distance'] ?? 0.0).toDouble(),
      isInStock: json['is_in_stock'] ?? false,
      price: json['price']?.toDouble(),
      lastUpdated: json['last_updated'] != null
          ? DateTime.parse(json['last_updated'])
          : null,
    );
  }

  String getStockStatus() {
    if (!isInStock) return 'En rupture';
    if (stock.quantity <= 5) return 'Stock limité';
    return 'Disponible';
  }

  Color getStockStatusColor() {
    if (!isInStock) return Colors.red;
    if (stock.quantity <= 5) return Colors.orange;
    return Colors.green;
  }
}
