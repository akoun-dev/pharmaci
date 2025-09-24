// Application route definitions
import 'package:pharmaci/presentation/views/public/home_screen.dart';
import 'package:pharmaci/presentation/views/public/search/drug_search_screen.dart';
import 'package:pharmaci/presentation/views/public/search/search_results_screen.dart';
import 'package:pharmaci/presentation/views/public/supabase_test_screen.dart';
import 'package:pharmaci/presentation/views/auth/login_screen.dart';
import 'package:pharmaci/presentation/views/auth/role_selection.dart';
import 'package:pharmaci/presentation/views/pharmacy/dashboard/pharmacy_dashboard.dart';
import 'package:pharmaci/presentation/views/public/find_medication_screen.dart';
import 'package:pharmaci/presentation/views/public/medication_details_screen.dart';
import 'package:pharmaci/presentation/views/public/reservation_confirmation_screen.dart';
import 'package:pharmaci/presentation/views/account/account_screen.dart';
import 'package:pharmaci/presentation/views/public/public_main_shell.dart';
import 'package:pharmaci/presentation/views/pharmacy/pharmacy_main_shell.dart';
import 'package:pharmaci/presentation/views/pharmacy/reservations/manage_reservations_screen.dart';
import 'package:pharmaci/presentation/views/pharmacy/inventory/update_stock_screen.dart';

class AppRoutes {
  static const String home = '/';
  static const String publicMain = '/public';
  static const String pharmacyMain = '/pharmacy';
  static const String drugSearch = '/drug-search';
  static const String searchResults = '/search-results';
  static const String supabaseTest = '/supabase-test';
  static const String login = '/login';
  static const String roleSelection = '/role-selection';
  static const String pharmacyDashboard = '/pharmacy-dashboard';
  static const String findMedication = '/find-medication';
  static const String medicationDetails = '/medication-details';
  static const String reservationConfirmation = '/reservation-confirmation';
  static const String account = '/account';
  static const String updateStock = '/update-stock';
  static const String manageReservations = '/manage-reservations';

  static final routes = {
    home: (context) => const HomeScreen(),
    publicMain: (context) => const PublicMainShell(),
    pharmacyMain: (context) => const PharmacyMainShell(),
    findMedication: (context) => const FindMedicationScreen(),
    medicationDetails: (context) => const MedicationDetailsScreen(),
    reservationConfirmation: (context) => const ReservationConfirmationScreen(),
    account: (context) => const AccountScreen(),
    updateStock: (context) => const UpdateStockScreen(),
    manageReservations: (context) => const ManageReservationsScreen(),
    drugSearch: (context) => const DrugSearchScreen(),
    searchResults: (context) => const SearchResultsScreen(),
    supabaseTest: (context) => const SupabaseTestScreen(),
    login: (context) => const LoginScreen(),
    roleSelection: (context) => const RoleSelection(),
    pharmacyDashboard: (context) => const PharmacyDashboard(),
  };
}
