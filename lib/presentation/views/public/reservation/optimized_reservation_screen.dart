import 'package:flutter/material.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:intl/intl.dart';
import 'package:lottie/lottie.dart';
import '../../../core/design_system/components/app_buttons.dart';
import '../../../core/design_system/components/app_cards.dart';
import '../../../core/design_system/tokens/app_colors.dart';
import '../../../core/design_system/tokens/app_spacing.dart';
import '../../../core/design_system/tokens/app_text_styles.dart';
import '../../../core/accessibility/app_accessibility.dart';

class OptimizedReservationScreen extends StatefulWidget {
  final String pharmacyId;
  final String pharmacyName;
  final String? drugName;
  final double? drugPrice;

  const OptimizedReservationScreen({
    super.key,
    required this.pharmacyId,
    required this.pharmacyName,
    this.drugName,
    this.drugPrice,
  });

  @override
  State<OptimizedReservationScreen> createState() => _OptimizedReservationScreenState();
}

class _OptimizedReservationScreenState extends State<OptimizedReservationScreen> {
  final PageController _pageController = PageController();
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();

  int _currentStep = 0;
  bool _isLoading = false;
  bool _isExpress = false;
  DateTime? _selectedDate;
  String? _selectedTimeSlot;
  ReservationType _reservationType = ReservationType.standard;

  // Mock data for demonstration
  final List<Map<String, dynamic>> _availableDrugs = [
    {
      'id': '1',
      'name': widget.drugName ?? 'Paracétamol 500mg',
      'price': widget.drugPrice ?? 500,
      'quantity': 25,
      'description': 'Boîte de 20 comprimés',
      'selected': true,
      'quantity': 1,
    },
    {
      'id': '2',
      'name': 'Ibuprofène 400mg',
      'price': 800,
      'quantity': 15,
      'description': 'Boîte de 15 comprimés',
      'selected': false,
      'quantity': 1,
    },
    {
      'id': '3',
      'name': 'Amoxicilline 1g',
      'price': 1200,
      'quantity': 8,
      'description': 'Boîte de 12 comprimés',
      'selected': false,
      'quantity': 1,
    },
    {
      'id': '4',
      'name': 'Vitamine C 1000mg',
      'price': 300,
      'quantity': 50,
      'description': 'Boîte de 30 comprimés',
      'selected': false,
      'quantity': 1,
    },
  ];

  final List<String> _timeSlots = [
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
    '17:00 - 18:00',
  ];

  List<Map<String, dynamic>> get selectedDrugs =>
      _availableDrugs.where((drug) => drug['selected']).toList();

  double get subtotal =>
      selectedDrugs.fold(0, (sum, drug) => sum + (drug['price'] * drug['quantity']));

  double get expressFee => _isExpress ? 500 : 0;
  double get deliveryFee => _reservationType == ReservationType.delivery ? 1000 : 0;
  double get total => subtotal + expressFee + deliveryFee;

