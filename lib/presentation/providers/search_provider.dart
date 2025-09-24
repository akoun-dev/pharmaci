// Search functionality state management
import 'package:flutter/foundation.dart';
import 'package:pharmaci/data/models/search/search_result.dart';
import 'package:pharmaci/data/models/search/search_filters.dart';
import 'package:pharmaci/data/models/drug/drug_model.dart';
import 'package:pharmaci/data/models/pharmacy/pharmacy_model.dart';
import 'package:pharmaci/data/models/pharmacy/pharmacy_stock.dart';

class SearchProvider with ChangeNotifier {
  SearchResultModel? _searchResult;
  List<String> _suggestions = [];
  SearchFiltersModel _filters = SearchFiltersModel();
  bool _isLoading = false;
  String? _error;

  SearchResultModel? get searchResult => _searchResult;
  List<String> get suggestions => _suggestions;
  SearchFiltersModel get filters => _filters;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> searchDrugs({
    required String query,
    double? latitude,
    double? longitude,
    double? radius,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await Future.delayed(const Duration(seconds: 1));

      final mockResult = SearchResultModel(
        drug: _createMockDrug(query),
        pharmacies: _createMockPharmacies(),
        totalCount: 12,
        searchQuery: query,
        searchTimestamp: DateTime.now(),
      );

      _searchResult = mockResult;
      _suggestions = [];
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> getSuggestions(String query) async {
    if (query.length < 2) {
      _suggestions = [];
      notifyListeners();
      return;
    }

    try {
      await Future.delayed(const Duration(milliseconds: 300));

      final mockSuggestions = [
        '$query 500mg',
        '$query 1000mg',
        '$query sirop',
        '${query}ol',
        '${query}ine',
      ];

      _suggestions = mockSuggestions.where((s) =>
        s.toLowerCase().contains(query.toLowerCase())
      ).toList();
    } catch (e) {
      _error = e.toString();
    }
    notifyListeners();
  }

  void updateFilters(SearchFiltersModel filters) {
    _filters = filters;
    notifyListeners();
  }

  void clearSearch() {
    _searchResult = null;
    _suggestions = [];
    _error = null;
    notifyListeners();
  }
}

DrugModel _createMockDrug(String query) {
  return DrugModel(
    id: 'mock-drug-1',
    name: query.isNotEmpty ? query : 'Paracétamol',
    molecule: 'Paracétamol',
    description: 'Médicament contre la douleur et la fièvre',
    dosage: '500mg',
    form: 'Comprimé',
    laboratory: 'Laboratoire Mock',
    requiresPrescription: false,
    categories: ['Antalgique', 'Antipyrétique'],
  );
}

List<PharmacySearchResult> _createMockPharmacies() {
  return [
    PharmacySearchResult(
      pharmacy: PharmacyModel(
        id: 'pharmacy-1',
        name: 'Pharmacie Centrale',
        address: '123 Rue Principale',
        city: 'Abidjan',
        country: 'Côte d\'Ivoire',
        latitude: 5.345317,
        longitude: -4.024429,
        phone: '+225 01 23 45 67 89',
        email: 'contact@pharmacie.ci',
        isVerified: true,
        isOpenNow: true,
        rating: 4.5,
        reviewCount: 100,
        services: ['Livraison', 'Réservation'],
      ),
      stock: PharmacyStockModel(
        id: 'stock-1',
        pharmacyId: 'pharmacy-1',
        drugId: 'mock-drug-1',
        quantity: 50,
        price: 2500.0,
        lastUpdated: DateTime.now(),
        isActive: true,
      ),
      distance: 1.2,
      isInStock: true,
      price: 2500.0,
    ),
  ];
}
