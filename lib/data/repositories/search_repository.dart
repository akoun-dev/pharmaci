// Search functionality repository
import 'package:pharmaci/data/models/search/search_result.dart';
import 'package:pharmaci/data/models/search/search_filters.dart';

abstract class SearchRepository {
  Future<SearchResultModel> searchDrugs({
    required String query,
    double? latitude,
    double? longitude,
    double? radius,
    SearchFiltersModel? filters,
  });

  Future<List<String>> getDrugSuggestions(String query);
  Future<List<String>> getMoleculeSuggestions(String query);
}
