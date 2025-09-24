import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:pharmaci/domain/entities/pharmacy_entity.dart';
import 'package:pharmaci/presentation/providers/location_provider.dart';
import 'package:provider/provider.dart';

class GeoLocation {
  final double latitude;
  final double longitude;

  GeoLocation({
    required this.latitude,
    required this.longitude,
  });
}

class SearchMapWidget extends StatefulWidget {
  final List<PharmacyEntity> pharmacies;
  final Function(PharmacyEntity)? onPharmacySelected;
  final GeoLocation? searchCenter;
  final double searchRadius;

  const SearchMapWidget({
    super.key,
    required this.pharmacies,
    this.onPharmacySelected,
    this.searchCenter,
    this.searchRadius = 5.0,
  });

  @override
  State<SearchMapWidget> createState() => _SearchMapWidgetState();
}

class _SearchMapWidgetState extends State<SearchMapWidget> {
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

  List<LatLng> _createCirclePoints(LatLng center, double radius) {
    const points = 64;
    final circlePoints = <LatLng>[];

    for (var i = 0; i <= points; i++) {
      final angle = (i / points) * 2 * 3.141592653589793;
      final dx = radius * 111.32 * 1000 * math.cos(angle); // Convert to meters
      final dy = radius * 111.32 * 1000 * math.sin(angle); // Convert to meters

      circlePoints.add(LatLng(
        center.latitude + (dy / 111320),
        center.longitude + (dx / (111320 * math.cos(center.latitude * math.pi / 180))),
      ));
    }

    return circlePoints;
  }

  @override
  Widget build(BuildContext context) {
    final searchCenterLatLng = widget.searchCenter != null
        ? LatLng(widget.searchCenter!.latitude, widget.searchCenter!.longitude)
        : _currentLocation;

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: searchCenterLatLng ?? const LatLng(5.3604, -4.0083),
        initialZoom: 13.0,
        minZoom: 10.0,
        maxZoom: 18.0,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          subdomains: const ['a', 'b', 'c'],
          userAgentPackageName: 'com.pharmaci.app',
        ),
        // Search radius circle
        if (searchCenterLatLng != null)
          PolylineLayer(
            polylines: [
              Polyline(
                points: _createCirclePoints(searchCenterLatLng, widget.searchRadius),
                color: Colors.blue.withValues(alpha: 0.3),
                strokeWidth: 2.0,
              ),
            ],
          ),
        MarkerLayer(
          markers: [
            // Search center marker
            if (searchCenterLatLng != null)
              Marker(
                point: searchCenterLatLng,
                width: 30.0,
                height: 30.0,
                child: const Icon(
                  Icons.location_searching,
                  color: Colors.blue,
                  size: 24.0,
                ),
              ),
            // Current location marker
            if (_currentLocation != null)
              Marker(
                point: _currentLocation!,
                width: 40.0,
                height: 40.0,
                child: const Icon(
                  Icons.my_location,
                  color: Colors.green,
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
                          color: pharmacy.hasDrug ? Colors.green : Colors.orange,
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