import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:location/location.dart' as loc;
import '../../core/utils/error_handler.dart';
import '../../core/utils/logger.dart';
import '../../core/exceptions/app_exceptions.dart';

class LocationProvider with ChangeNotifier {
  Position? _currentLocation;
  bool _isLoading = false;
  String? _error;
  LocationPermission? _permission;

  Position? get currentLocation => _currentLocation;
  bool get isLoading => _isLoading;
  String? get error => _error;
  LocationPermission? get permission => _permission;

  Future<void> checkPermission() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await SecureLogger.instance.info('Checking location permissions',
        screen: 'LocationProvider',
      );

      _permission = await Geolocator.checkPermission();
      if (_permission == LocationPermission.denied) {
        _permission = await Geolocator.requestPermission();
      }

      await SecureLogger.instance.info('Location permission checked',
        context: {'permission': _permission?.toString()},
        screen: 'LocationProvider',
      );
    } catch (e, stackTrace) {
      final exception = ExceptionHelper.from(e);
      _error = ExceptionHelper.getUserMessage(exception);

      await ErrorHandler.instance.handleError(
        exception,
        stackTrace: stackTrace,
        screen: 'LocationProvider',
        action: 'checkPermission',
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> getCurrentLocation() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await SecureLogger.instance.info('Getting current location',
        screen: 'LocationProvider',
      );

      await checkPermission();

      if (_permission == LocationPermission.denied ||
          _permission == LocationPermission.deniedForever) {
        _error = 'Location permission denied';

        await SecureLogger.instance.warning('Location permission denied',
          context: {'permission': _permission?.toString()},
          screen: 'LocationProvider',
        );

        _isLoading = false;
        notifyListeners();
        return;
      }

      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Request to enable location services
        loc.Location location = loc.Location();
        serviceEnabled = await location.requestService();

        if (!serviceEnabled) {
          _error = 'Location services are disabled';

          await SecureLogger.instance.warning('Location services disabled',
            screen: 'LocationProvider',
          );

          _isLoading = false;
          notifyListeners();
          return;
        }
      }

      _currentLocation = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      await SecureLogger.instance.info('Location retrieved successfully',
        context: {
          'latitude': _currentLocation?.latitude,
          'longitude': _currentLocation?.longitude,
          'accuracy': _currentLocation?.accuracy,
        },
        screen: 'LocationProvider',
      );
    } catch (e, stackTrace) {
      final exception = ExceptionHelper.from(e);
      _error = ExceptionHelper.getUserMessage(exception);

      await ErrorHandler.instance.handleError(
        exception,
        stackTrace: stackTrace,
        screen: 'LocationProvider',
        action: 'getCurrentLocation',
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> enableBackgroundMode() async {
    try {
      await SecureLogger.instance.info('Enabling background location mode',
        screen: 'LocationProvider',
      );

      loc.Location location = loc.Location();
      await location.enableBackgroundMode(enable: true);

      await SecureLogger.instance.info('Background location mode enabled',
        screen: 'LocationProvider',
      );
    } catch (e, stackTrace) {
      final exception = ExceptionHelper.from(e);
      _error = ExceptionHelper.getUserMessage(exception);

      await ErrorHandler.instance.handleError(
        exception,
        stackTrace: stackTrace,
        screen: 'LocationProvider',
        action: 'enableBackgroundMode',
      );

      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void clearLocation() {
    _currentLocation = null;
    notifyListeners();
  }
}
