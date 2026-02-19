import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_app/models/address_model.dart';
import 'package:flutter_app/models/cart_item.dart';
import 'package:flutter_app/models/order_model.dart';
import 'package:flutter_app/models/user_model.dart';
import 'package:flutter_app/services/firestore_service.dart';
import 'package:flutter_app/services/order_service.dart';

class OrderPlacementResult {
  final OrderRecord order;
  final String? paymentId;
  final String? paymentReference;
  final List<String> instructions;
  final String? paymentUrl;
  final bool requiresRedirect;
  final String paymentMethod;

  const OrderPlacementResult({
    required this.order,
    required this.paymentMethod,
    this.paymentId,
    this.paymentReference,
    this.instructions = const [],
    this.paymentUrl,
    this.requiresRedirect = false,
  });
}

class OrderProvider extends ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();
  final OrderService _orderService = OrderService();

  List<OrderRecord> _orders = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  StreamSubscription<List<OrderRecord>>? _subscription;

  List<OrderRecord> get orders => _orders;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateUser(String? userId) {
    if (_userId == userId) return;
    _userId = userId;
    _subscription?.cancel();
    _orders = [];
    _error = null;

    if (userId == null) {
      _isLoading = false;
      notifyListeners();
      return;
    }

    _isLoading = true;
    notifyListeners();
    _subscription = _firestoreService.getOrders(userId).listen(
      (orders) {
        _orders = orders;
        _isLoading = false;
        _error = null;
        notifyListeners();
      },
      onError: (e) {
        _error = e.toString();
        _isLoading = false;
        notifyListeners();
      },
    );
  }

  Future<OrderPlacementResult> placeOrder({
    required User user,
    required Address address,
    required List<CartItem> items,
    required String paymentMethod,
    String? cargoType,
    String? customerName,
    String? customerEmail,
    String? customerPhone,
  }) async {
    if (_userId == null) {
      throw Exception('User not authenticated');
    }
    if (items.isEmpty) {
      throw Exception('Cart is empty');
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    final payloadItems = items
        .map(
          (item) => {
            'productId': item.product.id,
            'productName': item.product.name,
            'quantity': item.quantity,
            'price': item.product.price,
          },
        )
        .toList();

    final resolvedName = customerName ?? user.name ?? user.email;
    final resolvedEmail = customerEmail ?? user.email;
    final resolvedPhone = customerPhone ?? user.phone ?? address.phone;

    final payload = {
      'customerName': resolvedName,
      'customerEmail': resolvedEmail,
      'customerPhone': resolvedPhone,
      'shippingAddress': address.formatted,
      'paymentMethod': paymentMethod,
      if (cargoType != null && cargoType.isNotEmpty) 'cargoType': cargoType,
      'items': payloadItems,
    };

    try {
      Map<String, dynamic> response;
      if (paymentMethod == 'cod') {
        response = await _orderService.createOrder(payload);
      } else {
        response = await _orderService.initiatePayment(payload);
      }

      final backendOrderId =
          (response['id'] ?? response['orderId'])?.toString() ?? '';
      final trackingNumber = response['trackingNumber']?.toString();
      final trackingId = response['orderTrackingId']?.toString();
      final total = items.fold<double>(
        0,
        (sum, item) => sum + item.totalPrice,
      );
      final recordId = backendOrderId.isNotEmpty
          ? backendOrderId
          : DateTime.now().millisecondsSinceEpoch.toString();

      final orderRecord = OrderRecord(
        id: recordId,
        backendOrderId: backendOrderId,
        trackingNumber: trackingNumber ?? trackingId,
        status: (response['status'] ?? response['orderStatus'] ?? 'pending')
            .toString(),
        paymentMethod: paymentMethod,
        paymentStatus:
            (response['paymentStatus'] ?? response['status'] ?? 'pending')
                .toString(),
        total: total,
        customerName: resolvedName,
        customerEmail: resolvedEmail,
        customerPhone: resolvedPhone,
        shippingAddress: address.formatted,
        items: items
            .map(
              (item) => OrderItem(
                productId: item.product.id,
                productName: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
                image:
                    item.product.images.isNotEmpty ? item.product.images[0] : '',
              ),
            )
            .toList(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await _firestoreService.createOrderRecord(_userId!, orderRecord);

      final instructions = (response['instructions'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const <String>[];

      final result = OrderPlacementResult(
        order: orderRecord,
        paymentMethod: paymentMethod,
        paymentId: response['id']?.toString(),
        paymentReference: response['reference']?.toString(),
        instructions: instructions,
        paymentUrl: response['paymentUrl']?.toString(),
        requiresRedirect: response['requiresRedirect'] == true,
      );

      _isLoading = false;
      notifyListeners();
      return result;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
