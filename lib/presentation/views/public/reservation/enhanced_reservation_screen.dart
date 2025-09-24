import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../providers/reservation_provider.dart';
import '../../../providers/pharmacy_provider.dart';
import '../../../providers/drug_provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../domain/entities/reservation_entity.dart';
import '../../../domain/entities/pharmacy_entity.dart';
import '../../../domain/entities/drug_entity.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/error_widget.dart';
import '../../widgets/reservation/drug_quantity_selector.dart';
import '../../widgets/reservation/reservation_time_slot.dart';
import '../../widgets/reservation/reservation_summary.dart';

class EnhancedReservationScreen extends StatefulWidget {
  final String pharmacyId;
  final String pharmacyName;

  const EnhancedReservationScreen({
    super.key,
    required this.pharmacyId,
    required this.pharmacyName,
  });

  @override
  State<EnhancedReservationScreen> createState() => _EnhancedReservationScreenState();
}

class _EnhancedReservationScreenState extends State<EnhancedReservationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final _searchController = TextEditingController();

  List<DrugEntity> _availableDrugs = [];
  List<DrugEntity> _selectedDrugs = [];
  Map<String, int> _quantities = {};
  DateTime? _selectedDate;
  String? _selectedTimeSlot;
  ReservationType _reservationType = ReservationType.standard;
  bool _isExpress = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadAvailableDrugs();
  }

  @override
  void dispose() {
    _notesController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAvailableDrugs() async {
    final pharmacyProvider = Provider.of<PharmacyProvider>(context, listen: false);
    final drugProvider = Provider.of<DrugProvider>(context, listen: false);

    try {
      final drugs = await pharmacyProvider.getPharmacyStock(widget.pharmacyId);
      _availableDrugs = drugs.where((drug) => drug.quantity > 0).toList();
    } catch (e) {
      print('Erreur lors du chargement des médicaments: ${e.toString()}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Réservation - ${widget.pharmacyName}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () => _navigateToReservationHistory(),
          ),
        ],
      ),
      body: Consumer3<ReservationProvider, PharmacyProvider, DrugProvider>(
        builder: (context, reservationProvider, pharmacyProvider, drugProvider, child) {
          if (pharmacyProvider.isLoading || drugProvider.isLoading) {
            return const LoadingWidget();
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildReservationTypeSelector(),
                  const SizedBox(height: 24),
                  _buildDrugSelection(),
                  const SizedBox(height: 24),
                  _buildDateTimeSelection(),
                  const SizedBox(height: 24),
                  _buildAdditionalOptions(),
                  const SizedBox(height: 24),
                  _buildNotesSection(),
                  const SizedBox(height: 24),
                  _buildReservationSummary(),
                  const SizedBox(height: 32),
                  _buildSubmitButton(reservationProvider),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildReservationTypeSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Type de réservation',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: ChoiceChip(
                label: const Text('Standard'),
                selected: _reservationType == ReservationType.standard,
                onSelected: (selected) {
                  setState(() {
                    _reservationType = ReservationType.standard;
                    _isExpress = false;
                  });
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ChoiceChip(
                label: const Text('Express'),
                selected: _reservationType == ReservationType.express,
                onSelected: (selected) {
                  setState(() {
                    _reservationType = ReservationType.express;
                    _isExpress = true;
                  });
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ChoiceChip(
                label: const Text('Livraison'),
                selected: _reservationType == ReservationType.delivery,
                onSelected: (selected) {
                  setState(() {
                    _reservationType = ReservationType.delivery;
                    _isExpress = false;
                  });
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDrugSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Médicaments',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Spacer(),
            Text(
              '${_selectedDrugs.length} sélectionné(s)',
              style: TextStyle(
                color: Theme.of(context).primaryColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _searchController,
          decoration: InputDecoration(
            hintText: 'Rechercher un médicament...',
            prefixIcon: const Icon(Icons.search),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          onChanged: (value) {
            setState(() {
              if (value.isEmpty) {
                _loadAvailableDrugs();
              } else {
                _availableDrugs = _availableDrugs
                    .where((drug) => drug.name.toLowerCase().contains(value.toLowerCase()))
                    .toList();
              }
            });
          },
        ),
        const SizedBox(height: 12),
        Container(
          height: 200,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(8),
          ),
          child: _availableDrugs.isEmpty
              ? const Center(child: Text('Aucun médicament disponible'))
              : ListView.builder(
                  itemCount: _availableDrugs.length,
                  itemBuilder: (context, index) {
                    final drug = _availableDrugs[index];
                    final isSelected = _selectedDrugs.contains(drug);
                    final quantity = _quantities[drug.id] ?? 1;

                    return CheckboxListTile(
                      title: Text(drug.name),
                      subtitle: Text(
                        'Disponible: ${drug.quantity} - Prix: ${drug.price?.toStringAsFixed(0) ?? 'N/A'} XOF',
                      ),
                      secondary: isSelected
                          ? DrugQuantitySelector(
                              quantity: quantity,
                              maxQuantity: drug.quantity,
                              onChanged: (newQuantity) {
                                setState(() {
                                  _quantities[drug.id] = newQuantity;
                                });
                              },
                            )
                          : null,
                      value: isSelected,
                      onChanged: (selected) {
                        setState(() {
                          if (selected!) {
                            _selectedDrugs.add(drug);
                            _quantities[drug.id] = 1;
                          } else {
                            _selectedDrugs.remove(drug);
                            _quantities.remove(drug.id);
                          }
                        });
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildDateTimeSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Date et heure',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => _selectDate(),
                child: Text(
                  _selectedDate == null
                      ? 'Sélectionner une date'
                      : DateFormat('dd/MM/yyyy').format(_selectedDate!),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton(
                onPressed: _selectedDate == null ? null : () => _selectTimeSlot(),
                child: Text(
                  _selectedTimeSlot ?? 'Sélectionner une heure',
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAdditionalOptions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Options supplémentaires',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        SwitchListTile(
          title: const Text('Réservation express'),
          subtitle: const Text('Traitement prioritaire (+ 500 XOF)'),
          value: _isExpress,
          onChanged: (value) {
            setState(() {
              _isExpress = value;
            });
          },
        ),
      ],
    );
  }

  Widget _buildNotesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Notes',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _notesController,
          decoration: const InputDecoration(
            hintText: 'Informations supplémentaires...',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
          validator: (value) {
            if (value != null && value.length > 500) {
              return 'Les notes ne doivent pas dépasser 500 caractères';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildReservationSummary() {
    return ReservationSummary(
      selectedDrugs: _selectedDrugs,
      quantities: _quantities,
      isExpress: _isExpress,
      reservationType: _reservationType,
      pharmacyName: widget.pharmacyName,
      selectedDate: _selectedDate,
      selectedTimeSlot: _selectedTimeSlot,
    );
  }

  Widget _buildSubmitButton(ReservationProvider reservationProvider) {
    if (_selectedDrugs.isEmpty) {
      return const SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton(
          onPressed: null,
          child: Text('Sélectionnez au moins un médicament'),
        ),
      );
    }

    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: _isLoading ? null : () => _submitReservation(reservationProvider),
        child: _isLoading
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation(Colors.white),
                  ),
                  SizedBox(width: 16),
                  Text('Création de la réservation...'),
                ],
              )
            : const Text('Confirmer la réservation'),
      ),
    );
  }

  Future<void> _selectDate() async {
    final selectedDate = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );

    if (selectedDate != null) {
      setState(() {
        _selectedDate = selectedDate;
        _selectedTimeSlot = null;
      });
    }
  }

  Future<void> _selectTimeSlot() async {
    final timeSlot = await showDialog<String>(
      context: context,
      builder: (context) => ReservationTimeSlot(
        selectedDate: _selectedDate!,
        pharmacyId: widget.pharmacyId,
      ),
    );

    if (timeSlot != null) {
      setState(() {
        _selectedTimeSlot = timeSlot;
      });
    }
  }

  Future<void> _submitReservation(ReservationProvider reservationProvider) async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedDate == null || _selectedTimeSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner une date et une heure')),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vous devez être connecté pour réserver')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final reservation = ReservationEntity(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: authProvider.user!.id,
        pharmacyId: widget.pharmacyId,
        drugIds: _selectedDrugs.map((d) => d.id).toList(),
        quantities: _quantities.values.toList(),
        status: ReservationStatus.pending,
        reservationDate: _selectedDate!,
        timeSlot: _selectedTimeSlot!,
        notes: _notesController.text,
        createdAt: DateTime.now(),
        isExpress: _isExpress,
        type: _reservationType,
      );

      await reservationProvider.createReservation(reservation);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Réservation créée avec succès')),
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

  void _navigateToReservationHistory() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const ReservationHistoryScreen(),
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