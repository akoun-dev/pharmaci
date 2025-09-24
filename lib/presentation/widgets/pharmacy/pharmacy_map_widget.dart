import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:pharmaci/domain/entities/pharmacy_entity.dart';
import 'package:pharmaci/presentation/providers/location_provider.dart';
import 'package:provider/provider.dart';

class PharmacyMapWidget extends StatefulWidget {
  final List<PharmacyEntity> pharmacies;
  final Function(PharmacyEntity)? onPharmacySelected;
  final LatLng? initialCenter;
  final double? initialZoom;

  const PharmacyMapWidget({
    super.key,
    required this.pharmacies,
    this.onPharmacySelected,
    this.initialCenter,
    this.initialZoom,
  });

  @override
  State<PharmacyMapWidget> createState() => _PharmacyMapWidgetState();
}

class _PharmacyMapWidgetState extends State<PharmacyMapWidget> {
  late MapController _mapController;
  LatLng? _currentLocation;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    final locationProvider = Provider.of<LocationProvider>(context, listen: false);
    await locationProvider.getCurrentLocation();
    if (locationProvider.currentLocation != null) {
      setState(() {
        _currentLocation = LatLng(
          locationProvider.currentLocation!.latitude,
          locationProvider.currentLocation!.longitude,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: widget.initialCenter ??
            _currentLocation ?? const LatLng(5.3604, -4.0083), // Default to Abidjan
        initialZoom: widget.initialZoom ?? 13.0,
        minZoom: 10.0,
        maxZoom: 18.0,
        onTap: (tapPosition, point) {
          // Handle map tap if needed
        },
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          subdomains: const ['a', 'b', 'c'],
          userAgentPackageName: 'com.pharmaci.app',
        ),
        MarkerLayer(
          markers: [
            // Current location marker
            if (_currentLocation != null)
              Marker(
                point: _currentLocation!,
                width: 40.0,
                height: 40.0,
                child: const Icon(
                  Icons.my_location,
                  color: Colors.blue,
                  size: 30.0,
                ),
              ),
            // Pharmacy markers
            ...widget.pharmacies.map((pharmacy) {
              return Marker(
                point: LatLng(
                  pharmacy.latitude,
                  pharmacy.longitude,
                ),
                width: 50.0,
                height: 50.0,
                child: GestureDetector(
                  onTap: () => widget.onPharmacySelected?.call(pharmacy),
                  child: Column(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: pharmacy.isOpen ? Colors.green : Colors.red,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(
                          Icons.local_pharmacy,
                          color: Colors.white,
                          size: 24.0,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.2),
                              blurRadius: 2,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Text(
                          pharmacy.name,
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
        // Current location button
        Positioned(
          right: 16,
          bottom: 16,
          child: FloatingActionButton(
            onPressed: _getCurrentLocation,
            backgroundColor: Colors.white,
            child: const Icon(
              Icons.my_location,
              color: Colors.blue,
            ),
          ),
        ),
      ],
    );
  }
}