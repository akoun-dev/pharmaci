import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTextStyles {
  // Font weights
  static const FontWeight light = FontWeight.w300;
  static const FontWeight regular = FontWeight.w400;
  static const FontWeight medium = FontWeight.w500;
  static const FontWeight semiBold = FontWeight.w600;
  static const FontWeight bold = FontWeight.w700;
  static const FontWeight extraBold = FontWeight.w800;

  // Text styles
  static TextStyle get headline1 => GoogleFonts.poppins(
    fontSize: 32,
    fontWeight: bold,
    color: AppColors.textPrimary,
    height: 1.2,
  );

  static TextStyle get headline2 => GoogleFonts.poppins(
    fontSize: 28,
    fontWeight: bold,
    color: AppColors.textPrimary,
    height: 1.3,
  );

  static TextStyle get headline3 => GoogleFonts.poppins(
    fontSize: 24,
    fontWeight: semiBold,
    color: AppColors.textPrimary,
    height: 1.3,
  );

  static TextStyle get headline4 => GoogleFonts.poppins(
    fontSize: 20,
    fontWeight: semiBold,
    color: AppColors.textPrimary,
    height: 1.4,
  );

  static TextStyle get headline5 => GoogleFonts.poppins(
    fontSize: 18,
    fontWeight: medium,
    color: AppColors.textPrimary,
    height: 1.4,
  );

  static TextStyle get headline6 => GoogleFonts.poppins(
    fontSize: 16,
    fontWeight: medium,
    color: AppColors.textPrimary,
    height: 1.4,
  );

  static TextStyle get subtitle1 => GoogleFonts.poppins(
    fontSize: 16,
    fontWeight: regular,
    color: AppColors.textPrimary,
    height: 1.5,
  );

  static TextStyle get subtitle2 => GoogleFonts.poppins(
    fontSize: 14,
    fontWeight: medium,
    color: AppColors.textSecondary,
    height: 1.4,
  );

  static TextStyle get body1 => GoogleFonts.poppins(
    fontSize: 16,
    fontWeight: regular,
    color: AppColors.textPrimary,
    height: 1.5,
  );

  static TextStyle get body2 => GoogleFonts.poppins(
    fontSize: 14,
    fontWeight: regular,
    color: AppColors.textSecondary,
    height: 1.4,
  );

  static TextStyle get button => GoogleFonts.poppins(
    fontSize: 14,
    fontWeight: medium,
    color: AppColors.onPrimary,
    height: 1.2,
  );

  static TextStyle get caption => GoogleFonts.poppins(
    fontSize: 12,
    fontWeight: regular,
    color: AppColors.textSecondary,
    height: 1.3,
  );

  static TextStyle get overline => GoogleFonts.poppins(
    fontSize: 10,
    fontWeight: regular,
    color: AppColors.textDisabled,
    height: 1.2,
    letterSpacing: 1.5,
  );

  // Colored text styles
  static TextStyle get primary => body1.copyWith(
    color: AppColors.primary,
    fontWeight: medium,
  );

  static TextStyle get secondary => body1.copyWith(
    color: AppColors.secondary,
    fontWeight: medium,
  );

  static TextStyle get error => body1.copyWith(
    color: AppColors.error,
    fontWeight: medium,
  );

  static TextStyle get success => body1.copyWith(
    color: AppColors.success,
    fontWeight: medium,
  );

  static TextStyle get warning => body1.copyWith(
    color: AppColors.warning,
    fontWeight: medium,
  );

  // Special text styles
  static TextStyle get pharmacyName => GoogleFonts.poppins(
    fontSize: 16,
    fontWeight: semiBold,
    color: AppColors.textPrimary,
    height: 1.4,
  );

  static TextStyle get drugName => GoogleFonts.poppins(
    fontSize: 15,
    fontWeight: medium,
    color: AppColors.textPrimary,
    height: 1.4,
  );

  static TextStyle get price => GoogleFonts.poppins(
    fontSize: 18,
    fontWeight: bold,
    color: AppColors.primary,
    height: 1.3,
  );

  static TextStyle get statusOpen => GoogleFonts.poppins(
    fontSize: 12,
    fontWeight: medium,
    color: AppColors.open,
    height: 1.3,
  );

  static TextStyle get statusClosed => GoogleFonts.poppins(
    fontSize: 12,
    fontWeight: medium,
    color: AppColors.closed,
    height: 1.3,
  );

  static TextStyle get statusLimited => GoogleFonts.poppins(
    fontSize: 12,
    fontWeight: medium,
    color: AppColors.limited,
    height: 1.3,
  );

  // Map styles
  static TextStyle get mapMarkerTitle => GoogleFonts.poppins(
    fontSize: 12,
    fontWeight: semiBold,
    color: AppColors.textPrimary,
    height: 1.2,
  );

  static TextStyle get mapMarkerSubtitle => GoogleFonts.poppins(
    fontSize: 10,
    fontWeight: regular,
    color: AppColors.textSecondary,
    height: 1.2,
  );

  // Accessibility styles
  static TextStyle get accessibilityLarge => body1.copyWith(
    fontSize: 18,
    fontWeight: regular,
  );

  static TextStyle get accessibilityExtraLarge => body1.copyWith(
    fontSize: 20,
    fontWeight: regular,
  );

  // Responsive text styles
  static TextStyle responsive(BuildContext context, TextStyle textStyle) {
    final scaleFactor = MediaQuery.of(context).textScaler.scale(1.0);
    return textStyle.copyWith(
      fontSize: textStyle.fontSize! * scaleFactor,
    );
  }

  // Custom styles with parameters
  static TextStyle custom({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? height,
    double? letterSpacing,
  }) {
    return GoogleFonts.poppins(
      fontSize: fontSize ?? 14,
      fontWeight: fontWeight ?? regular,
      color: color ?? AppColors.textPrimary,
      height: height ?? 1.4,
      letterSpacing: letterSpacing,
    );
  }
}