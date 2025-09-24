import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:synchronized/synchronized.dart';
import 'package:collection/collection.dart';

/// Cache manager for optimizing app performance
class CacheManager {
  static final CacheManager _instance = CacheManager._internal();
  factory CacheManager() => _instance;
  CacheManager._internal();

  final Lock _lock = Lock();
  final Map<String, DateTime> _cacheTimestamps = {};
  final Map<String, dynamic> _memoryCache = {};
  final Duration _defaultCacheDuration = const Duration(hours: 1);

  /// Initialize cache manager
  Future<void> initialize() async {
    await _loadCacheTimestamps();
    _performPeriodicCleanup();
  }

  /// Load cache timestamps from persistent storage
  Future<void> _loadCacheTimestamps() async {
    final prefs = await SharedPreferences.getInstance();
    final timestamps = prefs.getString('cache_timestamps');

    if (timestamps != null) {
      final Map<String, dynamic> decoded = Map<String, dynamic>.from(
        Map<String, dynamic>.fromIterable(
          timestamps.split(','),
          key: (item) => item.split(':')[0],
          value: (item) => DateTime.parse(item.split(':')[1]),
        ),
      );
      _cacheTimestamps.addAll(decoded.map((key, value) => MapEntry(key, value as DateTime)));
    }
  }

  /// Save cache timestamps to persistent storage
  Future<void> _saveCacheTimestamps() async {
    final prefs = await SharedPreferences.getInstance();
    final timestamps = _cacheTimestamps.entries
        .map((entry) => '${entry.key}:${entry.value.toIso8601String()}')
        .join(',');
    await prefs.setString('cache_timestamps', timestamps);
  }

  /// Perform periodic cleanup of expired cache entries
  void _performPeriodicCleanup() {
    Future.delayed(const Duration(minutes: 30), () {
      cleanupExpiredCache();
      _performPeriodicCleanup();
    });
  }

  /// Store data in cache with optional custom duration
  Future<void> set<T>(
    String key,
    T data, {
    Duration? duration,
  }) async {
    await _lock.synchronized(() async {
      final expiryTime = DateTime.now().add(duration ?? _defaultCacheDuration);

      _memoryCache[key] = data;
      _cacheTimestamps[key] = expiryTime;

      await _saveCacheTimestamps();
    });
  }

  /// Retrieve data from cache
  Future<T?> get<T>(String key) async {
    return await _lock.synchronized(() async {
      if (!_cacheTimestamps.containsKey(key)) {
        return null;
      }

      final expiryTime = _cacheTimestamps[key]!;
      if (DateTime.now().isAfter(expiryTime)) {
        await remove(key);
        return null;
      }

      return _memoryCache[key] as T?;
    });
  }

  /// Remove specific cache entry
  Future<void> remove(String key) async {
    await _lock.synchronized(() async {
      _memoryCache.remove(key);
      _cacheTimestamps.remove(key);
      await _saveCacheTimestamps();
    });
  }

  /// Clear all cache entries
  Future<void> clear() async {
    await _lock.synchronized(() async {
      _memoryCache.clear();
      _cacheTimestamps.clear();
      await _saveCacheTimestamps();

      // Clear image cache
      await _clearImageCache();
    });
  }

  /// Clear expired cache entries
  Future<void> cleanupExpiredCache() async {
    await _lock.synchronized(() async {
      final now = DateTime.now();
      final expiredKeys = <String>[];

      for (final entry in _cacheTimestamps.entries) {
        if (now.isAfter(entry.value)) {
          expiredKeys.add(entry.key);
        }
      }

      for (final key in expiredKeys) {
        await remove(key);
      }
    });
  }

  /// Get cache statistics
  Future<Map<String, dynamic>> getCacheStats() async {
    await _lock.synchronized(() async {
      final now = DateTime.now();
      int validEntries = 0;
      int expiredEntries = 0;

      for (final entry in _cacheTimestamps.entries) {
        if (now.isAfter(entry.value)) {
          expiredEntries++;
        } else {
          validEntries++;
        }
      }

      return {
        'total_entries': _cacheTimestamps.length,
        'valid_entries': validEntries,
        'expired_entries': expiredEntries,
        'memory_usage': _getMemoryUsage(),
      };
    });
  }

  /// Get memory usage estimate
  String _getMemoryUsage() {
    final size = _memoryCache.toString().length;
    if (size < 1024) return '${size}B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(1)}KB';
    return '${(size / (1024 * 1024)).toStringAsFixed(1)}MB';
  }

  /// Clear image cache
  Future<void> _clearImageCache() async {
    await CachedNetworkImage.evictFromCache('');
    // Note: DefaultCacheManager would need to be imported separately
  }

  /// Preload images for better performance
  Future<void> preloadImages(List<String> imageUrls) async {
    final futures = imageUrls.map((url) =>
      CachedNetworkImageProvider(url).resolve(ImageConfiguration.empty)
    );

    // Wait for image streams to complete (simplified approach)
    for (final future in futures) {
      future.addListener(ImageStreamListener((_, __) {}));
    }
  }

  /// Check if cache entry exists and is valid
  Future<bool> exists(String key) async {
    return await _lock.synchronized(() async {
      if (!_cacheTimestamps.containsKey(key)) return false;

      final expiryTime = _cacheTimestamps[key]!;
      if (DateTime.now().isAfter(expiryTime)) {
        await remove(key);
        return false;
      }

      return true;
    });
  }

