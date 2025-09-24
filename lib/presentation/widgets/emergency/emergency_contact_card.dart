import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import '../../../domain/entities/pharmacy_entity.dart';
import '../../../core/accessibility/app_accessibility.dart';
import '../../../core/design_system/components/app_cards.dart';
import '../../../core/design_system/components/app_buttons.dart';
import '../../../core/design_system/tokens/app_colors.dart';
import '../../../core/design_system/tokens/app_spacing.dart';
import '../../../core/design_system/tokens/app_text_styles.dart';

class EmergencyContactCard extends StatelessWidget {
  final PharmacyEntity pharmacy;
  final VoidCallback onCall;
  final VoidCallback onDirections;
  final int index;

  const EmergencyContactCard({
    super.key,
    required this.pharmacy,
    required this.onCall,
    required this.onDirections,
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    return AnimationConfiguration.staggeredList(
      position: index,
      duration: const Duration(milliseconds: 375),
      child: SlideAnimation(
        verticalOffset: 50.0,
        child: FadeInAnimation(
          child: AppCards.basic(
            onTap: () => _showPharmacyDetails(context),
            margin: EdgeInsets.only(bottom: AppSpacing.medium),
            showShadow: true,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPharmacyHeader(),
                SizedBox(height: AppSpacing.medium),
                _buildActionButtons(),
                if (pharmacy.phone.isNotEmpty) ...[
                  SizedBox(height: AppSpacing.small),
                  _buildContactInfo(),
                ],
                if (pharmacy.openingHours != null) ...[
                  SizedBox(height: AppSpacing.small),
                  _buildOpeningHours(),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPharmacyHeader() {
    return Row(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: pharmacy.isOpen ? AppColors.open.withValues(alpha: 0.2) : AppColors.closed.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
            border: Border.all(
              color: pharmacy.isOpen ? AppColors.open : AppColors.closed,
              width: 2,
            ),
          ),
          child: Icon(
            Icons.local_pharmacy,
            color: pharmacy.isOpen ? AppColors.open : AppColors.closed,
            size: 28,
          ),
        ),
        SizedBox(width: AppSpacing.medium),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppAccessibility.accessibleText(
                text: pharmacy.name,
                style: AppTextStyles.pharmacyName,
                semanticsLabel: 'Pharmacie ${pharmacy.name}',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: AppSpacing.xSmall),
              Row(
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                  SizedBox(width: AppSpacing.xSmall),
                  Expanded(
                    child: AppAccessibility.accessibleText(
                      text: pharmacy.address,
                      style: AppTextStyles.body2,
                      semanticsLabel: 'Adresse: ${pharmacy.address}',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              SizedBox(height: AppSpacing.xSmall),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.small,
                      vertical: AppSpacing.xSmall,
                    ),
                    decoration: BoxDecoration(
                      color: pharmacy.isOpen ? AppColors.open.withValues(alpha: 0.1) : AppColors.closed.withValues(alpha: 0.1),
                      borderRadius: AppSpacing.borderRadiusSmall,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          pharmacy.isOpen ? Icons.access_time : Icons.access_time_filled,
                          color: pharmacy.isOpen ? AppColors.open : AppColors.closed,
                          size: 14,
                        ),
                        SizedBox(width: AppSpacing.xSmall),
                        AppAccessibility.accessibleText(
                          text: pharmacy.isOpen ? 'Ouvert' : 'Fermé',
                          style: TextStyle(
                            color: pharmacy.isOpen ? AppColors.open : AppColors.closed,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (pharmacy.distance > 0) ...[
                    const Spacer(),
                    AppAccessibility.accessibleText(
                      text: '${pharmacy.distance.toStringAsFixed(1)} km',
                      style: AppTextStyles.body2.copyWith(
                        fontWeight: FontWeight.w500,
                        color: AppColors.primary,
                      ),
                      semanticsLabel: 'Distance: ${pharmacy.distance.toStringAsFixed(1)} kilomètres',
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: AppButtons.primary(
            text: 'Appeler',
            onPressed: onCall,
            icon: Icon(Icons.call),
            backgroundColor: AppColors.open,
          ),
        ),
        SizedBox(width: AppSpacing.small),
        Expanded(
          child: AppButtons.secondary(
            text: 'Itinéraire',
            onPressed: onDirections,
            icon: Icon(Icons.directions),
          ),
        ),
      ],
    );
  }

  Widget _buildContactInfo() {
    return Row(
      children: [
        Icon(
          Icons.phone_outlined,
          size: 16,
          color: AppColors.textSecondary,
        ),
        SizedBox(width: AppSpacing.xSmall),
        AppAccessibility.accessibleText(
          text: pharmacy.phone,
          style: AppTextStyles.body2,
          semanticsLabel: 'Numéro de téléphone: ${pharmacy.phone}',
        ),
      ],
    );
  }

  Widget _buildOpeningHours() {
    return Row(
      children: [
        Icon(
          Icons.schedule_outlined,
          size: 16,
          color: AppColors.textSecondary,
        ),
        SizedBox(width: AppSpacing.xSmall),
        Expanded(
          child: AppAccessibility.accessibleText(
            text: pharmacy.openingHours!,
            style: AppTextStyles.caption,
            semanticsLabel: 'Horaires d\'ouverture: ${pharmacy.openingHours}',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  void _showPharmacyDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusLarge)),
        ),
        padding: EdgeInsets.all(AppSpacing.large),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Détails de la pharmacie',
                  style: AppTextStyles.headline6,
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            SizedBox(height: AppSpacing.medium),
            Text(
              pharmacy.name,
              style: AppTextStyles.pharmacyName,
            ),
            SizedBox(height: AppSpacing.small),
            Text(
              pharmacy.address,
              style: AppTextStyles.body2,
            ),
            SizedBox(height: AppSpacing.small),
            if (pharmacy.phone.isNotEmpty) ...[
              Text(
                'Téléphone: ${pharmacy.phone}',
                style: AppTextStyles.body2,
              ),
              SizedBox(height: AppSpacing.small),
            ],
            if (pharmacy.openingHours != null) ...[
              Text(
                'Horaires: ${pharmacy.openingHours}',
                style: AppTextStyles.body2,
              ),
              SizedBox(height: AppSpacing.small),
            ],
            if (pharmacy.distance > 0) ...[
              Text(
                'Distance: ${pharmacy.distance.toStringAsFixed(1)} km',
                style: AppTextStyles.body2,
              ),
              SizedBox(height: AppSpacing.medium),
            ],
            Row(
              children: [
                Expanded(
                  child: AppButtons.primary(
                    text: 'Appeler',
                    onPressed: () {
                      Navigator.pop(context);
                      onCall();
                    },
                    icon: Icon(Icons.call),
                  ),
                ),
                SizedBox(width: AppSpacing.small),
                Expanded(
                  child: AppButtons.secondary(
                    text: 'Itinéraire',
                    onPressed: () {
                      Navigator.pop(context);
                      onDirections();
                    },
                    icon: Icon(Icons.directions),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}