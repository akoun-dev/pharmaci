import 'package:equatable/equatable.dart';

class PaymentEntity extends Equatable {
  final String id;
  final String reservationId;
  final String userId;
  final double amount;
  final String currency;
  final PaymentMethod method;
  final PaymentStatus status;
  final DateTime createdAt;
  final DateTime? processedAt;
  final String? transactionId;
  final String? receiptUrl;
  final String? failureReason;
  final Map<String, dynamic>? metadata;

  const PaymentEntity({
    required this.id,
    required this.reservationId,
    required this.userId,
    required this.amount,
    required this.currency,
    required this.method,
    required this.status,
    required this.createdAt,
    this.processedAt,
    this.transactionId,
    this.receiptUrl,
    this.failureReason,
    this.metadata,
  });

  @override
  List<Object?> get props => [
        id,
        reservationId,
        userId,
        amount,
        currency,
        method,
        status,
        createdAt,
        processedAt,
        transactionId,
        receiptUrl,
        failureReason,
        metadata,
      ];

  PaymentEntity copyWith({
    String? id,
    String? reservationId,
    String? userId,
    double? amount,
    String? currency,
    PaymentMethod? method,
    PaymentStatus? status,
    DateTime? createdAt,
    DateTime? processedAt,
    String? transactionId,
    String? receiptUrl,
    String? failureReason,
    Map<String, dynamic>? metadata,
  }) {
    return PaymentEntity(
      id: id ?? this.id,
      reservationId: reservationId ?? this.reservationId,
      userId: userId ?? this.userId,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      method: method ?? this.method,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      processedAt: processedAt ?? this.processedAt,
      transactionId: transactionId ?? this.transactionId,
      receiptUrl: receiptUrl ?? this.receiptUrl,
      failureReason: failureReason ?? this.failureReason,
      metadata: metadata ?? this.metadata,
    );
  }

  factory PaymentEntity.fromJson(Map<String, dynamic> json) {
    return PaymentEntity(
      id: json['id'],
      reservationId: json['reservation_id'],
      userId: json['user_id'],
      amount: (json['amount'] as num).toDouble(),
      currency: json['currency'],
      method: PaymentMethod.fromString(json['method']),
      status: PaymentStatus.fromString(json['status']),
      createdAt: DateTime.parse(json['created_at']),
      processedAt: json['processed_at'] != null
          ? DateTime.parse(json['processed_at'])
          : null,
      transactionId: json['transaction_id'],
      receiptUrl: json['receipt_url'],
      failureReason: json['failure_reason'],
      metadata: json['metadata'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reservation_id': reservationId,
      'user_id': userId,
      'amount': amount,
      'currency': currency,
      'method': method.name,
      'status': status.name,
      'created_at': createdAt.toIso8601String(),
      'processed_at': processedAt?.toIso8601String(),
      'transaction_id': transactionId,
      'receipt_url': receiptUrl,
      'failure_reason': failureReason,
      'metadata': metadata,
    };
  }

  bool get isSuccessful => status == PaymentStatus.succeeded;
  bool get isPending => status == PaymentStatus.pending;
  bool get isFailed => status == PaymentStatus.failed;
}

enum PaymentMethod {
  mobileMoney('Mobile Money'),
  orangeMoney('Orange Money'),
  mtnMoney('MTN Money'),
  wave('Wave'),
  creditCard('Carte bancaire'),
  bankTransfer('Virement bancaire'),
  cash('Espèces');

  const PaymentMethod(this.label);
  final String label;

  static PaymentMethod fromString(String method) {
    switch (method.toLowerCase()) {
      case 'mobile_money':
        return PaymentMethod.mobileMoney;
      case 'orange_money':
        return PaymentMethod.orangeMoney;
      case 'mtn_money':
        return PaymentMethod.mtnMoney;
      case 'wave':
        return PaymentMethod.wave;
      case 'credit_card':
        return PaymentMethod.creditCard;
      case 'bank_transfer':
        return PaymentMethod.bankTransfer;
      case 'cash':
        return PaymentMethod.cash;
      default:
        return PaymentMethod.mobileMoney;
    }
  }
}

enum PaymentStatus {
  pending('En attente'),
  processing('En traitement'),
  succeeded('Succès'),
  failed('Échoué'),
  canceled('Annulé'),
  refunded('Remboursé');

  const PaymentStatus(this.label);
  final String label;

  static PaymentStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return PaymentStatus.pending;
      case 'processing':
        return PaymentStatus.processing;
      case 'succeeded':
        return PaymentStatus.succeeded;
      case 'failed':
        return PaymentStatus.failed;
      case 'canceled':
        return PaymentStatus.canceled;
      case 'refunded':
        return PaymentStatus.refunded;
      default:
        return PaymentStatus.pending;
    }
  }
}