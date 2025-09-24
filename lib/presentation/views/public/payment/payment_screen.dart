import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/payment_provider.dart';
import '../../../providers/reservation_provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../domain/entities/payment_entity.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/error_widget.dart';
import '../../widgets/payment/payment_method_card.dart';
import '../../widgets/payment/payment_summary.dart';
import '../../widgets/payment/payment_success_dialog.dart';

class PaymentScreen extends StatefulWidget {
  final String reservationId;
  final double amount;
  final String pharmacyName;

  const PaymentScreen({
    super.key,
    required this.reservationId,
    required this.amount,
    required this.pharmacyName,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  PaymentMethod? _selectedMethod;
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paiement'),
        elevation: 0,
      ),
      body: Consumer3<PaymentProvider, ReservationProvider, AuthProvider>(
        builder: (context, paymentProvider, reservationProvider, authProvider, child) {
          if (paymentProvider.isLoading) {
            return const LoadingWidget();
          }

          if (paymentProvider.errorMessage != null) {
            return CustomErrorWidget(
              message: paymentProvider.errorMessage!,
              onRetry: () => paymentProvider.clearError(),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                PaymentSummary(
                  amount: widget.amount,
                  pharmacyName: widget.pharmacyName,
                  reservationId: widget.reservationId,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Méthode de paiement',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                _buildPaymentMethods(),
                const SizedBox(height: 24),
                if (paymentProvider.currentPayment != null) ...[
                  _buildPaymentStatus(paymentProvider.currentPayment!),
                  const SizedBox(height: 24),
                ],
                _buildPayButton(paymentProvider, authProvider),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPaymentMethods() {
    final mobileMethods = [
      PaymentMethod.orangeMoney,
      PaymentMethod.mtnMoney,
      PaymentMethod.wave,
    ];

    final otherMethods = [
      PaymentMethod.creditCard,
      PaymentMethod.bankTransfer,
      PaymentMethod.cash,
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Mobile Money',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: mobileMethods.map((method) {
            return PaymentMethodCard(
              method: method,
              isSelected: _selectedMethod == method,
              onTap: () {
                setState(() {
                  _selectedMethod = method;
                });
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        const Text(
          'Autres méthodes',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: otherMethods.map((method) {
            return PaymentMethodCard(
              method: method,
              isSelected: _selectedMethod == method,
              onTap: () {
                setState(() {
                  _selectedMethod = method;
                });
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildPaymentStatus(PaymentEntity payment) {
    Color statusColor;
    String statusText;

    switch (payment.status) {
      case PaymentStatus.pending:
        statusColor = Colors.orange;
        statusText = 'En attente';
        break;
      case PaymentStatus.processing:
        statusColor = Colors.blue;
        statusText = 'En traitement';
        break;
      case PaymentStatus.succeeded:
        statusColor = Colors.green;
        statusText = 'Succès';
        break;
      case PaymentStatus.failed:
        statusColor = Colors.red;
        statusText = 'Échoué';
        break;
      case PaymentStatus.canceled:
        statusColor = Colors.grey;
        statusText = 'Annulé';
        break;
      case PaymentStatus.refunded:
        statusColor = Colors.purple;
        statusText = 'Remboursé';
        break;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: statusColor),
      ),
      child: Row(
        children: [
          Icon(
            payment.status == PaymentStatus.succeeded
                ? Icons.check_circle
                : payment.status == PaymentStatus.failed
                    ? Icons.error
                    : Icons.hourglass_empty,
            color: statusColor,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Statut: $statusText',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
                if (payment.transactionId != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Transaction: ${payment.transactionId}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPayButton(PaymentProvider paymentProvider, AuthProvider authProvider) {
    if (_selectedMethod == null) {
      return const SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton(
          onPressed: null,
          child: Text('Sélectionnez une méthode de paiement'),
        ),
      );
    }

    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: _isProcessing ? null : () => _processPayment(paymentProvider, authProvider),
        child: _isProcessing
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation(Colors.white),
                  ),
                  SizedBox(width: 16),
                  Text('Traitement en cours...'),
                ],
              )
            : const Text('Payer'),
      ),
    );
  }

  Future<void> _processPayment(PaymentProvider paymentProvider, AuthProvider authProvider) async {
    if (authProvider.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vous devez être connecté pour payer')),
      );
      return;
    }

    setState(() {
      _isProcessing = true;
    });

    try {
      await paymentProvider.processPayment(
        reservationId: widget.reservationId,
        userId: authProvider.user!.id,
        amount: widget.amount,
        method: _selectedMethod!,
        metadata: {
          'pharmacy_name': widget.pharmacyName,
          'payment_method': _selectedMethod!.label,
        },
      );

      if (paymentProvider.currentPayment?.isSuccessful == true) {
        _showPaymentSuccessDialog();
      } else if (paymentProvider.currentPayment?.isFailed == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Le paiement a échoué. Veuillez réessayer.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: ${e.toString()}')),
      );
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  void _showPaymentSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => PaymentSuccessDialog(
        payment: Provider.of<PaymentProvider>(context, listen: false).currentPayment!,
        onContinue: () {
          Navigator.pop(context);
          Navigator.pop(context);
        },
      ),
    );
  }
}