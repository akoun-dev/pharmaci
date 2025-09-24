import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:collection';

/// Lazy loading utilities for optimizing app performance
class LazyLoader {
  static final LazyLoader _instance = LazyLoader._internal();
  factory LazyLoader() => _instance;
  LazyLoader._internal();

  final Map<String, bool> _loadingStates = {};
  final Map<String, List<VoidCallback>> _pendingCallbacks = {};
  final Map<String, Completer<dynamic>> _activeLoaders = {};
  final int _maxConcurrentLoads = 3;
  final Queue<String> _loadingQueue = Queue();

  /// Load data with lazy loading and deduplication
  Future<T> loadWithLazyLoading<T>(
    String key,
    Future<T> Function() loader, {
    Duration? timeout,
    bool forceReload = false,
  }) async {
    if (!forceReload && _activeLoaders.containsKey(key)) {
      return await _activeLoaders[key]!.future as T;
    }

    if (!forceReload && _loadingStates[key] == true) {
      final completer = Completer<T>();
      _pendingCallbacks[key] ??= [];
      _pendingCallbacks[key]!.add(() {
        loadWithLazyLoading<T>(key, loader, forceReload: forceReload)
            .then(completer.complete)
            .catchError(completer.completeError);
      });
      return await completer.future;
    }

    final completer = Completer<T>();
    _activeLoaders[key] = completer;

    if (_getActiveLoadCount() >= _maxConcurrentLoads) {
      _loadingQueue.add(key);
    } else {
      _executeLoad<T>(key, loader, completer, timeout: timeout);
    }

    return await completer.future;
  }

  /// Execute load with queue management
  void _executeLoad<T>(
    String key,
    Future<T> Function() loader,
    Completer<T> completer, {
    Duration? timeout,
  }) {
    _loadingStates[key] = true;

    Future<T> loadFuture = loader();

    if (timeout != null) {
      loadFuture = loadFuture.timeout(timeout);
    }

    loadFuture.then((result) {
      completer.complete(result);
      _onLoadComplete(key);
    }).catchError((error) {
      completer.completeError(error);
      _onLoadComplete(key);
    });
  }

  /// Handle load completion
  void _onLoadComplete(String key) {
    _loadingStates.remove(key);
    _activeLoaders.remove(key);

    // Execute pending callbacks
    final callbacks = _pendingCallbacks.remove(key);
    if (callbacks != null) {
      for (final callback in callbacks) {
        callback();
      }
    }

    // Process queue
    if (_loadingQueue.isNotEmpty) {
      final nextKey = _loadingQueue.removeFirst();
      if (_activeLoaders.containsKey(nextKey)) {
        final nextCompleter = _activeLoaders[nextKey]!;
        _executeLoad(nextKey, () async {
          // This will be handled by the original loader
          return await nextCompleter.future;
        }, nextCompleter);
      }
    }
  }

  /// Get count of active loaders
  int _getActiveLoadCount() {
    return _activeLoaders.length;
  }

  /// Cancel loading for specific key
  void cancelLoading(String key) {
    final completer = _activeLoaders[key];
    if (completer != null && !completer.isCompleted) {
      completer.completeError('Loading cancelled');
    }
    _loadingStates.remove(key);
    _activeLoaders.remove(key);
    _pendingCallbacks.remove(key);
  }

  /// Cancel all pending loads
  void cancelAllLoading() {
    for (final key in List<String>.from(_activeLoaders.keys)) {
      cancelLoading(key);
    }
    _loadingQueue.clear();
  }

  /// Get loading status
  bool isLoading(String key) {
    return _loadingStates[key] == true || _activeLoaders.containsKey(key);
  }

  /// Get queue status
  Map<String, dynamic> getQueueStatus() {
    return {
      'active_loads': _activeLoaders.length,
      'pending_callbacks': _pendingCallbacks.length,
      'queue_size': _loadingQueue.length,
      'max_concurrent': _maxConcurrentLoads,
    };
  }
}

/// Lazy loading widget for images
class LazyImage extends StatefulWidget {
  final String imageUrl;
  final Widget? placeholder;
  final Widget? errorWidget;
  final double? width;
  final double? height;
  final BoxFit fit;
  final Duration fadeInDuration;
  final String? cacheKey;
  final bool preloadNext;
  final List<String>? nextImagesToPreload;

  const LazyImage({
    super.key,
    required this.imageUrl,
    this.placeholder,
    this.errorWidget,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.fadeInDuration = const Duration(milliseconds: 300),
    this.cacheKey,
    this.preloadNext = false,
    this.nextImagesToPreload,
  });

