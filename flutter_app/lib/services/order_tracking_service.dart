import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'package:flutter_app/models/order_tracking.dart';

class OrderTrackingService {
  String _resolveApiBase() {
    const configured = String.fromEnvironment('API_BASE_URL');
    if (configured.isNotEmpty) {
      return configured.endsWith('/api') ? configured : '$configured/api';
    }
    if (kIsWeb) {
      return '/api';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5050/api';
    }
    return 'http://localhost:5050/api';
  }

  Future<OrderTrackingResult> trackOrder({
    required String orderId,
    required String trackingNumber,
  }) async {
    final base = _resolveApiBase();
    final uri = Uri.parse('$base/orders/track').replace(
      queryParameters: {
        'orderId': orderId.trim(),
        'trackingNumber': trackingNumber.trim(),
      },
    );

    final response = await http.get(
      uri,
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Tracking request failed (${response.statusCode})');
    }

    final body = jsonDecode(response.body);
    if (body is! Map<String, dynamic>) {
      throw Exception('Invalid tracking response');
    }
    return OrderTrackingResult.fromJson(body);
  }
}
