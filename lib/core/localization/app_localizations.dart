import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

/// App localization configuration for Ivorian market
class AppLocalizations {
  static const List<Locale> supportedLocales = [
    Locale('fr', 'CI'), // French - Côte d'Ivoire
    Locale('en', 'US'), // English
  ];

  static const Locale fallbackLocale = Locale('fr', 'CI');

  static const String assetPath = 'assets/translations';

  /// Initialize localization
  static Future<void> initialize() async {
    await EasyLocalization.ensureInitialized();
  }

  /// Get localized text
  static String translate(String key) {
    return key.tr();
  }

  /// Get pluralized text
  static String plural(String key, int value) {
    return key.plural(value);
  }
}

/// Localized app texts
class AppTexts {
  // Common
  static const String ok = 'common.ok';
  static const String cancel = 'common.cancel';
  static const String confirm = 'common.confirm';
  static const String delete = 'common.delete';
  static const String edit = 'common.edit';
  static const String save = 'common.save';
  static const String loading = 'common.loading';
  static const String error = 'common.error';
  static const String retry = 'common.retry';
  static const String search = 'common.search';
  static const String filter = 'common.filter';
  static const String clear = 'common.clear';
  static const String close = 'common.close';
  static const String back = 'common.back';
  static const String next = 'common.next';
  static const String previous = 'common.previous';
  static const String done = 'common.done';

  // Auth
  static const String login = 'auth.login';
  static const String register = 'auth.register';
  static const String logout = 'auth.logout';
  static const String email = 'auth.email';
  static const String password = 'auth.password';
  static const String forgotPassword = 'auth.forgot_password';
  static const String resetPassword = 'auth.reset_password';
  static const String createAccount = 'auth.create_account';
  static const String welcome = 'auth.welcome';
  static const String welcomeBack = 'auth.welcome_back';

  // Pharmacy
  static const String pharmacies = 'pharmacy.pharmacies';
  static const String pharmacy = 'pharmacy.pharmacy';
  static const String nearbyPharmacies = 'pharmacy.nearby_pharmacies';
  static const String pharmacyDetails = 'pharmacy.pharmacy_details';
  static const String openNow = 'pharmacy.open_now';
  static const String closed = 'pharmacy.closed';
  static const String distance = 'pharmacy.distance';
  static const String rating = 'pharmacy.rating';
  static const String call = 'pharmacy.call';
  static const String directions = 'pharmacy.directions';
  static const String hours = 'pharmacy.hours';
  static const String services = 'pharmacy.services';
  static const String delivery = 'pharmacy.delivery';
  static const String noDelivery = 'pharmacy.no_delivery';
  static const String emergency = 'pharmacy.emergency';

  // Drugs
  static const String drugs = 'drugs.drugs';
  static const String drug = 'drugs.drug';
  static const String medication = 'drugs.medication';
  static const String searchDrugs = 'drugs.search_drugs';
  static const String drugDetails = 'drugs.drug_details';
  static const String inStock = 'drugs.in_stock';
  static const String outOfStock = 'drugs.out_of_stock';
  static const String prescription = 'drugs.prescription';
  static const String noPrescription = 'drugs.no_prescription';
  static const String price = 'drugs.price';
  static const String quantity = 'drugs.quantity';
  static const String description = 'drugs.description';
  static const String dosage = 'drugs.dosage';
  static const String sideEffects = 'drugs.side_effects';

  // Reservation
  static const String reservations = 'reservation.reservations';
  static const String reservation = 'reservation.reservation';
  static const String makeReservation = 'reservation.make_reservation';
  static const String reservationDetails = 'reservation.reservation_details';
  static const String reserved = 'reservation.reserved';
  static const String pending = 'reservation.pending';
  static const String confirmed = 'reservation.confirmed';
  static const String cancelled = 'reservation.cancelled';
  static const String ready = 'reservation.ready';
  static const String pickup = 'reservation.pickup';
  static const String deliveryTime = 'reservation.delivery_time';
  static const String reservationCode = 'reservation.reservation_code';
  static const String noReservations = 'reservation.no_reservations';

  // Emergency
  static const String emergencyServices = 'emergency.emergency_services';
  static const String emergencyCall = 'emergency.emergency_call';
  static const String emergencyPharmacies = 'emergency.emergency_pharmacies';
  static const String emergencyHelp = 'emergency.emergency_help';
  static const String callEmergency = 'emergency.call_emergency';
  static const String ambulance = 'emergency.ambulance';
  static const String police = 'emergency.police';
  static const String fireDepartment = 'emergency.fire_department';
  static const String poisonControl = 'emergency.poison_control';