  @override
  void initState() {
    super.initState();
    // Auto-select the passed drug if provided
    if (widget.drugName != null) {
      _availableDrugs.firstWhere(
        (drug) => drug['name'] == widget.drugName,
        orElse: () => _availableDrugs.first,
      )['selected'] = true;
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _notesController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppAccessibility.accessibleScaffold(
      appBar: AppBar(
        title: const Text('Réservation PharmaCi'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.onPrimary,
        elevation: 0,
        actions: [
          AppButtons.icon(
            icon: Icons.help_outline,
            onPressed: _showHelp,
            tooltip: 'Aide',
            textColor: AppColors.onPrimary,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildProgressIndicator(),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildDrugSelectionStep(),
                  _buildDateTimeStep(),
                  _buildOptionsStep(),
                  _buildSummaryStep(),
                ],
              ),
            ),
            _buildNavigationButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.medium),
      color: AppColors.primary.withValues(alpha: 0.05),
      child: Row(
        children: List.generate(4, (index) {
          final isActive = index <= _currentStep;
          final isCompleted = index < _currentStep;

          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: isActive ? AppColors.primary : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                if (index < 3) ...[
                  Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: isCompleted ? AppColors.primary : Colors.grey.shade300,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ],
            ),
          );
        }),
      ],
    ),
  );

    return Container(
      padding: const EdgeInsets.all(AppSpacing.medium),
      child: Row(
        children: [
          for (int i = 0; i < 4; i++)
            Expanded(
              child: Container(
                margin: EdgeInsets.only(right: i < 3 ? AppSpacing.small : 0),
                height: 4,
                decoration: BoxDecoration(
                  color: i <= _currentStep ? AppColors.primary : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDrugSelectionStep() {
    return _buildStepContainer(
      title: 'Sélection des médicaments',
      subtitle: 'Choisissez les médicaments à réserver',
      child: Column(
        children: [
          _buildSearchBar(),
          const SizedBox(height: AppSpacing.medium),
          _buildDrugsList(),
          const SizedBox(height: AppSpacing.medium),
          _buildSelectedDrugsSummary(),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: AppSpacing.borderRadiusMedium,
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [
          const SizedBox(width: AppSpacing.medium),
          Icon(Icons.search_outlined, color: AppColors.textSecondary),
          const SizedBox(width: AppSpacing.small),
          Expanded(
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: 'Rechercher un médicament...',
                border: InputBorder.none,
                hintStyle: TextStyle(color: AppColors.textSecondary),
              ),
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
              size: 20,
              textColor: AppColors.textSecondary,
            ),
          const SizedBox(width: AppSpacing.small),
        ],
      ),
    );
  }

  Widget _buildDrugsList() {
    final filteredDrugs = _availableDrugs.where((drug) {
      if (_searchController.text.isEmpty) return true;
      return drug['name']
          .toString()
          .toLowerCase()
          .contains(_searchController.text.toLowerCase());
    }).toList();

    if (filteredDrugs.isEmpty) {
      return AppCards.empty(
        title: 'Aucun médicament trouvé',
        message: 'Essayez une autre recherche',
        icon: Icons.medication_outlined,
      );
    }

    return Expanded(
      child: AnimationLimiter(
        child: ListView.separated(
          padding: EdgeInsets.zero,
          itemCount: filteredDrugs.length,
          separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.small),
          itemBuilder: (context, index) {
            final drug = filteredDrugs[index];
            return AnimationConfiguration.staggeredList(
              position: index,
              duration: const Duration(milliseconds: 400),
              child: SlideAnimation(
                verticalOffset: 50,
                child: FadeInAnimation(
                  child: _buildDrugCard(drug),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildDrugCard(Map<String, dynamic> drug) {
    final isSelected = drug['selected'] as bool;
    final quantity = drug['quantity'] as int;
    final maxQuantity = drug['quantity'] as int;

    return AppCards.basic(
      onTap: () {
        setState(() {
          drug['selected'] = !isSelected;
          if (!isSelected) {
            drug['quantity'] = 1;
          }
        });
      },
      backgroundColor: isSelected ? AppColors.primary.withValues(alpha: 0.05) : AppColors.surface,
      borderColor: isSelected ? AppColors.primary : Colors.grey.shade300,
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: AppSpacing.borderRadiusMedium,
                ),
                child: const Icon(
                  Icons.medication_outlined,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: AppSpacing.medium),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      drug['name'],
                      style: AppTextStyles.drugName,
                    ),
                    Text(
                      drug['description'],
                      style: AppTextStyles.body2,
                    ),
                    const SizedBox(height: AppSpacing.xSmall),
                    Row(
                      children: [
                        Text(
                          '${drug['price']} FCFA',
                          style: AppTextStyles.price,
                        ),
                        const SizedBox(width: AppSpacing.medium),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.xSmall,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.available.withValues(alpha: 0.1),
                            borderRadius: AppSpacing.borderRadiusSmall,
                          ),
                          child: Text(
                            'Stock: ${drug['quantity']}',
                            style: TextStyle(
                              fontSize: 10,
                              color: AppColors.available,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Checkbox(
                value: isSelected,
                onChanged: (value) {
                  setState(() {
                    drug['selected'] = value ?? false;
                    if (value == true) {
                      drug['quantity'] = 1;
                    }
                  });
                },
                activeColor: AppColors.primary,
              ),
            ],
          ),
          if (isSelected) ...[
            const SizedBox(height: AppSpacing.medium),
            Container(
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: AppSpacing.borderRadiusSmall,
              ),
              padding: const EdgeInsets.all(AppSpacing.small),
              child: Row(
                children: [
                  Text('Quantité:', style: AppTextStyles.body2),
                  const Spacer(),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: AppSpacing.borderRadiusSmall,
                    ),
                    child: Row(
                      children: [
                        AppButtons.icon(
                          icon: Icons.remove,
                          onPressed: quantity > 1
                              ? () {
                                  setState(() {
                                    drug['quantity'] = quantity - 1;
                                  });
                                }
                              : null,
                          size: 16,
                          textColor: AppColors.primary,
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.small,
                          ),
                          child: Text(
                            '$quantity',
                            style: AppTextStyles.body1.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        AppButtons.icon(
                          icon: Icons.add,
                          onPressed: quantity < maxQuantity
                              ? () {
                                  setState(() {
                                    drug['quantity'] = quantity + 1;
                                  });
                                }
                              : null,
                          size: 16,
                          textColor: AppColors.primary,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSelectedDrugsSummary() {
    if (selectedDrugs.isEmpty) return const SizedBox();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.medium),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.05),
        borderRadius: AppSpacing.borderRadiusMedium,
      ),
      child: Row(
        children: [
          Icon(Icons.shopping_cart_outlined, color: AppColors.primary),
          const SizedBox(width: AppSpacing.small),
          Expanded(
            child: Text(
              '${selectedDrugs.length} médicament(s) sélectionné(s) - ${subtotal.toStringAsFixed(0)} FCFA',
              style: AppTextStyles.body1.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateTimeStep() {
    return _buildStepContainer(
      title: 'Date et heure de retrait',
      subtitle: 'Choisissez quand récupérer votre commande',
      child: Column(
        children: [
          _buildDateSelection(),
          const SizedBox(height: AppSpacing.large),
          _buildTimeSlotSelection(),
          const SizedBox(height: AppSpacing.large),
          _buildReservationTypeSelection(),
        ],
      ),
    );
  }

  Widget _buildDateSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Date de retrait',
          style: AppTextStyles.headline6,
        ),
        const SizedBox(height: AppSpacing.medium),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: AppSpacing.small,
            mainAxisSpacing: AppSpacing.small,
          ),
          itemCount: 7,
          itemBuilder: (context, index) {
            final date = DateTime.now().add(Duration(days: index));
            final isSelected = _selectedDate?.day == date.day &&
                _selectedDate?.month == date.month &&
                _selectedDate?.year == date.year;
            final isToday = date.day == DateTime.now().day;
            final isTomorrow = date.day == DateTime.now().add(const Duration(days: 1)).day;

            String label = '';
            if (isToday) label = 'Aujourd\'hui';
            else if (isTomorrow) label = 'Demain';
            else label = DateFormat('EEE').format(date);

            return AppButtons.text(
              text: '$label\n${date.day}',
              onPressed: () {
                setState(() {
                  _selectedDate = date;
                  _selectedTimeSlot = null;
                });
              },
              textColor: isSelected ? AppColors.onPrimary : AppColors.textPrimary,
              backgroundColor: isSelected ? AppColors.primary : Colors.transparent,
            );
          },
        ),
      ],
    );
  }

  Widget _buildTimeSlotSelection() {
    if (_selectedDate == null) {
      return const SizedBox();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Créneau horaire',
          style: AppTextStyles.headline6,
        ),
        const SizedBox(height: AppSpacing.medium),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: AppSpacing.small,
            mainAxisSpacing: AppSpacing.small,
          ),
          itemCount: _timeSlots.length,
          itemBuilder: (context, index) {
            final timeSlot = _timeSlots[index];
            final isSelected = _selectedTimeSlot == timeSlot;

            return AppButtons.text(
              text: timeSlot,
              onPressed: () {
                setState(() {
                  _selectedTimeSlot = timeSlot;
                });
              },
              textColor: isSelected ? AppColors.onPrimary : AppColors.textPrimary,
              backgroundColor: isSelected ? AppColors.primary : Colors.transparent,
            );
          },
        ),
      ],
    );
  }

  Widget _buildReservationTypeSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Type de réservation',
          style: AppTextStyles.headline6,
        ),
        const SizedBox(height: AppSpacing.medium),
        AppButtons.group(
          spacing: AppSpacing.small,
          children: [
            Expanded(
              child: AppButtons.outlined(
                text: 'Standard\nGratuit',
                onPressed: () {
                  setState(() {
                    _reservationType = ReservationType.standard;
                    _isExpress = false;
                  });
                },
                borderColor: _reservationType == ReservationType.standard
                    ? AppColors.primary
                    : Colors.grey.shade300,
                textColor: _reservationType == ReservationType.standard
                    ? AppColors.primary
                    : AppColors.textPrimary,
              ),
            ),
            Expanded(
              child: AppButtons.outlined(
                text: 'Express\n+500 FCFA',
                onPressed: () {
                  setState(() {
                    _reservationType = ReservationType.express;
                    _isExpress = true;
                  });
                },
                borderColor: _reservationType == ReservationType.express
                    ? AppColors.primary
                    : Colors.grey.shade300,
                textColor: _reservationType == ReservationType.express
                    ? AppColors.primary
                    : AppColors.textPrimary,
              ),
            ),
            Expanded(
              child: AppButtons.outlined(
                text: 'Livraison\n+1000 FCFA',
                onPressed: () {
                  setState(() {
                    _reservationType = ReservationType.delivery;
                    _isExpress = false;
                  });
                },
                borderColor: _reservationType == ReservationType.delivery
                    ? AppColors.primary
                    : Colors.grey.shade300,
                textColor: _reservationType == ReservationType.delivery
                    ? AppColors.primary
                    : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildOptionsStep() {
    return _buildStepContainer(
      title: 'Options supplémentaires',
      subtitle: 'Personnalisez votre réservation',
      child: Column(
        children: [
          _buildExpressOption(),
          const SizedBox(height: AppSpacing.large),
          _buildNotesSection(),
          const SizedBox(height: AppSpacing.large),
          _buildContactInfo(),
        ],
      ),
    );
  }

  Widget _buildExpressOption() {
    return AppCards.basic(
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.warning.withValues(alpha: 0.1),
              borderRadius: AppSpacing.borderRadiusMedium,
            ),
            child: Icon(
              Icons.flash_on_outlined,
              color: AppColors.warning,
            ),
          ),
          const SizedBox(width: AppSpacing.medium),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Réservation express',
                  style: AppTextStyles.body1.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Traitement prioritaire de votre commande',
                  style: AppTextStyles.body2,
                ),
              ],
            ),
          ),
          AppButtons.switchButton(
            value: _isExpress,
            onChanged: (value) {
              setState(() {
                _isExpress = value;
                if (value) {
                  _reservationType = ReservationType.express;
                }
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNotesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Notes (optionnel)',
          style: AppTextStyles.headline6,
        ),
        const SizedBox(height: AppSpacing.small),
        Container(
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: AppSpacing.borderRadiusMedium,
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: TextField(
            controller: _notesController,
            decoration: const InputDecoration(
              hintText: 'Informations supplémentaires pour la pharmacie...',
              border: InputBorder.none,
              contentPadding: EdgeInsets.all(AppSpacing.medium),
            ),
            maxLines: 4,
            maxLength: 500,
          ),
        ),
      ],
    );
  }

  Widget _buildContactInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Informations de contact',
          style: AppTextStyles.headline6,
        ),
        const SizedBox(height: AppSpacing.small),
        AppCards.basic(
          child: Column(
            children: [
              Row(
                children: [
                  Icon(Icons.phone_outlined, color: AppColors.textSecondary),
                  const SizedBox(width: AppSpacing.small),
                  Text(
                    '+225 07 00 00 00 00',
                    style: AppTextStyles.body1,
                  ),
                  const Spacer(),
                  AppButtons.text(
                    text: 'Modifier',
                    textColor: AppColors.primary,
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.small),
              Row(
                children: [
                  Icon(Icons.email_outlined, color: AppColors.textSecondary),
                  const SizedBox(width: AppSpacing.small),
                  Text(
                    'email@example.com',
                    style: AppTextStyles.body1,
                  ),
                  const Spacer(),
                  AppButtons.text(
                    text: 'Modifier',
                    textColor: AppColors.primary,
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryStep() {
    return _buildStepContainer(
      title: 'Récapitulatif de la réservation',
      subtitle: 'Vérifiez votre commande avant confirmation',
      child: Column(
        children: [
          _buildOrderSummary(),
          const SizedBox(height: AppSpacing.large),
          _buildPharmacyInfo(),
          const SizedBox(height: AppSpacing.large),
          _buildFinalConfirmation(),
        ],
      ),
    );
  }

  Widget _buildOrderSummary() {
    return AppCards.basic(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Détail de la commande',
            style: AppTextStyles.headline6,
          ),
          const SizedBox(height: AppSpacing.medium),
          ...selectedDrugs.map((drug) {
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.small),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${drug['name']} x${drug['quantity']}',
                      style: AppTextStyles.body2,
                    ),
                  ),
                  Text(
                    '${(drug['price'] * drug['quantity']).toStringAsFixed(0)} FCFA',
                    style: AppTextStyles.body2.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            );
          }),
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.small),
            child: Row(
              children: [
                const Expanded(child: Text('Sous-total')),
                Text(
                  '${subtotal.toStringAsFixed(0)} FCFA',
                  style: AppTextStyles.body1.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          if (_isExpress)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.small),
              child: Row(
                children: [
                  const Expanded(child: Text('Frais express')),
                  Text(
                    '${expressFee.toStringAsFixed(0)} FCFA',
                    style: AppTextStyles.body1.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          if (deliveryFee > 0)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.small),
              child: Row(
                children: [
                  const Expanded(child: Text('Frais de livraison')),
                  Text(
                    '${deliveryFee.toStringAsFixed(0)} FCFA',
                    style: AppTextStyles.body1.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.small),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Total',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Text(
                  '${total.toStringAsFixed(0)} FCFA',
                  style: AppTextStyles.headline5.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPharmacyInfo() {
    return AppCards.basic(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Pharmacie',
            style: AppTextStyles.headline6,
          ),
          const SizedBox(height: AppSpacing.medium),
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: AppSpacing.borderRadiusMedium,
                ),
                child: const Icon(
                  Icons.local_pharmacy_outlined,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: AppSpacing.medium),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.pharmacyName,
                      style: AppTextStyles.pharmacyName,
                    ),
                    Text(
                      'Abidjan, Côte d\'Ivoire',
                      style: AppTextStyles.body2,
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (_selectedDate != null && _selectedTimeSlot != null) ...[
            const SizedBox(height: AppSpacing.medium),
            Row(
              children: [
                Icon(Icons.calendar_today_outlined, color: AppColors.textSecondary),
                const SizedBox(width: AppSpacing.small),
                Text(
                  '${DateFormat('dd/MM/yyyy').format(_selectedDate!)} - $_selectedTimeSlot',
                  style: AppTextStyles.body2,
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFinalConfirmation() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.medium),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.1),
        borderRadius: AppSpacing.borderRadiusMedium,
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: AppColors.warning),
          const SizedBox(width: AppSpacing.small),
          Expanded(
            child: Text(
              'Votre réservation sera confirmée dans les plus brefs délais.',
              style: AppTextStyles.body2.copyWith(
                color: AppColors.warning,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepContainer({
    required String title,
    required String subtitle,
    required Widget child,
  }) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.medium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: AppTextStyles.headline4,
          ),
          const SizedBox(height: AppSpacing.xSmall),
          Text(
            subtitle,
            style: AppTextStyles.body2.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.large),
          Expanded(child: child),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.medium),
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: AppShadows.small,
      ),
      child: SafeArea(
        child: Row(
          children: [
            if (_currentStep > 0)
              Expanded(
                child: AppButtons.outlined(
                  text: 'Précédent',
                  onPressed: () {
                    setState(() {
                      _currentStep--;
                      _pageController.previousPage(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      );
                    });
                  },
                ),
              )
            else
              const Expanded(child: SizedBox()),
            const SizedBox(width: AppSpacing.medium),
            Expanded(
              child: AppButtons.primary(
                text: _currentStep == 3 ? 'Confirmer la réservation' : 'Suivant',
                isLoading: _isLoading,
                onPressed: _currentStep == 3 ? _submitReservation : _goToNextStep,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _goToNextStep() {
    if (_currentStep == 0 && selectedDrugs.isEmpty) {
      AppAccessibility.announce(context, 'Veuillez sélectionner au moins un médicament');
      return;
    }

    if (_currentStep == 1 && (_selectedDate == null || _selectedTimeSlot == null)) {
      AppAccessibility.announce(context, 'Veuillez sélectionner une date et une heure');
      return;
    }

    setState(() {
      _currentStep++;
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    });
  }

  void _submitReservation() {
    setState(() {
      _isLoading = true;
    });

    // Simulate API call
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        _isLoading = false;
      });

      _showSuccessDialog();
    });
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: AppSpacing.borderRadiusLarge,
        ),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.large),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Lottie.asset(
                'assets/animations/success.json',
                width: 120,
                height: 120,
                repeat: false,
              ),
              const SizedBox(height: AppSpacing.large),
              Text(
                'Réservation réussie!',
                style: AppTextStyles.headline4,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.small),
              Text(
                'Votre réservation a été confirmée. Vous recevrez une confirmation par SMS.',
                style: AppTextStyles.body2,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.large),
              AppButtons.primary(
                text: 'Voir mes réservations',
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
              ),
              const SizedBox(height: AppSpacing.small),
              AppButtons.text(
                text: 'Fermer',
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showHelp() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Aide à la réservation'),
        content: const Text(
          'Suivez les étapes pour réserver vos médicaments :\n\n'
          '1. Sélectionnez les médicaments\n'
          '2. Choisissez date et heure\n'
          '3. Ajoutez des options si besoin\n'
          '4. Confirmez votre réservation',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Compris'),
          ),
        ],
      ),
    );
  }
}

enum ReservationType {
  standard('Standard'),
  express('Express'),
  delivery('Livraison');

  const ReservationType(this.label);
  final String label;
}