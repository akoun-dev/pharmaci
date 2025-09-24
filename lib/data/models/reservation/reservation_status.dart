// Reservation status tracking
import 'package:flutter/material.dart';

enum ReservationStatus {
  pending,
  confirmed,
  readyForPickup,
  completed,
  cancelled,
  rejected,
}

extension ReservationStatusExtension on ReservationStatus {
  static ReservationStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return ReservationStatus.pending;
      case 'confirmed':
        return ReservationStatus.confirmed;
      case 'ready_for_pickup':
      case 'ready':
        return ReservationStatus.readyForPickup;
      case 'completed':
        return ReservationStatus.completed;
      case 'cancelled':
        return ReservationStatus.cancelled;
      case 'rejected':
        return ReservationStatus.rejected;
      default:
        return ReservationStatus.pending;
    }
  }

  String get displayName {
    switch (this) {
      case ReservationStatus.pending:
        return 'En attente';
      case ReservationStatus.confirmed:
        return 'Confirmée';
      case ReservationStatus.readyForPickup:
        return 'Prête à récupérer';
      case ReservationStatus.completed:
        return 'Terminée';
      case ReservationStatus.cancelled:
        return 'Annulée';
      case ReservationStatus.rejected:
        return 'Refusée';
    }
  }

  Color get color {
    switch (this) {
      case ReservationStatus.pending:
        return Colors.orange;
      case ReservationStatus.confirmed:
        return Colors.blue;
      case ReservationStatus.readyForPickup:
        return Colors.green;
      case ReservationStatus.completed:
        return Colors.grey;
      case ReservationStatus.cancelled:
      case ReservationStatus.rejected:
        return Colors.red;
    }
  }

  String get description {
    switch (this) {
      case ReservationStatus.pending:
        return 'Votre réservation est en attente de confirmation';
      case ReservationStatus.confirmed:
        return 'Votre réservation a été confirmée par la pharmacie';
      case ReservationStatus.readyForPickup:
        return 'Votre commande est prête à être récupérée';
      case ReservationStatus.completed:
        return 'Votre réservation a été terminée';
      case ReservationStatus.cancelled:
        return 'Votre réservation a été annulée';
      case ReservationStatus.rejected:
        return 'Votre réservation a été refusée';
    }
  }
}
