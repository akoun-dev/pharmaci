import 'package:flutter/material.dart';
import 'package:pharmaci/core/design_system/tokens/app_colors.dart';
import 'package:pharmaci/core/design_system/tokens/app_spacing.dart';
import 'package:pharmaci/core/design_system/tokens/app_text_styles.dart';
import 'package:pharmaci/core/performance/cache_manager.dart';
import 'package:pharmaci/core/performance/lazy_loader.dart';
import 'package:pharmaci/presentation/providers/location_provider.dart';
import 'package:provider/provider.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';

/// Performance-optimized pharmacy search screen
class OptimizedPharmacySearchScreen extends StatefulWidget {
  const OptimizedPharmacySearchScreen({super.key});

  @override
  State<OptimizedPharmacySearchScreen> createState() => _OptimizedPharmacySearchScreenState();
}

class _OptimizedPharmacySearchScreenState extends State<OptimizedPharmacySearchScreen> {
  final CacheManager _cacheManager = CacheManager();
  final LazyLoader _lazyLoader = LazyLoader();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();

  bool _isLoading = false;
  bool _hasError = false;
  String _searchQuery = '';
  List<Map<String, dynamic>> _pharmacies = [];
  List<Map<String, dynamic>> _filteredPharmacies = [];
  int _currentPage = 1;
  final int _pageSize = 10;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _initializeScreen();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _initializeScreen() async {
    await _loadCachedData();
    await _loadPharmacies();
  }

  Future<void> _loadCachedData() async {
    try {
      final cachedPharmacies = await _cacheManager.get<List<Map<String, dynamic>>>('pharmacies_search');
      if (cachedPharmacies != null) {
        setState(() {
          _pharmacies = cachedPharmacies;
          _filteredPharmacies = cachedPharmacies;
        });
      }
    } catch (e) {
      // Cache miss or error, continue with API loading
    }
  }

  Future<void> _loadPharmacies({bool loadMore = false}) async {
    if (_isLoading || (!_hasMore && loadMore)) return;

    setState(() {
      _isLoading = true;
      _hasError = false;
    });

    try {
      final locationProvider = Provider.of<LocationProvider>(context, listen: false);

      final newPharmacies = await _lazyLoader.loadWithLazyLoading(
        'pharmacies_page_$_currentPage',
        () async {
          // Simulate API call with location-based filtering
          await Future.delayed(const Duration(milliseconds: 500));

          final mockPharmacies = List.generate(20, (index) {
            final globalIndex = ((_currentPage - 1) * _pageSize) + index;
            return {
              'id': 'pharmacy_$globalIndex',
              'name': 'Pharmacie ${String.fromCharCode(65 + (globalIndex % 26))}',
              'address': '${100 + globalIndex} Avenue des Pharmacies, Abidjan',
              'distance': 0.5 + (globalIndex * 0.3),
              'rating': 4.0 + (globalIndex % 5) * 0.2,
              'isOpen': globalIndex % 3 != 0,
              'hasDelivery': globalIndex % 2 == 0,
              'phone': '+225 ${20 + globalIndex % 80} ${100000 + globalIndex % 100000}',
              'imageUrl': 'https://picsum.photos/seed/pharmacy_$globalIndex/300/200.jpg',
              'lat': 5.336666 + (globalIndex * 0.01),
              'lng': -4.027778 + (globalIndex * 0.01),
            };
          });

          return mockPharmacies;
        },
        timeout: const Duration(seconds: 10),
      );

      if (mounted) {
        setState(() {
          if (loadMore) {
            _pharmacies.addAll(newPharmacies);
          } else {
            _pharmacies = newPharmacies;
          }
          _filteredPharmacies = _pharmacies;
          _hasMore = newPharmacies.length == _pageSize;
          _currentPage++;
          _isLoading = false;
        });

        // Cache the results
        await _cacheManager.set('pharmacies_search', _pharmacies,
          duration: const Duration(minutes: 30));
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
        });
      }
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadPharmacies(loadMore: true);
    }
  }

  void _filterPharmacies(String query) {
    setState(() {
      _searchQuery = query.toLowerCase();
      _filteredPharmacies = _pharmacies.where((pharmacy) {
        return pharmacy['name'].toLowerCase().contains(_searchQuery) ||
               pharmacy['address'].toLowerCase().contains(_searchQuery);
      }).toList();
    });
  }

  void _retryLoading() {
    setState(() {
      _hasError = false;
      _currentPage = 1;
      _hasMore = true;
    });
    _loadPharmacies();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          decoration: InputDecoration(
            hintText: 'Rechercher une pharmacie...',
            border: InputBorder.none,
            hintStyle: TextStyle(color: AppColors.onSurface.withValues(alpha: 0.6)),
          ),
          style: TextStyle(color: AppColors.onSurface),
          onChanged: _filterPharmacies,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterDialog(),
          ),
          IconButton(
            icon: const Icon(Icons.map),
            onPressed: () => _showMapView(),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchStats(),
          Expanded(
            child: _buildPharmacyList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCurrentLocation(),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.my_location),
      ),
    );
  }

  Widget _buildSearchStats() {
    return Container(
      padding: AppSpacing.paddingMedium,
      color: AppColors.surface,
      child: Row(
        children: [
          Icon(
            Icons.location_on,
            color: AppColors.primary,
            size: 16,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '${_filteredPharmacies.length} pharmacies trouvées',
              style: AppTextStyles.bodySmall,
            ),
          ),
          if (_isLoading)
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
        ],
      ),
    );
  }

  Widget _buildPharmacyList() {
    if (_hasError) {
      return _buildErrorWidget();
    }

    if (_filteredPharmacies.isEmpty && _pharmacies.isEmpty) {
      return _buildEmptyWidget();
    }

    return LazyListView<Map<String, dynamic>>(
      items: _filteredPharmacies,
      itemBuilder: (context, pharmacy, index) {
        return AnimationConfiguration.staggeredList(
          position: index,
          duration: const Duration(milliseconds: 375),
          child: SlideAnimation(
            verticalOffset: 50.0,
            child: FadeInAnimation(
              child: PharmacyCard(
                pharmacy: pharmacy,
                onTap: () => _showPharmacyDetails(pharmacy),
              ),
            ),
          ),
        );
      },
      onLoadMore: _hasMore ? () async {
        await _loadPharmacies(loadMore: true);
        return [];
      } : null,
      loadingWidget: const Padding(
        padding: EdgeInsets.all(16),
        child: Center(child: CircularProgressIndicator()),
      ),
      emptyWidget: _buildEmptyWidget(),
      errorWidget: _buildErrorWidget(),
      scrollController: _scrollController,
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.storefront_outlined,
            size: 64,
            color: AppColors.onSurface.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'Aucune pharmacie trouvée',
            style: AppTextStyles.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            _searchQuery.isEmpty
                ? 'Essayez de modifier votre recherche'
                : 'Essayez d\'autres termes de recherche',
            style: AppTextStyles.bodyMedium,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _retryLoading,
            child: const Text('Réessayer'),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: AppColors.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Erreur de chargement',
            style: AppTextStyles.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Une erreur est survenue lors du chargement des pharmacies',
            style: AppTextStyles.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _retryLoading,
            child: const Text('Réessayer'),
          ),
        ],
      ),
    );
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filtres'),
        content: const Text('Options de filtrage à implémenter'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Appliquer'),
          ),
        ],
      ),
    );
  }

  void _showMapView() {
    Navigator.pushNamed(context, '/map');
  }

  void _showCurrentLocation() {
    // Show current location on map
    _showMapView();
  }

  void _showPharmacyDetails(Map<String, dynamic> pharmacy) {
    Navigator.pushNamed(
      context,
      '/pharmacy-details',
      arguments: pharmacy,
    );
  }
}

