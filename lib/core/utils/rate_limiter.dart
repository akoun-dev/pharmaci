/// Rate limiting utility for API calls
///
/// Provides comprehensive rate limiting with configurable limits for different
/// time windows (minute, hour, day). Implements sliding window algorithm for
/// accurate rate limiting and prevents abuse of API resources.
class RateLimiter {
  final Map<String, List<int>> _requestTimestamps = {};
  final int _maxRequestsPerMinute;
  final int _maxRequestsPerHour;
  final int _maxRequestsPerDay;

  RateLimiter({
    int maxRequestsPerMinute = 30,
    int maxRequestsPerHour = 300,
    int maxRequestsPerDay = 1000,
  })  : _maxRequestsPerMinute = maxRequestsPerMinute,
        _maxRequestsPerHour = maxRequestsPerHour,
        _maxRequestsPerDay = maxRequestsPerDay {
    // Validate rate limit parameters
    assert(maxRequestsPerMinute > 0, 'maxRequestsPerMinute must be positive');
    assert(maxRequestsPerHour > 0, 'maxRequestsPerHour must be positive');
    assert(maxRequestsPerDay > 0, 'maxRequestsPerDay must be positive');
    assert(maxRequestsPerMinute <= maxRequestsPerHour, 'minute limit cannot exceed hour limit');
    assert(maxRequestsPerHour <= maxRequestsPerDay, 'hour limit cannot exceed day limit');
  }

  /// Checks if a request can be made for the given identifier
  ///
  /// Evaluates all rate limits (minute, hour, day) and returns true only
  /// if all limits are satisfied. Automatically cleans up old timestamps
  /// to prevent memory leaks.
  ///
  /// Returns true if request is allowed, false if rate limited
  bool canMakeRequest(String identifier) {
    final now = DateTime.now().millisecondsSinceEpoch;
    final timestamps = _requestTimestamps.putIfAbsent(identifier, () => []);

    // Clean old timestamps
    _cleanOldTimestamps(timestamps, now);

    // Check all rate limits
    if (!_checkMinuteLimit(timestamps, now)) return false;
    if (!_checkHourLimit(timestamps, now)) return false;
    if (!_checkDayLimit(timestamps, now)) return false;

    // Add current request timestamp
    timestamps.add(now);
    return true;
  }

  /// Gets time until next allowed request in milliseconds
  /// Returns 0 if request can be made immediately
  int getTimeUntilNextRequest(String identifier) {
    final now = DateTime.now().millisecondsSinceEpoch;
    final timestamps = _requestTimestamps.putIfAbsent(identifier, () => []);

    // Clean old timestamps
    _cleanOldTimestamps(timestamps, now);

    // Check each limit and return the smallest waiting time
    final minuteWait = _getTimeUntilMinuteLimit(timestamps, now);
    final hourWait = _getTimeUntilHourLimit(timestamps, now);
    final dayWait = _getTimeUntilDayLimit(timestamps, now);

    return [minuteWait, hourWait, dayWait].where((t) => t > 0).fold(0, (a, b) => a == 0 ? b : (b == 0 ? a : a.min(b)));
  }

  /// Gets current request counts for the identifier
  Map<String, int> getRequestCounts(String identifier) {
    final now = DateTime.now().millisecondsSinceEpoch;
    final timestamps = _requestTimestamps[identifier] ?? [];

    return {
      'minute': timestamps.where((t) => now - t <= 60000).length,
      'hour': timestamps.where((t) => now - t <= 3600000).length,
      'day': timestamps.where((t) => now - t <= 86400000).length,
    };
  }

  /// Resets rate limiting for an identifier
  void reset(String identifier) {
    _requestTimestamps.remove(identifier);
  }

  /// Cleans up old timestamps
  void _cleanOldTimestamps(List<int> timestamps, int now) {
    final oneDayAgo = now - 86400000;
    timestamps.removeWhere((timestamp) => timestamp < oneDayAgo);
  }

  bool _checkMinuteLimit(List<int> timestamps, int now) {
    final oneMinuteAgo = now - 60000;
    final recentRequests = timestamps.where((t) => t >= oneMinuteAgo).length;
    return recentRequests < _maxRequestsPerMinute;
  }

  bool _checkHourLimit(List<int> timestamps, int now) {
    final oneHourAgo = now - 3600000;
    final recentRequests = timestamps.where((t) => t >= oneHourAgo).length;
    return recentRequests < _maxRequestsPerHour;
  }

  bool _checkDayLimit(List<int> timestamps, int now) {
    final oneDayAgo = now - 86400000;
    final recentRequests = timestamps.where((t) => t >= oneDayAgo).length;
    return recentRequests < _maxRequestsPerDay;
  }

  int _getTimeUntilMinuteLimit(List<int> timestamps, int now) {
    final oneMinuteAgo = now - 60000;
    final recentRequests = timestamps.where((t) => t >= oneMinuteAgo).length;

    if (recentRequests >= _maxRequestsPerMinute) {
      final oldestRecentRequest = timestamps.where((t) => t >= oneMinuteAgo).first;
      return (oldestRecentRequest + 60000) - now;
    }
    return 0;
  }

  int _getTimeUntilHourLimit(List<int> timestamps, int now) {
    final oneHourAgo = now - 3600000;
    final recentRequests = timestamps.where((t) => t >= oneHourAgo).length;

    if (recentRequests >= _maxRequestsPerHour) {
      final oldestRecentRequest = timestamps.where((t) => t >= oneHourAgo).first;
      return (oldestRecentRequest + 3600000) - now;
    }
    return 0;
  }

  int _getTimeUntilDayLimit(List<int> timestamps, int now) {
    final oneDayAgo = now - 86400000;
    final recentRequests = timestamps.where((t) => t >= oneDayAgo).length;

    if (recentRequests >= _maxRequestsPerDay) {
      final oldestRecentRequest = timestamps.where((t) => t >= oneDayAgo).first;
      return (oldestRecentRequest + 86400000) - now;
    }
    return 0;
  }
}

/// Rate limiting exception
class RateLimitExceededException implements Exception {
  final String message;
  final int retryAfter;

  const RateLimitExceededException(this.message, [this.retryAfter = 0]);

  @override
  String toString() => 'RateLimitExceededException: $message (Retry after: ${retryAfter}ms)';
}