  // Profile
  static const String profile = 'profile.profile';
  static const String myProfile = 'profile.my_profile';
  static const String editProfile = 'profile.edit_profile';
  static const String personalInfo = 'profile.personal_info';
  static const String contactInfo = 'profile.contact_info';
  static const String address = 'profile.address';
  static const String phone = 'profile.phone';
  static const String saveChanges = 'profile.save_changes';
  static const String updateProfile = 'profile.update_profile';

  // Settings
  static const String settings = 'settings.settings';
  static const String language = 'settings.language';
  static const String theme = 'settings.theme';
  static const String notifications = 'settings.notifications';
  static const String privacy = 'settings.privacy';
  static const String terms = 'settings.terms';
  static const String about = 'settings.about';
  static const String help = 'settings.help';
  static const String contactSupport = 'settings.contact_support';

  // Map
  static const String map = 'map.map';
  static const String mapView = 'map.map_view';
  static const String satelliteView = 'map.satellite_view';
  static const String currentLocation = 'map.current_location';
  static const String searchLocation = 'map.search_location';
  static const String directionsTo = 'map.directions_to';
  static const String radius = 'map.radius';
  static const String showPharmacies = 'map.show_pharmacies';

  // Search
  static const String searchResults = 'search.search_results';
  static const String noResults = 'search.no_results';
  static const String tryAgain = 'search.try_again';
  static const String recentSearches = 'search.recent_searches';
  static const String clearHistory = 'search.clear_history';
  static const String searchBy = 'search.search_by';
  static const String searchByName = 'search.search_by_name';
  static const String searchByLocation = 'search.search_by_location';
  static const String searchByDrug = 'search.search_by_drug';

  // Messages
  static const String welcomeMessage = 'messages.welcome_message';
  static const String loginSuccess = 'messages.login_success';
  static const String logoutSuccess = 'messages.logout_success';
  static const String reservationSuccess = 'messages.reservation_success';
  static const String reservationCancelled = 'messages.reservation_cancelled';
  static const String profileUpdated = 'messages.profile_updated';
  static const String settingsSaved = 'messages.settings_saved';
  static const String errorOccurred = 'messages.error_occurred';
  static const String networkError = 'messages.network_error';
  static const String locationPermissionDenied = 'messages.location_permission_denied';
  static const String locationPermissionGranted = 'messages.location_permission_granted';
  static const String cameraPermissionDenied = 'messages.camera_permission_denied';
  static const String noInternetConnection = 'messages.no_internet_connection';
  static const String somethingWentWrong = 'messages.something_went_wrong';

  // Errors
  static const String invalidEmail = 'errors.invalid_email';
  static const String invalidPassword = 'errors.invalid_password';
  static const String emailRequired = 'errors.email_required';
  static const String passwordRequired = 'errors.password_required';
  static const String weakPassword = 'errors.weak_password';
  static const String emailAlreadyExists = 'errors.email_already_exists';
  static const String userNotFound = 'errors.user_not_found';
  static const String wrongPassword = 'errors.wrong_password';
  static const String invalidCredentials = 'errors.invalid_credentials';
  static const String sessionExpired = 'errors.session_expired';
  static const String permissionDenied = 'errors.permission_denied';
  static const String locationNotFound = 'errors.location_not_found';
  static const String pharmacyNotFound = 'errors.pharmacy_not_found';
  static const String drugNotFound = 'errors.drug_not_found';
  static const String reservationNotFound = 'errors.reservation_not_found';
  static const String insufficientStock = 'errors.insufficient_stock';
  static const String reservationFailed = 'errors.reservation_failed';
  static const String paymentFailed = 'errors.payment_failed';

  // Validation
  static const String required = 'validation.required';
  static const String mustBeEmail = 'validation.must_be_email';
  static const String mustBePhone = 'validation.must_be_phone';
  static const String tooShort = 'validation.too_short';
  static const String tooLong = 'validation.too_long';
  static const String invalidFormat = 'validation.invalid_format';
  static const String passwordMismatch = 'validation.password_mismatch';
  static const String mustBeNumber = 'validation.must_be_number';
  static const String mustBePositive = 'validation.must_be_positive';
  static const String selectOption = 'validation.select_option';
}

/// Extension for BuildContext to easily access localized strings
extension AppLocalizationsExtension on BuildContext {
  String get tr => locale.languageCode; // For easy localization
}