  /// Get remaining time for cache entry
  Duration? getRemainingTime(String key) {
    if (!_cacheTimestamps.containsKey(key)) return null;

    final expiryTime = _cacheTimestamps[key]!;
    final remaining = expiryTime.difference(DateTime.now());

    return remaining.isNegative ? null : remaining;
  }

  /// Extend cache duration for existing entry
  Future<void> extendDuration(
    String key, {
    Duration? additionalDuration,
  }) async {
    await _lock.synchronized(() async {
      if (!_cacheTimestamps.containsKey(key)) return;

      final currentExpiry = _cacheTimestamps[key]!;
      final newExpiry = additionalDuration != null
          ? currentExpiry.add(additionalDuration)
          : DateTime.now().add(_defaultCacheDuration);

      _cacheTimestamps[key] = newExpiry;
      await _saveCacheTimestamps();
    });
  }
}

/// Specialized cache for API responses
class ApiCacheManager {
  static final ApiCacheManager _instance = ApiCacheManager._internal();
  factory ApiCacheManager() => _instance;
  ApiCacheManager._internal();

  final CacheManager _cacheManager = CacheManager();
  final Map<String, List<String>> _dependentKeys = {};

  /// Cache API response with dependency tracking
  Future<void> setApiResponse(
    String endpoint,
    dynamic data, {
    Duration? duration,
    List<String>? dependencies,
  }) async {
    final key = 'api_$endpoint';
    await _cacheManager.set(key, data, duration: duration);

    if (dependencies != null) {
      _dependentKeys[key] = dependencies;
    }
  }

  /// Get cached API response
  Future<T?> getApiResponse<T>(String endpoint) async {
    final key = 'api_$endpoint';
    return await _cacheManager.get<T>(key);
  }

  /// Invalidate API response and dependent caches
  Future<void> invalidateApiResponse(String endpoint) async {
    final key = 'api_$endpoint';
    await _cacheManager.remove(key);

    // Invalidate dependent caches
    final dependencies = _dependentKeys[key];
    if (dependencies != null) {
      for (final dependency in dependencies) {
        await invalidateApiResponse(dependency);
      }
      _dependentKeys.remove(key);
    }
  }

  /// Clear all API caches
  Future<void> clearAllApiCache() async {
    _dependentKeys.clear();
    await _cacheManager.clear();
  }
}

/// Image cache optimization utilities
class ImageCacheOptimizer {
  static final ImageCacheOptimizer _instance = ImageCacheOptimizer._internal();
  factory ImageCacheOptimizer() => _instance;
  ImageCacheOptimizer._internal();

  final Map<String, bool> _loadingImages = {};

  /// Get optimized image provider with caching
  CachedNetworkImageProvider getOptimizedImageProvider(
    String url, {
    double? width,
    double? height,
    BoxFit fit = BoxFit.cover,
    String? cacheKey,
  }) {
    final key = cacheKey ?? url;
    final effectiveKey = width != null && height != null
        ? '${key}_${width.toInt()}_${height.toInt()}'
        : key;

    return CachedNetworkImageProvider(
      url,
      cacheKey: effectiveKey,
      maxHeight: height?.toInt(),
      maxWidth: width?.toInt(),
    );
  }

  /// Preload images with priority
  Future<void> preloadWithPriority(
    List<String> imageUrls, {
    List<int>? priorities,
  }) async {
    final priorityMap = <String, int>{};

    if (priorities != null && priorities.length == imageUrls.length) {
      for (int i = 0; i < imageUrls.length; i++) {
        priorityMap[imageUrls[i]] = priorities[i];
      }
    }

    // Sort by priority (higher number = higher priority)
    final sortedUrls = List<String>.from(imageUrls)
      ..sort((a, b) => (priorityMap[b] ?? 0).compareTo(priorityMap[a] ?? 0));

    // Load images in batches
    const batchSize = 3;
    for (int i = 0; i < sortedUrls.length; i += batchSize) {
      final batch = sortedUrls.skip(i).take(batchSize).toList();
      await Future.wait(
        batch.map((url) => _loadSingleImage(url)),
      );

      // Small delay between batches
      if (i + batchSize < sortedUrls.length) {
        await Future.delayed(const Duration(milliseconds: 100));
      }
    }
  }

  /// Load single image with error handling
  Future<void> _loadSingleImage(String url) async {
    if (_loadingImages[url] == true) return;

    _loadingImages[url] = true;

    try {
      final provider = CachedNetworkImageProvider(url);
      await provider.resolve(ImageConfiguration.empty);
    } catch (e) {
      debugPrint('Failed to preload image: $url, error: $e');
    } finally {
      _loadingImages.remove(url);
    }
  }

  /// Get cached image size
  Future<Size?> getCachedImageSize(String url) async {
    try {
      final provider = CachedNetworkImageProvider(url);
      final imageStream = provider.resolve(ImageConfiguration.empty);

      final completer = Completer<Size?>();

      ImageStreamListener? listener;
      listener = ImageStreamListener(
        (image, synchronousCall) {
          completer.complete(Size(
            image.image.width.toDouble(),
            image.image.height.toDouble(),
          ));
          imageStream.removeListener(listener!);
        },
        onError: (exception, stackTrace) {
          completer.complete(null);
          imageStream.removeListener(listener!);
        },
      );

      imageStream.addListener(listener);
      return await completer.future;
    } catch (e) {
      return null;
    }
  }

  /// Clear image cache for specific URL
  Future<void> clearImageCache(String url) async {
    await CachedNetworkImage.evictFromCache(url);
  }

  /// Clear all image cache
  Future<void> clearAllImageCache() async {
    await CachedNetworkImage.evictFromCache('');
    // Note: DefaultCacheManager would need to be imported separately
  }
}