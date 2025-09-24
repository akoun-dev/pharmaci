import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import '../../../../providers/location_provider.dart';
import '../../../../providers/pharmacy_provider.dart';
import '../../../../domain/entities/pharmacy_entity.dart';
import '../../../../core/accessibility/app_accessibility.dart';
import '../../../../core/design_system/components/app_buttons.dart';
import '../../../../core/design_system/components/app_cards.dart';
import '../../../../core/design_system/tokens/app_colors.dart';
import '../../../../core/design_system/tokens/app_spacing.dart';
import '../../../../core/design_system/tokens/app_text_styles.dart';
import '../../../widgets/common/loading_widget.dart';
import '../../../widgets/common/error_widget.dart';
import '../emergency/emergency_contact_card.dart';
import '../emergency/emergency_timer.dart';
import '../emergency/quick_action_button.dart';

class EmergencySearchScreen extends StatefulWidget {
  const EmergencySearchScreen({super.key});

  @override
  State<EmergencySearchScreen> createState() => _EmergencySearchScreenState();
}

class _EmergencySearchScreenState extends State<EmergencySearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final MapController _mapController = MapController();
  List<PharmacyEntity> _nearbyPharmacies = [];
  List<PharmacyEntity> _openPharmacies = [];
  bool _isSearching = false;
  EmergencyType _selectedType = EmergencyType.general;
  bool _showMap = false;

  @override
  void initState() {
    super.initState();
    _loadEmergencyData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  Future<void> _loadEmergencyData() async {
    final locationProvider = Provider.of<LocationProvider>(context, listen: false);
    final pharmacyProvider = Provider.of<PharmacyProvider>(context, listen: false);

    if (locationProvider.currentPosition == null) {
      await locationProvider.getCurrentLocation();
    }

    if (locationProvider.currentPosition != null) {
      await _findNearbyPharmacies();
      await _findOpenPharmacies();
    }
  }

  Future<void> _findNearbyPharmacies() async {
    final locationProvider = Provider.of<LocationProvider>(context, listen: false);
    final pharmacyProvider = Provider.of<PharmacyProvider>(context, listen: false);

    if (locationProvider.currentPosition != null) {
      final pharmacies = await pharmacyProvider.findPharmaciesWithinRadius(
        latitude: locationProvider.currentPosition!.latitude,
        longitude: locationProvider.currentPosition!.longitude,
        radius: 10,
      );

      setState(() {
        _nearbyPharmacies = pharmacies.take(5).toList();
      });
    }
  }

  Future<void> _findOpenPharmacies() async {
    final locationProvider = Provider.of<LocationProvider>(context, listen: false);
    final pharmacyProvider = Provider.of<PharmacyProvider>(context, listen: false);

    if (locationProvider.currentPosition != null) {
      final pharmacies = await pharmacyProvider.findPharmaciesWithinRadius(
        latitude: locationProvider.currentPosition!.latitude,
        longitude: locationProvider.currentPosition!.longitude,
        radius: 15,
      );

      setState(() {
        _openPharmacies = pharmacies.where((p) => p.isOpen).take(10).toList();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.red, Colors.redAccent],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              Expanded(
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                  ),
                  child: _buildContent(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const Icon(
            Icons.emergency,
            color: Colors.white,
            size: 48,
          ),
          const SizedBox(height: 8),
          const Text(
            'URGENCE',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Service d\'urgence pharmaceutique',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 16),
          EmergencyTimer(
            onTimerEnd: _handleEmergencyTimeout,
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return Column(
      children: [
        _buildEmergencyTypeSelector(),
        const SizedBox(height: 16),
        _buildQuickActions(),
        const SizedBox(height: 16),
        _buildSearchBar(),
        const SizedBox(height: 16),
        Expanded(
          child: _showMap ? _buildMapView() : _buildListView(),
        ),
      ],
    );
  }

  Widget _buildEmergencyTypeSelector() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: EmergencyType.values.map((type) {
          final isSelected = _selectedType == type;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(type.label),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  _selectedType = type;
                });
              },
              backgroundColor: Colors.grey[200],
              selectedColor: Colors.red.withOpacity(0.2),
              labelStyle: TextStyle(
                color: isSelected ? Colors.red : Colors.black,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildQuickActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: QuickActionButton(
              icon: Icons.call,
              label: 'Appeler 144',
              color: Colors.red,
              onPressed: _callEmergency,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: QuickActionButton(
              icon: Icons.location_on,
              label: 'Me localiser',
              color: Colors.blue,
              onPressed: _getCurrentLocation,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: QuickActionButton(
              icon: Icons.map,
              label: _showMap ? 'Liste' : 'Carte',
              color: Colors.green,
              onPressed: () {
                setState(() {
                  _showMap = !_showMap;
                });
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Rechercher un médicament...',
          prefixIcon: const Icon(Icons.search),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(25),
          ),
          filled: true,
          fillColor: Colors.grey[100],
        ),
        onChanged: (value) {
          setState(() {
            _isSearching = value.isNotEmpty;
          });
        },
      ),
    );
  }

  Widget _buildListView() {
    return Consumer2<LocationProvider, PharmacyProvider>(
      builder: (context, locationProvider, pharmacyProvider, child) {
        if (locationProvider.isLoading || pharmacyProvider.isLoading) {
          return const LoadingWidget();
        }

        if (locationProvider.errorMessage != null || pharmacyProvider.errorMessage != null) {
          return CustomErrorWidget(
            message: locationProvider.errorMessage ?? pharmacyProvider.errorMessage!,
            onRetry: _loadEmergencyData,
          );
        }

        return DefaultTabController(
          length: 2,
          child: Column(
            children: [
              const TabBar(
                tabs: [
                  Tab(text: 'Pharmacies ouvertes'),
                  Tab(text: 'Plus proches'),
                ],
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _buildPharmaciesList(_openPharmacies),
                    _buildPharmaciesList(_nearbyPharmacies),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMapView() {
    return Consumer<LocationProvider>(
      builder: (context, locationProvider, child) {
        if (locationProvider.currentPosition == null) {
          return const Center(child: Text('Localisation en cours...'));
        }

        return FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            center: LatLng(
              locationProvider.currentPosition!.latitude,
              locationProvider.currentPosition!.longitude,
            ),
            zoom: 13,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              subdomains: ['a', 'b', 'c'],
            ),
            MarkerLayer(
              markers: [
                Marker(
                  point: LatLng(
                    locationProvider.currentPosition!.latitude,
                    locationProvider.currentPosition!.longitude,
                  ),
                  builder: (context) => const Icon(
                    Icons.my_location,
                    color: Colors.blue,
                    size: 30,
                  ),
                ),
                ..._openPharmacies.map((pharmacy) {
                  return Marker(
                    point: pharmacy.location,
                    builder: (context) => const Icon(
                      Icons.local_pharmacy,
                      color: Colors.green,
                      size: 30,
                    ),
                  );
                }),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildPharmaciesList(List<PharmacyEntity> pharmacies) {
    if (pharmacies.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.local_pharmacy_outlined, size: 64),
            SizedBox(height: 16),
            Text('Aucune pharmacie trouvée'),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: pharmacies.length,
      itemBuilder: (context, index) {
        final pharmacy = pharmacies[index];
        return EmergencyContactCard(
          pharmacy: pharmacy,
          onCall: () => _callPharmacy(pharmacy.phone),
          onDirections: () => _getDirections(pharmacy),
        );
      },
    );
  }

  void _callEmergency() {
    // Intégrer l'appel d'urgence
  }

  void _getCurrentLocation() async {
    final locationProvider = Provider.of<LocationProvider>(context, listen: false);
    await locationProvider.getCurrentLocation();
    await _loadEmergencyData();
  }

  void _callPharmacy(String phone) {
    // Intégrer l'appel téléphonique
  }

  void _getDirections(PharmacyEntity pharmacy) {
    // Intégrer la navigation
  }

  void _handleEmergencyTimeout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Temps d\'urgence écoulé'),
        content: const Text('Voulez-vous continuer la recherche ou appeler les secours ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Continuer'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _callEmergency();
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Appeler les secours'),
          ),
        ],
      ),
    );
  }
}

enum EmergencyType {
  general('Général'),
  fever('Fièvre'),
  pain('Douleur'),
  allergy('Allergie'),
  injury('Blessure'),
  poisoning('Intoxication');

  const EmergencyType(this.label);
  final String label;
}
