import 'package:flutter/material.dart';
import 'package:pharmaci/core/design_system/tokens/app_colors.dart';
import 'package:pharmaci/core/design_system/tokens/app_spacing.dart';
import 'package:pharmaci/core/design_system/tokens/app_text_styles.dart';
import 'package:pharmaci/core/animations/micro_interactions.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// Enhanced pharmacy card with micro-interactions
class EnhancedPharmacyCard extends StatefulWidget {
  final String name;
  final String address;
  final double distance;
  final double rating;
  final bool isOpen;
  final bool hasDelivery;
  final String? phone;
  final String? imageUrl;
  final VoidCallback? onTap;
  final VoidCallback? onCall;
  final VoidCallback? onDirections;

  const EnhancedPharmacyCard({
    super.key,
    required this.name,
    required this.address,
    required this.distance,
    required this.rating,
    required this.isOpen,
    this.hasDelivery = false,
    this.phone,
    this.imageUrl,
    this.onTap,
    this.onCall,
    this.onDirections,
  });

  @override
  State<EnhancedPharmacyCard> createState() => _EnhancedPharmacyCardState();
}

class _EnhancedPharmacyCardState extends State<EnhancedPharmacyCard> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.02).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => _controller.forward(),
      onExit: (_) => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: InteractiveCard(
              onTap: widget.onTap,
              elevation: 4,
              margin: AppSpacing.marginSmall,
              padding: EdgeInsets.zero,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Pharmacy image with loading states
                  _buildImageSection(),
                  Padding(
                    padding: AppSpacing.paddingMedium,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildHeaderSection(),
                        const SizedBox(height: 12),
                        _buildLocationSection(),
                        const SizedBox(height: 12),
                        _buildStatusBadges(),
                        const SizedBox(height: 12),
                        _buildActionButtons(),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildImageSection() {
    return Stack(
      children: [
        SizedBox(
          height: 140,
          width: double.infinity,
          child: ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: CachedNetworkImage(
              imageUrl: widget.imageUrl ?? '',
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                color: Colors.grey[300],
                child: const Center(
                  child: CircularProgressIndicator(),
                ),
              ),
              errorWidget: (context, url, error) => Container(
                color: Colors.grey[300],
                child: const Icon(
                  Icons.storefront,
                  size: 48,
                  color: Colors.grey,
                ),
              ),
            ),
          ),
        ),
        // Status overlay
        Positioned(
          top: 12,
          right: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: widget.isOpen ? AppColors.success : AppColors.error,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  widget.isOpen ? Icons.access_time : Icons.access_time_filled,
                  color: Colors.white,
                  size: 14,
                ),
                const SizedBox(width: 4),
                Text(
                  widget.isOpen ? 'Ouvert' : 'Fermé',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHeaderSection() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.name,
                style: AppTextStyles.headline6.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    Icons.star,
                    color: AppColors.warning,
                    size: 16,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    widget.rating.toStringAsFixed(1),
                    style: AppTextStyles.bodyMedium,
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    Icons.location_on,
                    color: AppColors.primary,
                    size: 16,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${widget.distance.toStringAsFixed(1)} km',
                    style: AppTextStyles.bodyMedium,
                  ),
                ],
              ),
            ],
          ),
        ),
        if (widget.hasDelivery)
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.delivery_dining,
              color: AppColors.primary,
              size: 20,
            ),
          ),
      ],
    );
  }

  Widget _buildLocationSection() {
    return Row(
      children: [
        Icon(
          Icons.location_on_outlined,
          color: AppColors.onSurface.withValues(alpha: 0.6),
          size: 16,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            widget.address,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurface.withValues(alpha: 0.8),
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadges() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        if (widget.hasDelivery)
          _buildBadge('Livraison', AppColors.primary),
        if (widget.isOpen)
          _buildBadge('Ouvert maintenant', AppColors.success),
        if (widget.rating >= 4.5)
          _buildBadge('Top rated', AppColors.warning),
      ],
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        text,
        style: AppTextStyles.labelSmall.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        if (widget.phone != null) ...[
          Expanded(
            child: InteractiveButton(
              onPressed: widget.onCall,
              backgroundColor: AppColors.success,
              height: 40,
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.call, size: 16),
                  SizedBox(width: 4),
                  Text('Appeler'),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
        Expanded(
          child: InteractiveButton(
            onPressed: widget.onDirections,
            backgroundColor: AppColors.primary,
            height: 40,
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.directions, size: 16),
                SizedBox(width: 4),
                Text('Itinéraire'),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Enhanced drug card with micro-interactions
class EnhancedDrugCard extends StatefulWidget {
  final String name;
  final String? description;
  final double? price;
  final bool? inStock;
  final bool? prescriptionRequired;
  final String? imageUrl;
  final VoidCallback? onTap;
  final VoidCallback? onReserve;

  const EnhancedDrugCard({
    super.key,
    required this.name,
    this.description,
    this.price,
    this.inStock = true,
    this.prescriptionRequired = false,
    this.imageUrl,
    this.onTap,
    this.onReserve,
  });

  @override
  State<EnhancedDrugCard> createState() => _EnhancedDrugCardState();
}

class _EnhancedDrugCardState extends State<EnhancedDrugCard> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.02).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => _controller.forward(),
      onExit: (_) => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: InteractiveCard(
              onTap: widget.onTap,
              elevation: 2,
              margin: AppSpacing.marginSmall,
              child: Row(
                children: [
                  // Drug image
                  _buildDrugImage(),
                  const SizedBox(width: 16),
                  // Drug information
                  Expanded(
                    child: _buildDrugInfo(),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDrugImage() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: widget.imageUrl != null
          ? CachedNetworkImage(
              imageUrl: widget.imageUrl!,
              fit: BoxFit.cover,
              placeholder: (context, url) => const Center(
                child: CircularProgressIndicator(),
              ),
              errorWidget: (context, url, error) => const Icon(
                Icons.medication,
                size: 32,
                color: Colors.grey,
              ),
            )
          : const Icon(
              Icons.medication,
              size: 32,
              color: Colors.grey,
            ),
    );
  }

  Widget _buildDrugInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                widget.name,
                style: AppTextStyles.headline6.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (widget.prescriptionRequired == true)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Ordonnance',
                  style: AppTextStyles.labelSmall.copyWith(
                    color: AppColors.warning,
                    fontSize: 10,
                  ),
                ),
              ),
          ],
        ),
        if (widget.description != null) ...[
          const SizedBox(height: 4),
          Text(
            widget.description!,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurface.withValues(alpha: 0.7),
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        const SizedBox(height: 8),
        Row(
          children: [
            if (widget.price != null) ...[
              Text(
                '${widget.price!.toStringAsFixed(2)} FCFA',
                style: AppTextStyles.headline6.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 12),
            ],
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: widget.inStock == true
                    ? AppColors.success.withValues(alpha: 0.1)
                    : AppColors.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                widget.inStock == true ? 'En stock' : 'Rupture',
                style: AppTextStyles.labelSmall.copyWith(
                  color: widget.inStock == true ? AppColors.success : AppColors.error,
                ),
              ),
            ),
          ],
        ),
        if (widget.onReserve != null && widget.inStock == true) ...[
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: InteractiveButton(
              onPressed: widget.onReserve,
              backgroundColor: AppColors.primary,
              height: 32,
              child: const Text('Réserver'),
            ),
          ),
        ],
      ],
    );
  }
}

/// Interactive list tile with enhanced features
class EnhancedListTile extends StatefulWidget {
  final Widget leading;
  final Widget title;
  final Widget? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final bool selected;
  final Color? selectedColor;
  final EdgeInsetsGeometry? contentPadding;

  const EnhancedListTile({
    super.key,
    required this.leading,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.onLongPress,
    this.selected = false,
    this.selectedColor,
    this.contentPadding,
  });

  @override
  State<EnhancedListTile> createState() => _EnhancedListTileState();
}

class _EnhancedListTileState extends State<EnhancedListTile> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.98).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      onTap: widget.onTap,
      onLongPress: widget.onLongPress,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Container(
              decoration: BoxDecoration(
                color: widget.selected
                    ? (widget.selectedColor ?? AppColors.primary.withValues(alpha: 0.1))
                    : null,
                borderRadius: BorderRadius.circular(8),
              ),
              child: ListTile(
                leading: widget.leading,
                title: widget.title,
                subtitle: widget.subtitle,
                trailing: widget.trailing,
                contentPadding: widget.contentPadding,
                selected: widget.selected,
                selectedTileColor: Colors.transparent,
              ),
            ),
          );
        },
      ),
    );
  }
}