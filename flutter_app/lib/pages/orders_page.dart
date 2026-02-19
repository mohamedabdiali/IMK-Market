import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/order_model.dart';
import '../providers/order_provider.dart';
import 'order_detail_page.dart';

class OrdersPage extends StatelessWidget {
  const OrdersPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Orders')),
      body: Consumer<OrderProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.orders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 12),
                  const Text('No orders yet.'),
                ],
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemBuilder: (context, index) {
              final order = provider.orders[index];
              return _OrderTile(order: order);
            },
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemCount: provider.orders.length,
          );
        },
      ),
    );
  }
}

class _OrderTile extends StatelessWidget {
  final OrderRecord order;

  const _OrderTile({required this.order});

  @override
  Widget build(BuildContext context) {
    final displayOrderId =
        order.backendOrderId.isNotEmpty ? order.backendOrderId : order.id;
    return Card(
      child: ListTile(
        title: Text('Order $displayOrderId'),
        subtitle: Text('Status: ${order.status}'),
        trailing: Text('\$${order.total.toStringAsFixed(2)}'),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => OrderDetailPage(order: order),
            ),
          );
        },
      ),
    );
  }
}