/// Optimized pharmacy card widget
class PharmacyCard extends StatelessWidget {
  final Map<String, dynamic> pharmacy;
  final VoidCallback onTap;

  const PharmacyCard({
    super.key,
    required this.pharmacy,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: AppSpacing.marginSmall,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Pharmacy image with lazy loading
            LazyImage(
              imageUrl: pharmacy['imageUrl'] ?? '',
              height: 120,
              width: double.infinity,
              fit: BoxFit.cover,
              placeholder: Container(
                height: 120,
                color: AppColors.surfaceVariant,
                child: const Center(
                  child: CircularProgressIndicator(),
                ),
              ),
              errorWidget: Container(
                height: 120,
                color: AppColors.surfaceVariant,
                child: const Icon(
                  Icons.storefront,
                  size: 48,
                  color: Colors.grey,
                ),
              ),
            ),
            Padding(
              padding: AppSpacing.paddingMedium,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          pharmacy['name'] ?? '',
                          style: AppTextStyles.titleMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      _buildStatusBadge(),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 16,
                        color: AppColors.onSurface.withValues(alpha: 0.6),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${pharmacy['distance']?.toStringAsFixed(1) ?? '?'} km',
                          style: AppTextStyles.bodySmall,
                        ),
                      ),
                      Icon(
                        Icons.star,
                        size: 16,
                        color: AppColors.warning,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${pharmacy['rating']?.toStringAsFixed(1) ?? '?'}',
                        style: AppTextStyles.bodySmall,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    pharmacy['address'] ?? '',
                    style: AppTextStyles.bodySmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (pharmacy['hasDelivery'] == true) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'Livraison',
                            style: AppTextStyles.labelSmall.copyWith(
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      if (pharmacy['isOpen'] == true) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'Ouvert',
                            style: AppTextStyles.labelSmall.copyWith(
                              color: AppColors.success,
                            ),
                          ),
                        ),
                      ] else ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.error.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'Fermé',
                            style: AppTextStyles.labelSmall.copyWith(
                              color: AppColors.error,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge() {
    final isOpen = pharmacy['isOpen'] ?? false;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isOpen ? AppColors.success : AppColors.error,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        isOpen ? 'Open' : 'Closed',
        style: AppTextStyles.labelSmall.copyWith(
          color: AppColors.onPrimary,
        ),
      ),
    );
  }
}