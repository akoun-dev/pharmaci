// Supabase service for database operations
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  static SupabaseService get instance => _instance;
  SupabaseService._internal();

  final SupabaseClient _client = Supabase.instance.client;

  // Get the Supabase client for direct usage
  SupabaseClient get client => _client;

  // Check connection
  Future<bool> checkConnection() async {
    try {
      await _client.from('profiles').select('id').limit(1);
      return true;
    } catch (e) {
      print('Supabase connection error: $e');
      return false;
    }
  }

  // User operations
  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final user = _client.auth.currentUser;
      if (user != null) {
        return {
          'id': user.id,
          'email': user.email,
          'metadata': user.userMetadata,
        };
      }
      return null;
    } catch (e) {
      print('Error getting current user: $e');
      return null;
    }
  }

  // Drug operations
  Future<List<Map<String, dynamic>>> getDrugs({
    String? searchQuery,
    int? limit,
    int? offset,
  }) async {
    try {
      dynamic query = _client.from('drugs').select('*');

      if (searchQuery != null && searchQuery.isNotEmpty) {
        query = query.or('name.ilike.%$searchQuery%,molecule.ilike.%$searchQuery%');
      }

      if (limit != null) {
        query = query.limit(limit);
      }

      if (offset != null) {
        query = query.range(offset, offset + (limit ?? 20) - 1);
      }

      final response = await query;
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error fetching drugs: $e');
      return [];
    }
  }

  // Pharmacy operations
  Future<List<Map<String, dynamic>>> getPharmacies({
    double? latitude,
    double? longitude,
    double? radius,
    String? city,
  }) async {
    try {
      var query = _client.from('pharmacies').select('*');

      if (city != null && city.isNotEmpty) {
        query = query.eq('city', city);
      }

      final response = await query;
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error fetching pharmacies: $e');
      return [];
    }
  }

  // Stock operations
  Future<List<Map<String, dynamic>>> getPharmacyStock(String pharmacyId) async {
    try {
      final response = await _client
          .from('pharmacy_stocks')
          .select('*, drugs(*)')
          .eq('pharmacy_id', pharmacyId)
          .eq('is_active', true)
          .gt('quantity', 0);

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error fetching pharmacy stock: $e');
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> searchDrugsInPharmacies({
    required String drugQuery,
    double? latitude,
    double? longitude,
    double? radius,
  }) async {
    try {
      // First find the drug
      final drugs = await getDrugs(searchQuery: drugQuery, limit: 1);
      if (drugs.isEmpty) return [];

      final drugId = drugs.first['id'];

      // Find pharmacies with this drug in stock
      final response = await _client
          .from('pharmacy_stocks')
          .select('*, pharmacies(*), drugs(*)')
          .eq('drug_id', drugId)
          .eq('is_active', true)
          .gt('quantity', 0);

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error searching drugs in pharmacies: $e');
      return [];
    }
  }

  // Reservation operations
  Future<Map<String, dynamic>?> createReservation({
    required String userId,
    required String pharmacyId,
    required String drugId,
    required int quantity,
    String? notes,
  }) async {
    try {
      // Get drug price
      final stockResponse = await _client
          .from('pharmacy_stocks')
          .select('price')
          .eq('pharmacy_id', pharmacyId)
          .eq('drug_id', drugId)
          .single();

      final totalPrice = (stockResponse['price'] as num) * quantity;

      final response = await _client.from('reservations').insert({
        'user_id': userId,
        'pharmacy_id': pharmacyId,
        'drug_id': drugId,
        'quantity': quantity,
        'total_price': totalPrice,
        'status': 'pending',
        'notes': notes,
        'created_at': DateTime.now().toIso8601String(),
      }).select().single();

      return response;
    } catch (e) {
      print('Error creating reservation: $e');
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getUserReservations(String userId) async {
    try {
      final response = await _client
          .from('reservations')
          .select('*, pharmacies(*), drugs(*)')
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error fetching user reservations: $e');
      return [];
    }
  }

  // Helper method to check if a table exists
  Future<bool> tableExists(String tableName) async {
    try {
      await _client.from(tableName).select('count').limit(1);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Pharmacy reservations (for pharmacists)
  Future<List<Map<String, dynamic>>> getPharmacyReservations(String pharmacyId) async {
    try {
      final response = await _client
          .from('reservations')
          .select('*, pharmacies(*), drugs(*)')
          .eq('pharmacy_id', pharmacyId)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error fetching pharmacy reservations: $e');
      return [];
    }
  }

  Future<bool> updateReservationStatus({
    required String reservationId,
    required String status, // e.g., 'pending' | 'ready' | 'picked' | 'cancelled'
  }) async {
    try {
      await _client
          .from('reservations')
          .update({'status': status})
          .eq('id', reservationId);
      return true;
    } catch (e) {
      print('Error updating reservation status: $e');
      return false;
    }
  }
}
