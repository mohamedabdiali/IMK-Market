import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:flutter_app/models/order_tracking.dart';
import 'package:flutter_app/providers/auth_provider.dart';
import 'package:flutter_app/services/order_tracking_service.dart';

class OrderTrackingPage extends StatefulWidget {
  const OrderTrackingPage({
    super.key,
    this.initialOrderId,
    this.initialTrackingNumber,
  });

  final String? initialOrderId;
  final String? initialTrackingNumber;

  @override
  State<OrderTrackingPage> createState() => _OrderTrackingPageState();
}

class _OrderTrackingPageState extends State<OrderTrackingPage> {
  final _formKey = GlobalKey<FormState>();
  final _orderIdController = TextEditingController();
  final _trackingNumberController = TextEditingController();
  final _service = OrderTrackingService();

  bool _isLoading = false;
  OrderTrackingResult? _result;
  String? _error;

  @override
  void initState() {
    super.initState();
    _orderIdController.text = widget.initialOrderId ?? '';
    _trackingNumberController.text = widget.initialTrackingNumber ?? '';
  }

  @override
  void dispose() {
    _orderIdController.dispose();
    _trackingNumberController.dispose();
    super.dispose();
  }

  String _formatDate(DateTime? value) {
    if (value == null) return 'N/A';
    final local = value.toLocal();
    return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')} ${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
        return Colors.green;
      case 'shipped':
        return Colors.purple;
      case 'processing':
        return Colors.blue;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  Future<void> _trackOrder() async {
    if (!_formKey.currentState!.validate()) return;
    final orderId = _orderIdController.text.trim();
    final trackingNumber = _trackingNumberController.text.trim();

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final tracked = await _service.trackOrder(
        orderId: orderId,
        trackingNumber: trackingNumber,
      );
      if (!mounted) return;

      context.read<AuthProvider?>()?.loginAsTrackingCustomer(
        orderId,
        trackingNumber,
      );

      setState(() {
        _result = tracked;
        _error = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tracking login successful.'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (_) {
      setState(() {
        _result = null;
        _error = 'Order not found. Please check Order ID and Tracking Number.';
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider?>();
    final isAuthenticated = auth?.isAuthenticated ?? false;
    final isTrackingSession = auth?.isTrackingSession ?? false;
    return Scaffold(
      appBar: AppBar(title: const Text('Track Order')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isAuthenticated || !isTrackingSession)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.blue.shade100),
                ),
                child: const Text(
                  'Enter Order ID and Tracking Number to login automatically and view your tracking timeline.',
                ),
              ),
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextFormField(
                    controller: _orderIdController,
                    decoration: const InputDecoration(
                      labelText: 'Order ID',
                      hintText: 'ORD-XXXXXX',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Order ID is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _trackingNumberController,
                    decoration: const InputDecoration(
                      labelText: 'Tracking Number',
                      hintText: 'TRK-XXXXXXXXXX',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Tracking Number is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isLoading ? null : _trackOrder,
                      icon: _isLoading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.local_shipping),
                      label: Text(
                        _isLoading ? 'Checking...' : 'Login & Track Order',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            if (_result != null) ...[
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _result!.id,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: _statusColor(
                              _result!.status,
                            ).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            _result!.status.toUpperCase(),
                            style: TextStyle(
                              color: _statusColor(_result!.status),
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    LinearProgressIndicator(
                      value: (_result!.progress.clamp(0, 100)) / 100,
                      minHeight: 8,
                    ),
                    const SizedBox(height: 8),
                    Text('Progress: ${_result!.progress.toStringAsFixed(0)}%'),
                    const SizedBox(height: 8),
                    Text(
                      'Tracking Number: ${_result!.trackingNumber ?? 'N/A'}',
                    ),
                    Text(
                      'Current Location: ${_result!.currentLocation ?? 'Awaiting update'}',
                    ),
                    Text(
                      'Estimated Delivery: ${_formatDate(_result!.estimatedDelivery)}',
                    ),
                    if ((_result!.supportPhone ?? '').isNotEmpty)
                      Text('Support: ${_result!.supportPhone}'),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Tracking Timeline',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              ..._result!.events.map(
                (event) => Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade200),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event.title,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Text(event.message),
                      const SizedBox(height: 6),
                      Text(
                        '${event.location ?? 'N/A'} | ${_formatDate(event.eventAt)}',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
