import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../domain/entities/review_entity.dart';

class ReviewProvider with ChangeNotifier {
  final SupabaseClient _supabase = Supabase.instance.client;

  List<ReviewEntity> _pharmacyReviews = [];
  List<ReviewEntity> _drugReviews = [];
  Map<String, bool> _helpfulVotes = {};
  bool _isLoading = false;
  String? _errorMessage;
  double _averagePharmacyRating = 0.0;
  Map<int, int> _ratingDistribution = {};

  List<ReviewEntity> get pharmacyReviews => _pharmacyReviews;
  List<ReviewEntity> get drugReviews => _drugReviews;
  Map<String, bool> get helpfulVotes => _helpfulVotes;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  double get averagePharmacyRating => _averagePharmacyRating;
  Map<int, int> get ratingDistribution => _ratingDistribution;

  Future<void> loadPharmacyReviews(String pharmacyId) async {
    try {
      _isLoading = true;
      notifyListeners();

      final response = await _supabase
          .from('reviews')
          .select()
          .eq('pharmacy_id', pharmacyId)
          .eq('type', 'pharmacy')
          .order('created_at', ascending: false);

      _pharmacyReviews = response
          .map((json) => ReviewEntity.fromJson(json))
          .toList();

      await _calculateRatingStats(pharmacyId);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Erreur lors du chargement des avis: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> loadDrugReviews(String drugId) async {
    try {
      _isLoading = true;
      notifyListeners();

      final response = await _supabase
          .from('reviews')
          .select()
          .eq('drug_id', drugId)
          .eq('type', 'drug')
          .order('created_at', ascending: false);

      _drugReviews = response
          .map((json) => ReviewEntity.fromJson(json))
          .toList();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Erreur lors du chargement des avis: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> addReview({
    required String userId,
    required String pharmacyId,
    required double rating,
    required String comment,
    List<String> pros = const [],
    List<String> cons = const [],
    bool isAnonymous = false,
    int? drugId,
    ReviewType type = ReviewType.pharmacy,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      final review = ReviewEntity(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: userId,
        pharmacyId: pharmacyId,
        rating: rating,
        comment: comment,
        createdAt: DateTime.now(),
        pros: pros,
        cons: cons,
        isAnonymous: isAnonymous,
        drugId: drugId,
        type: type,
      );

      await _supabase.from('reviews').insert(review.toJson());

      if (type == ReviewType.pharmacy) {
        _pharmacyReviews.insert(0, review);
        await _calculateRatingStats(pharmacyId);
      } else {
        _drugReviews.insert(0, review);
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Erreur lors de l\'ajout de l\'avis: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> updateReview({
    required String reviewId,
    required double rating,
    required String comment,
    List<String> pros = const [],
    List<String> cons = const [],
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      final reviewIndex = _pharmacyReviews.indexWhere((r) => r.id == reviewId);
      if (reviewIndex == -1) return;

      final updatedReview = _pharmacyReviews[reviewIndex].copyWith(
        rating: rating,
        comment: comment,
        pros: pros,
        cons: cons,
        updatedAt: DateTime.now(),
      );

      await _supabase
          .from('reviews')
          .update(updatedReview.toJson())
          .eq('id', reviewId);

      _pharmacyReviews[reviewIndex] = updatedReview;
      await _calculateRatingStats(_pharmacyReviews[reviewIndex].pharmacyId);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Erreur lors de la mise à jour: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> deleteReview(String reviewId) async {
    try {
      _isLoading = true;
      notifyListeners();

      final review = _pharmacyReviews.firstWhere(
        (r) => r.id == reviewId,
        orElse: () => _drugReviews.firstWhere((r) => r.id == reviewId),
      );

      await _supabase.from('reviews').delete().eq('id', reviewId);

      _pharmacyReviews.removeWhere((r) => r.id == reviewId);
      _drugReviews.removeWhere((r) => r.id == reviewId);

      if (review.type == ReviewType.pharmacy) {
        await _calculateRatingStats(review.pharmacyId);
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Erreur lors de la suppression: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> markHelpful(String reviewId, String userId) async {
    try {
      final voteKey = '$reviewId-$userId';
      final currentVote = _helpfulVotes[voteKey] ?? false;

      final reviewIndex = _pharmacyReviews.indexWhere((r) => r.id == reviewId);
      if (reviewIndex == -1) return;

      final review = _pharmacyReviews[reviewIndex];
      final newHelpfulCount = currentVote
          ? review.helpfulCount - 1
          : review.helpfulCount + 1;

      await _supabase
          .from('reviews')
          .update({'helpful_count': newHelpfulCount})
          .eq('id', reviewId);

      _pharmacyReviews[reviewIndex] = review.copyWith(helpfulCount: newHelpfulCount);
      _helpfulVotes[voteKey] = !currentVote;

      notifyListeners();
    } catch (e) {
      _errorMessage = 'Erreur: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> reportReview(String reviewId, String reason) async {
    try {
      await _supabase.from('review_reports').insert({
        'review_id': reviewId,
        'reason': reason,
        'created_at': DateTime.now().toIso8601String(),
      });

      _errorMessage = 'Avis signalé avec succès';
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Erreur lors du signalement: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> _calculateRatingStats(String pharmacyId) async {
    try {
      final response = await _supabase
          .from('reviews')
          .select('rating')
          .eq('pharmacy_id', pharmacyId)
          .eq('type', 'pharmacy');

      if (response.isEmpty) {
        _averagePharmacyRating = 0.0;
        _ratingDistribution = {};
        return;
      }

      final ratings = response.map((r) => (r['rating'] as num).toDouble()).toList();
      _averagePharmacyRating = ratings.reduce((a, b) => a + b) / ratings.length;

      _ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      for (final rating in ratings) {
        final roundedRating = rating.round();
        if (roundedRating >= 1 && roundedRating <= 5) {
          _ratingDistribution[roundedRating] = (_ratingDistribution[roundedRating] ?? 0) + 1;
        }
      }
    } catch (e) {
      print('Erreur lors du calcul des statistiques: ${e.toString()}');
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}