// Search filters configuration
class SearchFiltersModel {
  final List<String>? availability;
  final double? maxDistance;
  final double? minPrice;
  final double? maxPrice;
  final bool? openNow;
  final bool? twentyFourHours;
  final bool? emergencyOnly;
  final double? minRating;
  final bool? verifiedOnly;

  SearchFiltersModel({
    this.availability,
    this.maxDistance,
    this.minPrice,
    this.maxPrice,
    this.openNow,
    this.twentyFourHours,
    this.emergencyOnly,
    this.minRating,
    this.verifiedOnly,
  });

  Map<String, dynamic> toQueryParameters() {
    final params = <String, dynamic>{};

    if (availability != null && availability!.isNotEmpty) {
      params['availability'] = availability;
    }
    if (maxDistance != null) {
      params['max_distance'] = maxDistance;
    }
    if (minPrice != null) {
      params['min_price'] = minPrice;
    }
    if (maxPrice != null) {
      params['max_price'] = maxPrice;
    }
    if (openNow != null) {
      params['open_now'] = openNow;
    }
    if (twentyFourHours != null) {
      params['24h'] = twentyFourHours;
    }
    if (emergencyOnly != null) {
      params['emergency'] = emergencyOnly;
    }
    if (minRating != null) {
      params['min_rating'] = minRating;
    }
    if (verifiedOnly != null) {
      params['verified'] = verifiedOnly;
    }

    return params;
  }

  SearchFiltersModel copyWith({
    List<String>? availability,
    double? maxDistance,
    double? minPrice,
    double? maxPrice,
    bool? openNow,
    bool? twentyFourHours,
    bool? emergencyOnly,
    double? minRating,
    bool? verifiedOnly,
  }) {
    return SearchFiltersModel(
      availability: availability ?? this.availability,
      maxDistance: maxDistance ?? this.maxDistance,
      minPrice: minPrice ?? this.minPrice,
      maxPrice: maxPrice ?? this.maxPrice,
      openNow: openNow ?? this.openNow,
      twentyFourHours: twentyFourHours ?? this.twentyFourHours,
      emergencyOnly: emergencyOnly ?? this.emergencyOnly,
      minRating: minRating ?? this.minRating,
      verifiedOnly: verifiedOnly ?? this.verifiedOnly,
    );
  }
}
