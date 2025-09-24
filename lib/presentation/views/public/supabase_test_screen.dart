// Test screen for Supabase connection and data fetching
import 'package:flutter/material.dart';
import 'package:pharmaci/core/services/supabase_service.dart';

class SupabaseTestScreen extends StatefulWidget {
  const SupabaseTestScreen({super.key});

  @override
  State<SupabaseTestScreen> createState() => _SupabaseTestScreenState();
}

class _SupabaseTestScreenState extends State<SupabaseTestScreen> {
  final SupabaseService _supabaseService = SupabaseService.instance;
  bool _isLoading = false;
  bool _isConnected = false;
  String _statusMessage = 'Vérification de la connexion...';
  List<Map<String, dynamic>> _drugs = [];
  List<Map<String, dynamic>> _pharmacies = [];

  @override
  void initState() {
    super.initState();
    _checkConnection();
  }

  Future<void> _checkConnection() async {
    setState(() {
      _isLoading = true;
      _statusMessage = 'Vérification de la connexion à Supabase...';
    });

    final isConnected = await _supabaseService.checkConnection();

    setState(() {
      _isLoading = false;
      _isConnected = isConnected;
      _statusMessage = isConnected
          ? 'Connexion à Supabase réussie !'
          : 'Échec de la connexion à Supabase';
    });
  }

  Future<void> _loadDrugs() async {
    setState(() {
      _isLoading = true;
      _statusMessage = 'Chargement des médicaments...';
    });

    try {
      final drugs = await _supabaseService.getDrugs(limit: 10);
      setState(() {
        _drugs = drugs;
        _isLoading = false;
        _statusMessage = '${drugs.length} médicaments chargés';
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _statusMessage = 'Erreur lors du chargement: $e';
      });
    }
  }

  Future<void> _loadPharmacies() async {
    setState(() {
      _isLoading = true;
      _statusMessage = 'Chargement des pharmacies...';
    });

    try {
      final pharmacies = await _supabaseService.getPharmacies();
      setState(() {
        _pharmacies = pharmacies;
        _isLoading = false;
        _statusMessage = '${pharmacies.length} pharmacies chargées';
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _statusMessage = 'Erreur lors du chargement: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Test Supabase - PharmaCi'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Connection status
            Card(
              color: _isConnected ? Colors.green.shade50 : Colors.red.shade50,
              child: ListTile(
                leading: Icon(
                  _isConnected ? Icons.check_circle : Icons.error,
                  color: _isConnected ? Colors.green : Colors.red,
                ),
                title: Text(
                  'État de la connexion',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text(_statusMessage),
              ),
            ),
            const SizedBox(height: 20),

            // Action buttons
            if (!_isLoading)
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _checkConnection,
                      child: const Text('Vérifier la connexion'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _loadDrugs,
                      child: const Text('Charger les médicaments'),
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 10),
            if (!_isLoading)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loadPharmacies,
                  child: const Text('Charger les pharmacies'),
                ),
              ),

            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20.0),
                  child: CircularProgressIndicator(),
                ),
              ),

            const SizedBox(height: 20),

            // Drugs list
            if (_drugs.isNotEmpty) ...[
              const Text(
                'Médicaments:',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _drugs.length,
                itemBuilder: (context, index) {
                  final drug = _drugs[index];
                  return Card(
                    child: ListTile(
                      title: Text(drug['name'] ?? 'Sans nom'),
                      subtitle: Text(
                        drug['molecule'] ?? 'Molécule inconnue',
                        style: const TextStyle(color: Colors.grey),
                      ),
                      trailing: Text(
                        '${drug['dosage'] ?? ''} ${drug['form'] ?? ''}',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                  );
                },
              ),
            ],

            const SizedBox(height: 20),

            // Pharmacies list
            if (_pharmacies.isNotEmpty) ...[
              const Text(
                'Pharmacies:',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _pharmacies.length,
                itemBuilder: (context, index) {
                  final pharmacy = _pharmacies[index];
                  return Card(
                    child: ListTile(
                      title: Text(pharmacy['name'] ?? 'Sans nom'),
                      subtitle: Text(
                        pharmacy['address'] ?? 'Adresse inconnue',
                        style: const TextStyle(color: Colors.grey),
                      ),
                      trailing: const Icon(Icons.local_pharmacy),
                    ),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}