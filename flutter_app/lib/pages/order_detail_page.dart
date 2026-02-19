import 'package:flutter/material.dart';

import '../models/order_model.dart';
import 'order_tracking_page.dart';

class OrderDetailPage extends StatelessWidget {
  final OrderRecord order;

  const OrderDetailPage({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final displayOrderId =
        order.backendOrderId.isNotEmpty ? order.backendOrderId : order.id;
    return Scaffold(
      appBar: AppBar(title: const Text('Order Details')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Order $displayOrderId',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('Status: ${order.status}'),
                  Text('Payment: ${order.paymentStatus}'),
                  if ((order.trackingNumber ?? '').isNotEmpty)
                    Text('Tracking: ${order.trackingNumber}'),
                  const SizedBox(height: 8),
                  Text(
                    'Total: \$${order.total.toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Shipping Address',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Text(order.shippingAddress),
          const SizedBox(height: 16),
          Text(
            'Items',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          ...order.items.map(
            (item) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: item.image != null && item.image!.isNotEmpty
                  ? Image.network(
                      item.image!,
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                    )
                  : const Icon(Icons.inventory_2_outlined),
              title: Text(item.productName),
              subtitle: Text('Qty: ${item.quantity}'),
              trailing: Text('\$${item.total.toStringAsFixed(2)}'),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
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
              icon: const Icon(Icons.local_shipping_outlined),
              label: const Text('Track Order'),
            ),
          ),
        ],
      ),
    );
  }
}