  @override
  State<LazyImage> createState() => _LazyImageState();
}

class _LazyImageState extends State<LazyImage> {
  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _loadImage();
  }

  @override
  void didUpdateWidget(LazyImage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.imageUrl != widget.imageUrl) {
      _loadImage();
    }
  }

  Future<void> _loadImage() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _hasError = false;
    });

    try {
      // Simulate lazy loading delay
      await Future.delayed(const Duration(milliseconds: 100));

      // In a real app, you would load the image data here
      // For now, we'll simulate it
      await Future.delayed(const Duration(milliseconds: 500));

      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = false;
        });

        if (widget.preloadNext && widget.nextImagesToPreload != null) {
          _preloadNextImages();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
        });
      }
    }
  }

  void _preloadNextImages() {
    if (widget.nextImagesToPreload == null) return;

    for (final imageUrl in widget.nextImagesToPreload!) {
      if (imageUrl != widget.imageUrl) {
        // Preload next image
        Future.delayed(
          Duration(milliseconds: widget.nextImagesToPreload!.indexOf(imageUrl) * 200),
          () {
            // Preload logic here
          },
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return widget.placeholder ?? _buildDefaultPlaceholder();
    }

    if (_hasError) {
      return widget.errorWidget ?? _buildDefaultErrorWidget();
    }

    return AnimatedSwitcher(
      duration: widget.fadeInDuration,
      child: _buildImageWidget(),
    );
  }

  Widget _buildDefaultPlaceholder() {
    return Container(
      width: widget.width,
      height: widget.height,
      decoration: BoxDecoration(
        color: Colors.grey[300],
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Center(
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(Colors.grey),
        ),
      ),
    );
  }

  Widget _buildDefaultErrorWidget() {
    return Container(
      width: widget.width,
      height: widget.height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Icon(
        Icons.broken_image,
        color: Colors.grey,
        size: 32,
      ),
    );
  }

  Widget _buildImageWidget() {
    // In a real app, use CachedNetworkImage or similar
    return Image.network(
      widget.imageUrl,
      width: widget.width,
      height: widget.height,
      fit: widget.fit,
      frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
        if (wasSynchronouslyLoaded) return child;

        return AnimatedOpacity(
          opacity: frame == null ? 0 : 1,
          duration: widget.fadeInDuration,
          child: child,
        );
      },
      errorBuilder: (context, error, stackTrace) {
        return widget.errorWidget ?? _buildDefaultErrorWidget();
      },
    );
  }
}

/// Lazy list widget for efficient large list rendering
class LazyListView<T> extends StatefulWidget {
  final List<T> items;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final Future<List<T>> Function()? onLoadMore;
  final Widget? loadingWidget;
  final Widget? errorWidget;
  final Widget? emptyWidget;
  final ScrollController? scrollController;
  final double loadThreshold;
  final int pageSize;

  const LazyListView({
    super.key,
    required this.items,
    required this.itemBuilder,
    this.onLoadMore,
    this.loadingWidget,
    this.errorWidget,
    this.emptyWidget,
    this.scrollController,
    this.loadThreshold = 200.0,
    this.pageSize = 20,
  });

  @override
  State<LazyListView<T>> createState() => _LazyListViewState<T>();
}

class _LazyListViewState<T> extends State<LazyListView<T>> {
  late ScrollController _scrollController;
  bool _isLoading = false;
  bool _hasError = false;
  bool _hasMore = true;
  List<T> _visibleItems = [];

  @override
  void initState() {
    super.initState();
    _scrollController = widget.scrollController ?? ScrollController();
    _visibleItems = widget.items.take(widget.pageSize).toList();
    _scrollController.addListener(_onScroll);
  }

