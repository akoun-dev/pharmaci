import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/review_provider.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/error_widget.dart';
import '../../widgets/reviews/review_card.dart';
import '../../widgets/reviews/review_summary_widget.dart';

class ReviewsListScreen extends StatefulWidget {
  final String pharmacyId;
  final String pharmacyName;

  const ReviewsListScreen({
    super.key,
    required this.pharmacyId,
    required this.pharmacyName,
  });

  @override
  State<ReviewsListScreen> createState() => _ReviewsListScreenState();
}

class _ReviewsListScreenState extends State<ReviewsListScreen> {
  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  Future<void> _loadReviews() async {
    await Provider.of<ReviewProvider>(context, listen: false)
        .loadPharmacyReviews(widget.pharmacyId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Avis - ${widget.pharmacyName}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.rate_review),
            onPressed: () => _navigateToReviewForm(),
          ),
        ],
      ),
      body: Consumer<ReviewProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const LoadingWidget();
          }

          if (provider.errorMessage != null) {
            return CustomErrorWidget(
              message: provider.errorMessage!,
              onRetry: _loadReviews,
            );
          }

          return Column(
            children: [
              ReviewSummaryWidget(
                averageRating: provider.averagePharmacyRating,
                totalReviews: provider.pharmacyReviews.length,
                ratingDistribution: provider.ratingDistribution,
              ),
              const Divider(height: 1),
              Expanded(
                child: provider.pharmacyReviews.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.rate_review_outlined, size: 64),
                            SizedBox(height: 16),
                            Text('Aucun avis pour cette pharmacie'),
                            SizedBox(height: 8),
                            Text('Soyez le premier à donner votre avis !'),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: provider.pharmacyReviews.length,
                        itemBuilder: (context, index) {
                          final review = provider.pharmacyReviews[index];
                          return ReviewCard(
                            review: review,
                            onHelpful: () => _markAsHelpful(review.id),
                            onReport: () => _reportReview(review.id),
                            onEdit: () => _navigateToReviewForm(review),
                            onDelete: () => _deleteReview(review.id),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _navigateToReviewForm(),
        child: const Icon(Icons.rate_review),
      ),
    );
  }

  void _navigateToReviewForm([ReviewEntity? review]) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ReviewFormScreen(
          pharmacyId: widget.pharmacyId,
          pharmacyName: widget.pharmacyName,
          existingReview: review,
        ),
      ),
    ).then((_) => _loadReviews());
  }

  Future<void> _markAsHelpful(String reviewId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.user != null) {
      await Provider.of<ReviewProvider>(context, listen: false)
          .markHelpful(reviewId, authProvider.user!.id);
    }
  }

  void _reportReview(String reviewId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Signaler cet avis'),
        content: const Text('Pourquoi signalez-vous cet avis ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await Provider.of<ReviewProvider>(context, listen: false)
                  .reportReview(reviewId, 'Contenu inapproprié');
            },
            child: const Text('Signaler'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteReview(String reviewId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer l\'avis'),
        content: const Text('Êtes-vous sûr de vouloir supprimer cet avis ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await Provider.of<ReviewProvider>(context, listen: false)
          .deleteReview(reviewId);
    }
  }
}