// Find Medication screen with search field and Map/List toggle
import 'package:flutter/material.dart';
import 'package:pharmaci/core/app/theme/colors.dart';
import 'package:pharmaci/core/app/theme/text_styles.dart';
import 'package:pharmaci/core/app/routes/app_routes.dart';
import 'package:pharmaci/core/services/supabase_service.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:syncfusion_flutter_sliders/sliders.dart';

class FindMedicationScreen extends StatefulWidget {
  const FindMedicationScreen({super.key});

  @override
  State<FindMedicationScreen> createState() => _FindMedicationScreenState();
}

class _FindMedicationScreenState extends State<FindMedicationScreen> {
  int _mode = 0; // 0: map, 1: list
  final TextEditingController _controller = TextEditingController();
  GoogleMapController? _mapController;
  CameraPosition _camera = const CameraPosition(target: LatLng(5.3600, -4.0083), zoom: 12); // Abidjan
  Set<Marker> _markers = {};
  bool _loading = true;
  String? _error;
  double _radiusKm = 5;
  List<Map<String, dynamic>> _pharmacies = const [];

  @override
  void initState() {
    super.initState();
    _initLocation();
    _loadPharmacies();
  }

  Future<void> _initLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever || permission == LocationPermission.denied) return;
      final pos = await Geolocator.getCurrentPosition();
      setState(() {
        _camera = CameraPosition(target: LatLng(pos.latitude, pos.longitude), zoom: 13);
      });
      _mapController?.animateCamera(CameraUpdate.newCameraPosition(_camera));
    } catch (_) {}
  }

  Future<void> _loadPharmacies() async {
    setState(() { _loading = true; _error = null; });
    try {
      final rows = await SupabaseService.instance.getPharmacies();
      final markers = <Marker>{};
      for (final r in rows) {
        final lat = (r['latitude'] ?? r['lat'])?.toDouble();
        final lng = (r['longitude'] ?? r['lng'])?.toDouble();
        if (lat == null || lng == null) continue;
        markers.add(Marker(
          markerId: MarkerId(r['id'].toString()),
          position: LatLng(lat, lng),
          infoWindow: InfoWindow(title: r['name'] ?? 'Pharmacy', snippet: r['address'] ?? ''),
          onTap: () {},
        ));
      }
      setState(() {
        _pharmacies = rows;
        _markers = markers;
        _loading = false;
      });
    } catch (e) {
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: const Text('Find Medication'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search field
            TextField(
              controller: _controller,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search, color: AppColors.orange),
                hintText: 'Search by name or molecule',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: BorderSide.none,
                ),
              ),
              onSubmitted: (value) {
                Navigator.pushNamed(context, AppRoutes.medicationDetails,
                    arguments: value.isEmpty ? 'Paracetamol 500mg' : value);
              },
            ),
            const SizedBox(height: 16),
            // Segmented control (Map/List)
            Container(
              decoration: BoxDecoration(
                color: AppColors.gray200,
                borderRadius: BorderRadius.circular(28),
              ),
              padding: const EdgeInsets.all(6),
              child: Row(
                children: [
                  Expanded(
                    child: _SegmentButton(
                      label: 'Map',
                      selected: _mode == 0,
                      onTap: () => setState(() => _mode = 0),
                    ),
                  ),
                  Expanded(
                    child: _SegmentButton(
                      label: 'List',
                      selected: _mode == 1,
                      onTap: () => setState(() => _mode = 1),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Radius filter
            Row(
              children: [
                const Text('Radius'),
                Expanded(
                  child: SfSlider(
                    min: 1.0,
                    max: 20.0,
                    value: _radiusKm,
                    activeColor: AppColors.orange,
                    onChanged: (v) => setState(() => _radiusKm = v as double),
                  ),
                ),
                Text('${_radiusKm.toStringAsFixed(0)} km'),
              ],
            ),
            const SizedBox(height: 8),
            // Mock map box or list
            if (_mode == 0)
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  height: 320,
                  child: _loading
                      ? const Center(child: CircularProgressIndicator())
                      : GoogleMap(
                          initialCameraPosition: _camera,
                          markers: _markers,
                          onMapCreated: (c) => _mapController = c,
                          myLocationEnabled: true,
                          myLocationButtonEnabled: true,
                        ),
                ),
              )
            else
              ListView.separated(
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                itemCount: _pharmacies.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final p = _pharmacies[index];
                  return Card(
                    child: ListTile(
                      leading: const Icon(Icons.local_pharmacy),
                      title: Text(p['name'] ?? 'Pharmacy', style: AppTextStyles.titleM),
                      subtitle: Text(p['address'] ?? 'Abidjan'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => Navigator.pushNamed(
                        context,
                        AppRoutes.medicationDetails,
                        arguments: _controller.text.isEmpty
                            ? 'Paracetamol 500mg'
                            : _controller.text,
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _SegmentButton extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _SegmentButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AppColors.orange : Colors.transparent,
          borderRadius: BorderRadius.circular(24),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppColors.gray700,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}