  @override
  void didUpdateWidget(LazyListView<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.items != widget.items) {
      _updateVisibleItems();
    }
  }

  @override
  void dispose() {
    if (widget.scrollController == null) {
      _scrollController.dispose();
    }
    super.dispose();
  }

  void _updateVisibleItems() {
    setState(() {
      _visibleItems = widget.items.take(widget.pageSize).toList();
    });
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - widget.loadThreshold) {
      _loadMoreItems();
    }
  }

  Future<void> _loadMoreItems() async {
    if (_isLoading || !_hasMore || widget.onLoadMore == null) return;

    setState(() {
      _isLoading = true;
      _hasError = false;
    });

    try {
      final newItems = await widget.onLoadMore!();

      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasMore = newItems.isNotEmpty;
          _visibleItems.addAll(newItems);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
        });
      }
    }
  }

  void _retryLoad() {
    setState(() {
      _hasError = false;
    });
    _loadMoreItems();
  }

  @override
  Widget build(BuildContext context) {
    if (_visibleItems.isEmpty && widget.items.isEmpty) {
      return widget.emptyWidget ?? _buildDefaultEmptyWidget();
    }

    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            itemCount: _visibleItems.length + (_hasMore ? 1 : 0),
            itemBuilder: (context, index) {
              if (index < _visibleItems.length) {
                return widget.itemBuilder(context, _visibleItems[index], index);
              }

              if (_hasError) {
                return _buildErrorWidget();
              }

              return _buildLoadingWidget();
            },
          ),
        ),
        if (_isLoading && _visibleItems.isNotEmpty)
          _buildLoadingWidget(),
      ],
    );
  }

  Widget _buildDefaultEmptyWidget() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox_outlined, size: 64),
          SizedBox(height: 16),
          Text('No items found'),
        ],
      ),
    );
  }

  Widget _buildLoadingWidget() {
    return widget.loadingWidget ??
        const Padding(
          padding: EdgeInsets.all(16),
          child: Center(
            child: CircularProgressIndicator(),
          ),
        );
  }

  Widget _buildErrorWidget() {
    return widget.errorWidget ??
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const Text('Failed to load more items'),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: _retryLoad,
                child: const Text('Retry'),
              ),
            ],
          ),
        );
  }
}

/// Visibility-based lazy loading widget
class VisibilityLazyLoader extends StatefulWidget {
  final Widget child;
  final Widget? placeholder;
  final double? width;
  final double? height;
  final Future<void> Function()? onLoad;
  final bool once;

  const VisibilityLazyLoader({
    super.key,
    required this.child,
    this.placeholder,
    this.width,
    this.height,
    this.onLoad,
    this.once = true,
  });

  @override
  State<VisibilityLazyLoader> createState() => _VisibilityLazyLoaderState();
}

class _VisibilityLazyLoaderState extends State<VisibilityLazyLoader> {
  bool _isVisible = false;
  bool _hasLoaded = false;

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
      key: widget.key ?? UniqueKey(),
      onVisibilityChanged: (visibilityInfo) {
        if (visibilityInfo.visibleFraction > 0.5 && !_isVisible) {
          _setVisible();
        }
      },
      child: _isVisible ? widget.child : _buildPlaceholder(),
    );
  }

  void _setVisible() async {
    if (!mounted) return;

    setState(() {
      _isVisible = true;
    });

    if (widget.onLoad != null && (!widget.once || !_hasLoaded)) {
      await widget.onLoad!();
      _hasLoaded = true;
    }
  }

  Widget _buildPlaceholder() {
    return widget.placeholder ??
        Container(
          width: widget.width,
          height: widget.height,
          color: Colors.grey[300],
          child: const Center(
            child: CircularProgressIndicator(
              strokeWidth: 2,
            ),
          ),
        );
  }
}

/// Simple visibility detector widget
class VisibilityDetector extends StatefulWidget {
  final Widget child;
  final Function(VisibilityInfo) onVisibilityChanged;

  const VisibilityDetector({
    required Key key,
    required this.child,
    required this.onVisibilityChanged,
  }) : super(key: key);

  @override
  State<VisibilityDetector> createState() => _VisibilityDetectorState();
}

class _VisibilityDetectorState extends State<VisibilityDetector> {
  bool _hasNotified = false;

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        _checkVisibility();
        return false;
      },
      child: widget.child,
    );
  }

  void _checkVisibility() {
    if (!mounted || _hasNotified) return;

    final renderObject = context.findRenderObject();
    if (renderObject is RenderBox) {
      final position = renderObject.localToGlobal(Offset.zero);
      final size = renderObject.size;
      final screenHeight = MediaQuery.of(context).size.height;

      final visibleFraction = _calculateVisibleFraction(
        position,
        size,
        screenHeight,
      );

      widget.onVisibilityChanged(VisibilityInfo(visibleFraction));

      if (visibleFraction > 0.5) {
        _hasNotified = true;
      }
    }
  }

  double _calculateVisibleFraction(Offset position, Size size, double screenHeight) {
    final top = position.dy;
    final bottom = top + size.height;

    if (bottom < 0 || top > screenHeight) {
      return 0.0;
    }

    final visibleTop = top.clamp(0.0, screenHeight);
    final visibleBottom = bottom.clamp(0.0, screenHeight);
    final visibleHeight = visibleBottom - visibleTop;

    return visibleHeight / size.height;
  }
}

/// Visibility information class
class VisibilityInfo {
  final double visibleFraction;

  VisibilityInfo(this.visibleFraction);
}