import 'package:flutter/material.dart';

class PaymentMethodsPage extends StatelessWidget {
  const PaymentMethodsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payment Methods')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _PaymentTile(
            title: 'Cash on Delivery',
            subtitle: 'Pay when your order arrives.',
            icon: Icons.payments_outlined,
          ),
          _PaymentTile(
            title: 'Orange Money',
            subtitle: 'Mobile money payments supported.',
            icon: Icons.phone_android,
          ),
          _PaymentTile(
            title: 'Afrimoney',
            subtitle: 'Mobile money payments supported.',
            icon: Icons.phone_android,
          ),
          _PaymentTile(
            title: 'QMoney',
            subtitle: 'Mobile money payments supported.',
            icon: Icons.phone_android,
          ),
          _PaymentTile(
            title: 'Paystack',
            subtitle: 'Pay with card via Paystack.',
            icon: Icons.credit_card,
          ),
          _PaymentTile(
            title: 'Stripe',
            subtitle: 'Pay securely with card.',
            icon: Icons.credit_card,
          ),
        ],
      ),
    );
  }
}

class _PaymentTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;

  const _PaymentTile({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(subtitle),
      ),
    );
  }
}
