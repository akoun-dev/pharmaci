import 'package:flutter/material.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import '../../../core/design_system/components/app_buttons.dart';
import '../../../core/design_system/components/app_cards.dart';
import '../../../core/design_system/theme/app_theme.dart';
import '../../../core/accessibility/app_accessibility.dart';

class EnhancedDrugSearchScreen extends StatefulWidget {
  const EnhancedDrugSearchScreen({super.key});

  @override
  State<EnhancedDrugSearchScreen> createState() => _EnhancedDrugSearchScreenState();
}

class _EnhancedDrugSearchScreenState extends State<EnhancedDrugSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();

  bool _showSuggestions = false;
  bool _isLoading = false;
  int _selectedTabIndex = 0;

  final List<String> _searchSuggestions = [
    'Paracétamol 500mg',
    'Ibuprofène 400mg',
    'Amoxicilline 1g',
    'Doliprane 1000mg',
    'Spasfon',
    'Doliprane 500mg',
    'Vitamine C',
    'Aspirine 100mg',
  ];

  final List<String> _recentSearches = [
    'Paracétamol 500mg',
    'Ibuprofène 400mg',
    'Doliprane',
  ];

  final List<Map<String, dynamic>> _quickActions = [
    {
      'icon': Icons.medication_outlined,
      'title': 'Médicaments',
      'subtitle': 'Rechercher un médicament',
      'color': AppColors.primary,
    },
    {
      'icon': Icons.local_hospital_outlined,
      'title': 'Pharmacies',
      'subtitle': 'Pharmacies proches',
      'color': AppColors.secondary,
    },
    {
      'icon': Icons.access_time_outlined,
      'title': '24h/24',
      'subtitle': 'Pharmacies de garde',
      'color': AppColors.emergency,
    },
    {
      'icon': Icons.star_outline,
      'title': 'Top',
      'subtitle': 'Meilleures pharmacies',
      'color': AppColors.warning,
    },
  ];

  @override
  void initState() {
    super.initState();
    _searchFocusNode.addListener(() {
      setState(() {
        _showSuggestions = _searchFocusNode.hasFocus;
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppAccessibility.accessibleScaffold(
      appBar: AppBar(
        title: const Text('Recherche PharmaCi'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.onPrimary,
        elevation: 0,
        actions: [
          AppButtons.icon(
            icon: Icons.camera_alt_outlined,
            onPressed: _scanMedication,
            tooltip: 'Scanner un médicament',
            textColor: AppColors.onPrimary,
          ),
          AppButtons.icon(
            icon: Icons.mic_outlined,
            onPressed: _voiceSearch,
            tooltip: 'Recherche vocale',
            textColor: AppColors.onPrimary,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchHeader(),
            const SizedBox(height: 16),
            _buildTabBar(),
            const SizedBox(height: 16),
            Expanded(
              child: _buildSearchContent(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchHeader() {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.vertical(
          bottom: Radius.circular(AppSpacing.radiusXXLarge),
        ),
      ),
      padding: const EdgeInsets.all(AppSpacing.medium),
      child: Column(
        children: [
          // Search bar
          Container(
            decoration: BoxDecoration(
              color: AppColors.onPrimary.withValues(alpha: 0.1),
              borderRadius: AppSpacing.borderRadiusLarge,
            ),
            child: Row(
              children: [
                const SizedBox(width: AppSpacing.medium),
                Icon(
                  Icons.search_outlined,
                  color: AppColors.onPrimary.withValues(alpha: 0.7),
                ),
                const SizedBox(width: AppSpacing.small),
                Expanded(
                  child: AppAccessibility.accessibleTextField(
                    controller: _searchController,
                    focusNode: _searchFocusNode,
                    hintText: 'Rechercher un médicament...',
                    semanticsLabel: 'Champ de recherche de médicaments',
                    onChanged: (value) {
                      setState(() {});
                    },
                  ),
                ),
                if (_searchController.text.isNotEmpty)
                  AppButtons.icon(
                    icon: Icons.clear,
                    onPressed: () {
                      _searchController.clear();
                      setState(() {});
                    },
                    textColor: AppColors.onPrimary.withValues(alpha: 0.7),
                  ),
                const SizedBox(width: AppSpacing.small),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.medium),

          // Quick actions
          _buildQuickActions(),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return AnimationLimiter(
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          crossAxisSpacing: AppSpacing.small,
          mainAxisSpacing: AppSpacing.small,
        ),
        itemCount: _quickActions.length,
        itemBuilder: (context, index) {
          final action = _quickActions[index];
          return AnimationConfiguration.staggeredGrid(
            position: index,
            duration: const Duration(milliseconds: 600),
            columnCount: 4,
            child: ScaleAnimation(
              child: FadeInAnimation(
                child: AppAccessibility.accessibleButton(
                  onPressed: () => _handleQuickAction(index),
                  semanticsLabel: action['title'],
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.onPrimary.withValues(alpha: 0.1),
                      borderRadius: AppSpacing.borderRadiusMedium,
                    ),
                    padding: const EdgeInsets.all(AppSpacing.small),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(AppSpacing.xSmall),
                          decoration: BoxDecoration(
                            color: action['color'],
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            action['icon'],
                            color: AppColors.onPrimary,
                            size: 20,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xSmall),
                        Text(
                          action['title'],
                          style: const TextStyle(
                            color: AppColors.onPrimary,
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: AppSpacing.borderRadiusMedium,
      ),
      child: Row(
        children: [
          Expanded(
            child: AppButtons.text(
              text: 'Recherche',
              onPressed: () => setState(() => _selectedTabIndex = 0),
              textColor: _selectedTabIndex == 0 ? AppColors.primary : AppColors.textSecondary,
              backgroundColor: _selectedTabIndex == 0 ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
            ),
          ),
          Expanded(
            child: AppButtons.text(
              text: 'Catégories',
              onPressed: () => setState(() => _selectedTabIndex = 1),
              textColor: _selectedTabIndex == 1 ? AppColors.primary : AppColors.textSecondary,
              backgroundColor: _selectedTabIndex == 1 ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
            ),
          ),
          Expanded(
            child: AppButtons.text(
              text: 'Récents',
              onPressed: () => setState(() => _selectedTabIndex = 2),
              textColor: _selectedTabIndex == 2 ? AppColors.primary : AppColors.textSecondary,
              backgroundColor: _selectedTabIndex == 2 ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchContent() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    switch (_selectedTabIndex) {
      case 0:
        return _buildSearchResults();
      case 1:
        return _buildCategories();
      case 2:
        return _buildRecentSearches();
      default:
        return _buildSearchResults();
    }
  }

  Widget _buildSearchResults() {
    if (_searchController.text.isEmpty) {
      return _buildPopularMedications();
    }

    if (_showSuggestions && _searchController.text.isNotEmpty) {
      return _buildSearchSuggestions();
    }

    return _buildMedicationResults();
  }

  Widget _buildSearchSuggestions() {
    final suggestions = _searchSuggestions
        .where((suggestion) => suggestion
            .toLowerCase()
            .contains(_searchController.text.toLowerCase()))
        .toList();

    if (suggestions.isEmpty) {
      return AppCards.empty(
        title: 'Aucune suggestion',
        message: 'Essayez une autre recherche',
        icon: Icons.search_off_outlined,
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.medium),
      itemCount: suggestions.length,
      separatorBuilder: (context, index) => const Divider(),
      itemBuilder: (context, index) {
        final suggestion = suggestions[index];
        return AppAccessibility.accessibleListTile(
          title: Text(
            suggestion,
            style: AppTextStyles.body1,
          ),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () {
            _searchController.text = suggestion;
            _searchFocusNode.unfocus();
            setState(() => _showSuggestions = false);
          },
          semanticsLabel: suggestion,
        );
      },
    );
  }

  Widget _buildPopularMedications() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Médicaments populaires'),
          const SizedBox(height: AppSpacing.small),
          _buildPopularMedsGrid(),
          const SizedBox(height: AppSpacing.large),
          _buildSectionTitle('Recommandés pour vous'),
          const SizedBox(height: AppSpacing.small),
          _buildRecommendedMedications(),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.medium),
      child: Text(
        title,
        style: AppTextStyles.headline6,
      ),
    );
  }

  Widget _buildPopularMedsGrid() {
    final popularMeds = [
      {'name': 'Paracétamol 500mg', 'price': 500, 'available': true},
      {'name': 'Ibuprofène 400mg', 'price': 800, 'available': true},
      {'name': 'Amoxicilline 1g', 'price': 1200, 'available': false},
      {'name': 'Doliprane 1000mg', 'price': 1000, 'available': true},
    ];

    return AnimationLimiter(
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.medium),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: AppSpacing.medium,
          mainAxisSpacing: AppSpacing.medium,
          childAspectRatio: 0.8,
        ),
        itemCount: popularMeds.length,
        itemBuilder: (context, index) {
          final med = popularMeds[index];
          return AnimationConfiguration.staggeredGrid(
            position: index,
            duration: const Duration(milliseconds: 600),
            columnCount: 2,
            child: SlideAnimation(
              verticalOffset: 50,
              child: FadeInAnimation(
                child: AppCards.drug(
                  name: med['name'],
                  description: 'Boîte de 20 comprimés',
                  price: med['price'],
                  isAvailable: med['available'],
                  onReserveTap: () => _reserveMedication(med['name']),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildRecommendedMedications() {
    final recommendations = [
      {'name': 'Vitamine C', 'description': 'Immunité et énergie'},
      {'name': 'Magnésium', 'description': 'Stress et fatigue'},
      {'name': 'Oméga 3', 'description': 'Santé cardiovasculaire'},
    ];

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.medium),
      itemCount: recommendations.length,
      separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.small),
      itemBuilder: (context, index) {
        final rec = recommendations[index];
        return AppCards.basic(
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: AppSpacing.borderRadiusMedium,
                ),
                child: const Icon(
                  Icons.medication_outlined,
                  color: AppColors.primary,
                  size: 32,
                ),
              ),
              const SizedBox(width: AppSpacing.medium),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      rec['name'],
                      style: AppTextStyles.drugName,
                    ),
                    Text(
                      rec['description'],
                      style: AppTextStyles.body2,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textSecondary),
            ],
          ),
          onTap: () => _searchController.text = rec['name'],
        );
      },
    );
  }

  Widget _buildCategories() {
    final categories = [
      {'name': 'Douleur & Fièvre', 'icon': Icons.thermostat_outlined, 'count': 45},
      {'name': 'Allergies', 'icon': Icons.health_and_safety_outlined, 'count': 23},
      {'name': 'Vitamines', 'icon': Icons.energy_savings_leaf_outlined, 'count': 18},
      {'name': 'Digestion', 'icon': Icons.stomach_outlined, 'count': 32},
      {'name': 'Sommeil', 'icon': Icons.bedtime_outlined, 'count': 15},
      {'name': 'Peau', 'icon': Icons.face_outlined, 'count': 28},
    ];

    return AnimationLimiter(
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.medium),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          return AnimationConfiguration.staggeredList(
            position: index,
            duration: const Duration(milliseconds: 400),
            child: SlideAnimation(
              verticalOffset: 50,
              child: FadeInAnimation(
                child: AppCards.basic(
                  child: Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: AppSpacing.borderRadiusMedium,
                        ),
                        child: Icon(
                          category['icon'],
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.medium),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              category['name'],
                              style: AppTextStyles.body1.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              '${category['count']} médicaments',
                              style: AppTextStyles.caption,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.xSmall),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '${category['count']}',
                          style: AppTextStyles.caption.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.small),
                      const Icon(Icons.chevron_right, color: AppColors.textSecondary),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildRecentSearches() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.medium),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recherches récentes',
                style: AppTextStyles.headline6,
              ),
              AppButtons.text(
                text: 'Effacer',
                onPressed: _clearRecentSearches,
                textColor: AppColors.primary,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.small),
        Expanded(
          child: _recentSearches.isEmpty
              ? AppCards.empty(
                  title: 'Aucune recherche récente',
                  message: 'Vos recherches apparaîtront ici',
                  icon: Icons.history_outlined,
                )
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.medium),
                  itemCount: _recentSearches.length,
                  separatorBuilder: (context, index) => const Divider(),
                  itemBuilder: (context, index) {
                    final search = _recentSearches[index];
                    return AppAccessibility.accessibleListTile(
                      leading: const Icon(
                        Icons.history_outlined,
                        color: AppColors.textSecondary,
                      ),
                      title: Text(
                        search,
                        style: AppTextStyles.body1,
                      ),
                      trailing: AppButtons.icon(
                        icon: Icons.close,
                        onPressed: () => _removeRecentSearch(index),
                        size: 20,
                        textColor: AppColors.textSecondary,
                      ),
                      onTap: () {
                        _searchController.text = search;
                        _searchFocusNode.unfocus();
                      },
                      semanticsLabel: search,
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildMedicationResults() {
    // Simulated medication results
    final results = List.generate(10, (index) {
      return {
        'name': 'Paracétamol 500mg',
        'description': 'Boîte de 20 comprimés',
        'price': 500,
        'pharmacy': 'Pharmacie de la Paix',
        'distance': 1.2,
        'available': true,
      };
    });

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.medium, vertical: AppSpacing.small),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  '${results.length} pharmacies trouvées',
                  style: AppTextStyles.body2,
                ),
              ),
              AppButtons.icon(
                icon: Icons.tune,
                onPressed: _showFilters,
                tooltip: 'Filtres',
                textColor: AppColors.primary,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.small),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.medium),
            itemCount: results.length,
            separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.small),
            itemBuilder: (context, index) {
              final result = results[index];
              return AppCards.drug(
                name: result['name'],
                description: result['description'],
                price: result['price'],
                isAvailable: result['available'],
                pharmacyName: result['pharmacy'],
                onReserveTap: () => _reserveMedication(result['name']),
              );
            },
          ),
        ),
      ],
    );
  }

  void _handleQuickAction(int index) {
    switch (index) {
      case 0:
        // Medications search
        setState(() => _selectedTabIndex = 0);
        break;
      case 1:
        // Nearby pharmacies
        _navigateToPharmacies();
        break;
      case 2:
        // 24/7 pharmacies
        _navigateToEmergencyPharmacies();
        break;
      case 3:
        // Top pharmacies
        _navigateToTopPharmacies();
        break;
    }
  }

  void _scanMedication() {
    AppAccessibility.announce(context, 'Fonction de scanner à implémenter');
  }

  void _voiceSearch() {
    AppAccessibility.announce(context, 'Recherche vocale à implémenter');
  }

  void _reserveMedication(String medicationName) {
    AppAccessibility.announce(context, 'Réservation de $medicationName');
    // Navigate to reservation screen
  }

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildFilterBottomSheet(),
    );
  }

  Widget _buildFilterBottomSheet() {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusXXLarge),
        ),
      ),
      padding: const EdgeInsets.all(AppSpacing.medium),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Filtres',
                style: AppTextStyles.headline6,
              ),
              AppButtons.icon(
                icon: Icons.close,
                onPressed: () => Navigator.pop(context),
                textColor: AppColors.textSecondary,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.medium),
          // Filter options would go here
          const SizedBox(height: AppSpacing.medium),
          Row(
            children: [
              Expanded(
                child: AppButtons.text(
                  text: 'Réinitialiser',
                  onPressed: () => Navigator.pop(context),
                  textColor: AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: AppSpacing.medium),
              Expanded(
                child: AppButtons.primary(
                  text: 'Appliquer',
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _navigateToPharmacies() {
    // Navigate to pharmacies screen
  }

  void _navigateToEmergencyPharmacies() {
    // Navigate to emergency pharmacies
  }

  void _navigateToTopPharmacies() {
    // Navigate to top pharmacies
  }

  void _clearRecentSearches() {
    setState(() {
      _recentSearches.clear();
    });
  }

  void _removeRecentSearch(int index) {
    setState(() {
      _recentSearches.removeAt(index);
    });
  }
}