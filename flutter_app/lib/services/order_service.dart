import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class OrderService {
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

  Future<Map<String, dynamic>> createOrder(
    Map<String, dynamic> payload,
  ) async {
    final uri = Uri.parse('${_resolveApiBase()}/orders');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Order request failed (${response.statusCode})');
    }
    final body = jsonDecode(response.body);
    if (body is! Map<String, dynamic>) {
      throw Exception('Invalid order response');
    }
    return body;
  }

  Future<Map<String, dynamic>> initiatePayment(
    Map<String, dynamic> payload,
  ) async {
    final uri = Uri.parse('${_resolveApiBase()}/payments/initiate');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Payment initiation failed (${response.statusCode})');
    }
    final body = jsonDecode(response.body);
    if (body is! Map<String, dynamic>) {
      throw Exception('Invalid payment response');
    }
    return body;
  }
}
