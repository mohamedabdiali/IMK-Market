class TrackingEvent {
  final String id;
  final String status;
  final String title;
  final String message;
  final String? location;
  final String? source;
  final DateTime eventAt;

  TrackingEvent({
    required this.id,
    required this.status,
    required this.title,
    required this.message,
    required this.eventAt,
    this.location,
    this.source,
  });

  factory TrackingEvent.fromJson(Map<String, dynamic> json) {
    return TrackingEvent(
      id: (json['id'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      location: json['location']?.toString(),
      source: json['source']?.toString(),
      eventAt:
          DateTime.tryParse((json['eventAt'] ?? '').toString()) ??
          DateTime.now(),
    );
  }
}

class OrderTrackingResult {
  final String id;
  final String status;
  final String paymentStatus;
  final double total;
  final String? cargoType;
  final String? trackingNumber;
  final String? trackingCarrier;
  final String? trackingUrl;
  final String? currentLocation;
  final DateTime? estimatedDelivery;
  final DateTime? shippedAt;
  final DateTime? deliveredAt;
  final DateTime? lastTrackingUpdate;
  final DateTime createdAt;
  final double progress;
  final List<TrackingEvent> events;
  final String? supportEmail;
  final String? supportPhone;

  OrderTrackingResult({
    required this.id,
    required this.status,
    required this.paymentStatus,
    required this.total,
    required this.createdAt,
    required this.progress,
    required this.events,
    this.cargoType,
    this.trackingNumber,
    this.trackingCarrier,
    this.trackingUrl,
    this.currentLocation,
    this.estimatedDelivery,
    this.shippedAt,
    this.deliveredAt,
    this.lastTrackingUpdate,
    this.supportEmail,
    this.supportPhone,
  });

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse((value ?? '').toString()) ?? 0;
  }

  static DateTime? _toDateTime(dynamic value) {
    if (value == null) return null;
    return DateTime.tryParse(value.toString());
  }

  factory OrderTrackingResult.fromJson(Map<String, dynamic> json) {
    final eventsRaw = (json['events'] as List?) ?? const [];
    final support = (json['support'] as Map?)?.cast<String, dynamic>();

    return OrderTrackingResult(
      id: (json['id'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      paymentStatus: (json['paymentStatus'] ?? '').toString(),
      total: _toDouble(json['total']),
      cargoType: json['cargoType']?.toString(),
      trackingNumber: json['trackingNumber']?.toString(),
      trackingCarrier: json['trackingCarrier']?.toString(),
      trackingUrl: json['trackingUrl']?.toString(),
      currentLocation: json['currentLocation']?.toString(),
      estimatedDelivery: _toDateTime(json['estimatedDelivery']),
      shippedAt: _toDateTime(json['shippedAt']),
      deliveredAt: _toDateTime(json['deliveredAt']),
      lastTrackingUpdate: _toDateTime(json['lastTrackingUpdate']),
      createdAt:
          DateTime.tryParse((json['createdAt'] ?? '').toString()) ??
          DateTime.now(),
      progress: _toDouble(json['progress']),
      events: eventsRaw
          .whereType<Map>()
          .map((event) => TrackingEvent.fromJson(event.cast<String, dynamic>()))
          .toList(),
      supportEmail: support?['email']?.toString(),
      supportPhone: support?['phone']?.toString(),
    );
  }
}
