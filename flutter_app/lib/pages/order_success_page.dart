import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../providers/order_provider.dart';
import 'order_tracking_page.dart';

class OrderSuccessPage extends StatelessWidget {
  final OrderPlacementResult result;

  const OrderSuccessPage({super.key, required this.result});

  Future<void> _openPaymentUrl(BuildContext context, String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open payment link.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = result.order;
    final displayOrderId =
        order.backendOrderId.isNotEmpty ? order.backendOrderId : order.id;
    final hasPayment = result.paymentMethod != 'cod';

    return Scaffold(
      appBar: AppBar(title: const Text('Order Confirmed')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Icon(Icons.check_circle, color: Colors.green.shade600, size: 72),
          const SizedBox(height: 12),
          Text(
            'Thank you for your order!',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Order ID: $displayOrderId'),
                  const SizedBox(height: 8),
                  Text('Tracking ID: ${order.trackingNumber ?? 'Pending'}'),
                  const SizedBox(height: 8),
                  Text(
                    'Total: \$${order.total.toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
          if (hasPayment) ...[
            const SizedBox(height: 16),
            Text(
              'Payment Instructions',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            if ((result.paymentReference ?? '').isNotEmpty)
              Text('Reference: ${result.paymentReference}'),
            if (result.instructions.isNotEmpty) ...[
              const SizedBox(height: 8),
              ...result.instructions.map(
                (line) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text('- $line'),
                ),
              ),
            ],
            if ((result.paymentUrl ?? '').isNotEmpty) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () =>
                      _openPaymentUrl(context, result.paymentUrl!),
                  child: const Text('Open Payment Link'),
                ),
              ),
            ],
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.local_shipping_outlined),
              label: const Text('Track Order'),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                  builder: (_) => OrderTrackingPage(
                      initialOrderId: displayOrderId,
                      initialTrackingNumber: order.trackingNumber,
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton(
              onPressed: () {
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
              child: const Text('Continue Shopping'),
            ),
          ),
        ],
      ),
    );
  }
}
