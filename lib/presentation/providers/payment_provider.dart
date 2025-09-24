import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../domain/entities/payment_entity.dart';

class PaymentProvider with ChangeNotifier {
  final SupabaseClient _supabase = Supabase.instance.client;

  List<PaymentEntity> _payments = [];
  PaymentEntity? _currentPayment;
  bool _isLoading = false;
  String? _errorMessage;

  List<PaymentEntity> get payments => _payments;
  PaymentEntity? get currentPayment => _currentPayment;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> processPayment({
    required String reservationId,
    required String userId,
    required double amount,
    required PaymentMethod method,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final payment = PaymentEntity(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        reservationId: reservationId,
        userId: userId,
        amount: amount,
        currency: 'XOF',
        method: method,
        status: PaymentStatus.pending,
        createdAt: DateTime.now(),
        metadata: metadata,
      );

      await _supabase.from('payments').insert(payment.toJson());

      _currentPayment = payment;

      await _processPaymentWithProvider(payment);

      _payments.add(_currentPayment!);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Erreur lors du traitement du paiement: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> _processPaymentWithProvider(PaymentEntity payment) async {
    await Future.delayed(const Duration(seconds: 2));

    final isSuccess = await _simulatePaymentProcessing(payment);

    if (isSuccess) {
      _currentPayment = payment.copyWith(
        status: PaymentStatus.succeeded,
        processedAt: DateTime.now(),
        transactionId: 'TXN_${DateTime.now().millisecondsSinceEpoch}',
      );
    } else {
      _currentPayment = payment.copyWith(
        status: PaymentStatus.failed,
        processedAt: DateTime.now(),
        failureReason: 'Erreur de traitement',
      );
    }

    await _supabase
        .from('payments')
        .update(_currentPayment!.toJson())
        .eq('id', payment.id);

    await _updateReservationStatus(payment.reservationId, _currentPayment!.status);
  }

  Future<bool> _simulatePaymentProcessing(PaymentEntity payment) async {
    await Future.delayed(const Duration(seconds: 1));

    switch (payment.method) {
      case PaymentMethod.mobileMoney:
      case PaymentMethod.orangeMoney:
      case PaymentMethod.mtnMoney:
      case PaymentMethod.wave:
        return await _processMobileMoneyPayment(payment);
      case PaymentMethod.creditCard:
        return await _processCreditCardPayment(payment);
      case PaymentMethod.bankTransfer:
        return await _processBankTransfer(payment);
      case PaymentMethod.cash:
        return true;
    }
  }

  Future<bool> _processMobileMoneyPayment(PaymentEntity payment) async {
    await Future.delayed(const Duration(seconds: 2));
    return true;
  }

  Future<bool> _processCreditCardPayment(PaymentEntity payment) async {
    await Future.delayed(const Duration(seconds: 1));
    return true;
  }

  Future<bool> _processBankTransfer(PaymentEntity payment) async {
    await Future.delayed(const Duration(seconds: 3));
    return true;
  }

  Future<void> _updateReservationStatus(String reservationId, PaymentStatus status) async {
    String reservationStatus;
    switch (status) {
      case PaymentStatus.succeeded:
        reservationStatus = 'confirmed';
        break;
      case PaymentStatus.failed:
        reservationStatus = 'payment_failed';
        break;
      case PaymentStatus.canceled:
        reservationStatus = 'cancelled';
        break;
      default:
        reservationStatus = 'pending_payment';
    }

    await _supabase
        .from('reservations')
        .update({'status': reservationStatus})
        .eq('id', reservationId);
  }

  Future<void> loadUserPayments(String userId) async {
    try {
      _isLoading = true;
      notifyListeners();

      final response = await _supabase
          .from('payments')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      _payments = response
          .map((json) => PaymentEntity.fromJson(json))
          .toList();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Erreur lors du chargement des paiements: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> refundPayment(String paymentId) async {
    try {
      _isLoading = true;
      notifyListeners();

      final payment = _payments.firstWhere((p) => p.id == paymentId);

      final refundedPayment = payment.copyWith(
        status: PaymentStatus.refunded,
        processedAt: DateTime.now(),
      );

      await _supabase
          .from('payments')
          .update(refundedPayment.toJson())
          .eq('id', paymentId);

      final index = _payments.indexWhere((p) => p.id == paymentId);
      if (index != -1) {
        _payments[index] = refundedPayment;
      }

      await _updateReservationStatus(payment.reservationId, PaymentStatus.refunded);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Erreur lors du remboursement: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> cancelPayment(String paymentId) async {
    try {
      _isLoading = true;
      notifyListeners();

      final payment = _payments.firstWhere((p) => p.id == paymentId);

      final canceledPayment = payment.copyWith(
        status: PaymentStatus.canceled,
        processedAt: DateTime.now(),
      );

      await _supabase
          .from('payments')
          .update(canceledPayment.toJson())
          .eq('id', paymentId);

      final index = _payments.indexWhere((p) => p.id == paymentId);
      if (index != -1) {
        _payments[index] = canceledPayment;
      }

      await _updateReservationStatus(payment.reservationId, PaymentStatus.canceled);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Erreur lors de l\'annulation: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> checkPaymentStatus(String paymentId) async {
    try {
      _isLoading = true;
      notifyListeners();

      final response = await _supabase
          .from('payments')
          .select()
          .eq('id', paymentId)
          .single();

      final payment = PaymentEntity.fromJson(response);

      final index = _payments.indexWhere((p) => p.id == paymentId);
      if (index != -1) {
        _payments[index] = payment;
      }

      if (_currentPayment?.id == paymentId) {
        _currentPayment = payment;
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Erreur lors de la vérification: ${e.toString()}';
      notifyListeners();
    }
  }

  void clearCurrentPayment() {
    _currentPayment = null;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  double getTotalPaidAmount(String userId) {
    final successfulPayments = _payments
        .where((p) => p.userId == userId && p.isSuccessful)
        .toList();

    return successfulPayments.fold(0, (sum, payment) => sum + payment.amount);
  }

  List<PaymentEntity> getPaymentsByMethod(PaymentMethod method) {
    return _payments.where((p) => p.method == method).toList();
  }

  List<PaymentEntity> getRecentPayments({int limit = 10}) {
    return _payments.take(limit).toList();
  }
}