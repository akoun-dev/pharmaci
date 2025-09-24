import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/review_provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../domain/entities/review_entity.dart';

class ReviewFormScreen extends StatefulWidget {
  final String pharmacyId;
  final String pharmacyName;
  final ReviewEntity? existingReview;

  const ReviewFormScreen({
    super.key,
    required this.pharmacyId,
    required this.pharmacyName,
    this.existingReview,
  });

  @override
  State<ReviewFormScreen> createState() => _ReviewFormScreenState();
}

class _ReviewFormScreenState extends State<ReviewFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _commentController = TextEditingController();
  final _proController = TextEditingController();
  final _conController = TextEditingController();

  double _rating = 0.0;
  List<String> _pros = [];
  List<String> _cons = [];
  bool _isAnonymous = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.existingReview != null) {
      _rating = widget.existingReview!.rating;
      _commentController.text = widget.existingReview!.comment;
      _pros = List.from(widget.existingReview!.pros);
      _cons = List.from(widget.existingReview!.cons);
      _isAnonymous = widget.existingReview!.isAnonymous;
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    _proController.dispose();
    _conController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.existingReview != null ? 'Modifier mon avis' : 'Donner mon avis'),
      ),
      body: Consumer2<ReviewProvider, AuthProvider>(
        builder: (context, reviewProvider, authProvider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildPharmacyInfo(),
                  const SizedBox(height: 24),
                  _buildRatingSection(),
                  const SizedBox(height: 24),
                  _buildCommentSection(),
                  const SizedBox(height: 24),
                  _buildProsConsSection(),
                  const SizedBox(height: 24),
                  _buildOptionsSection(),
                  const SizedBox(height: 32),
                  _buildSubmitButton(reviewProvider, authProvider),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPharmacyInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.store, size: 32),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.pharmacyName,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Partagez votre expérience',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Note globale',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: Slider(
                value: _rating,
                min: 0,
                max: 5,
                divisions: 5,
                label: _rating.toString(),
                onChanged: (value) {
                  setState(() {
                    _rating = value;
                  });
                },
              ),
            ),
            const SizedBox(width: 16),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _rating.toStringAsFixed(1),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Theme.of(context).primaryColor,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Très mauvais'),
            const Text('Excellent'),
            Row(
              children: List.generate(5, (index) {
                return Icon(
                  index < _rating.floor() ? Icons.star : Icons.star_border,
                  color: Colors.amber,
                  size: 16,
                );
              }),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCommentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Votre avis',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _commentController,
          decoration: const InputDecoration(
            hintText: 'Décrivez votre expérience...',
            border: OutlineInputBorder(),
          ),
          maxLines: 4,
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return 'Veuillez écrire un commentaire';
            }
            if (value.trim().length < 10) {
              return 'Le commentaire doit contenir au moins 10 caractères';
            }
            return null;
          },
        ),
        const SizedBox(height: 8),
        Text(
          '${_commentController.text.length}/500 caractères',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildProsConsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Points forts et points faibles',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildPointSection(
                title: 'Points forts',
                controller: _proController,
                points: _pros,
                onAdd: (point) => _addPoint(point, true),
                onRemove: (index) => _removePoint(index, true),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildPointSection(
                title: 'Points faibles',
                controller: _conController,
                points: _cons,
                onAdd: (point) => _addPoint(point, false),
                onRemove: (index) => _removePoint(index, false),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPointSection({
    required String title,
    required TextEditingController controller,
    required List<String> points,
    required Function(String) onAdd,
    required Function(int) onRemove,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: controller,
                decoration: InputDecoration(
                  hintText: 'Ajouter un point...',
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.add),
                    onPressed: () {
                      if (controller.text.trim().isNotEmpty) {
                        onAdd(controller.text.trim());
                        controller.clear();
                      }
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: points.asMap().entries.map((entry) {
            final index = entry.key;
            final point = entry.value;
            return InputChip(
              label: Text(point),
              deleteIcon: const Icon(Icons.close, size: 16),
              onDeleted: () => onRemove(index),
              backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildOptionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Options',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        CheckboxListTile(
          title: const Text('Publier anonymement'),
          subtitle: const Text('Votre nom ne sera pas visible'),
          value: _isAnonymous,
          onChanged: (value) {
            setState(() {
              _isAnonymous = value ?? false;
            });
          },
        ),
      ],
    );
  }

  Widget _buildSubmitButton(ReviewProvider reviewProvider, AuthProvider authProvider) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: _isLoading ? null : () => _handleSubmit(reviewProvider, authProvider),
        child: _isLoading
            ? const CircularProgressIndicator()
            : Text(widget.existingReview != null ? 'Mettre à jour' : 'Publier mon avis'),
      ),
    );
  }

  void _addPoint(String point, bool isPro) {
    setState(() {
      if (isPro) {
        _pros.add(point);
      } else {
        _cons.add(point);
      }
    });
  }

  void _removePoint(int index, bool isPro) {
    setState(() {
      if (isPro) {
        _pros.removeAt(index);
      } else {
        _cons.removeAt(index);
      }
    });
  }

  Future<void> _handleSubmit(ReviewProvider reviewProvider, AuthProvider authProvider) async {
    if (!_formKey.currentState!.validate()) return;

    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner une note')),
      );
      return;
    }

    if (authProvider.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vous devez être connecté pour publier un avis')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      if (widget.existingReview != null) {
        await reviewProvider.updateReview(
          reviewId: widget.existingReview!.id,
          rating: _rating,
          comment: _commentController.text,
          pros: _pros,
          cons: _cons,
        );
      } else {
        await reviewProvider.addReview(
          userId: authProvider.user!.id,
          pharmacyId: widget.pharmacyId,
          rating: _rating,
          comment: _commentController.text,
          pros: _pros,
          cons: _cons,
          isAnonymous: _isAnonymous,
        );
      }

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.existingReview != null
                ? 'Avis mis à jour avec succès'
                : 'Avis publié avec succès'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: ${e.toString()}')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
}