import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/address_model.dart';
import '../providers/address_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/order_provider.dart';
import 'addresses_page.dart';
import 'order_success_page.dart';

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  String _paymentMethod = 'cod';
  String _cargoType = 'air';
  Address? _selectedAddress;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>();
    _nameController.text = auth.currentUser?.name ?? '';
    _emailController.text = auth.currentUser?.email ?? '';
    _phoneController.text = auth.currentUser?.phone ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _selectAddress() async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const AddressesPage()));
    if (!mounted) return;
    final provider = context.read<AddressProvider>();
    setState(() => _selectedAddress = provider.defaultAddress);
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;

    final cart = context.read<CartProvider>();
    final auth = context.read<AuthProvider>();
    final addressProvider = context.read<AddressProvider>();
    final orderProvider = context.read<OrderProvider>();

    if (cart.items.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Your cart is empty.')));
      return;
    }

    final address = _selectedAddress ?? addressProvider.defaultAddress;
    if (address == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add a delivery address.')),
      );
      return;
    }

    final user = auth.currentUser;
    if (user == null || auth.isTrackingSession) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to place an order.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final result = await orderProvider.placeOrder(
        user: user,
        address: address,
        items: cart.items,
        paymentMethod: _paymentMethod,
        cargoType: _cargoType,
        customerName: _nameController.text.trim(),
        customerEmail: _emailController.text.trim(),
        customerPhone: _phoneController.text.trim(),
      );
      await cart.clear();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => OrderSuccessPage(result: result)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Checkout failed: ${e.toString()}')),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final addresses = context.watch<AddressProvider>().addresses;
    final selected =
        _selectedAddress ?? context.watch<AddressProvider>().defaultAddress;

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Contact Information',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Full Name',
                border: OutlineInputBorder(),
              ),
              validator: (value) =>
                  value == null || value.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
              validator: (value) =>
                  value == null || value.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(
                labelText: 'Phone',
                border: OutlineInputBorder(),
              ),
              validator: (value) =>
                  value == null || value.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Delivery Address',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: _selectAddress,
                  child: Text(addresses.isEmpty ? 'Add Address' : 'Change'),
                ),
              ],
            ),
            if (selected == null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: const Text('No address selected.'),
              )
            else
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      selected.label,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    Text(selected.fullName),
                    Text(selected.phone),
                    Text(selected.formatted),
                  ],
                ),
              ),
            const SizedBox(height: 24),
            Text(
              'Payment Method',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            _PaymentOption(
              value: 'cod',
              label: 'Cash on Delivery',
              groupValue: _paymentMethod,
              onChanged: (value) => setState(() => _paymentMethod = value),
            ),
            _PaymentOption(
              value: 'orange_money',
              label: 'Orange Money',
              groupValue: _paymentMethod,
              onChanged: (value) => setState(() => _paymentMethod = value),
            ),
            _PaymentOption(
              value: 'afrimoney',
              label: 'Afrimoney',
              groupValue: _paymentMethod,
              onChanged: (value) => setState(() => _paymentMethod = value),
            ),
            _PaymentOption(
              value: 'qmoney',
              label: 'QMoney',
              groupValue: _paymentMethod,
              onChanged: (value) => setState(() => _paymentMethod = value),
            ),
            _PaymentOption(
              value: 'paystack',
              label: 'Paystack',
              groupValue: _paymentMethod,
              onChanged: (value) => setState(() => _paymentMethod = value),
            ),
            _PaymentOption(
              value: 'stripe',
              label: 'Stripe (Card)',
              groupValue: _paymentMethod,
              onChanged: (value) => setState(() => _paymentMethod = value),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _cargoType,
              decoration: const InputDecoration(
                labelText: 'Cargo Type (optional)',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'air', child: Text('Air')),
                DropdownMenuItem(value: 'land', child: Text('Land')),
                DropdownMenuItem(value: 'sea', child: Text('Sea')),
              ],
              onChanged: (value) {
                if (value == null) return;
                setState(() => _cargoType = value);
              },
            ),
            const SizedBox(height: 24),
            Text(
              'Order Summary',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ...cart.items.map(
              (item) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(item.product.name),
                subtitle: Text('Qty: ${item.quantity}'),
                trailing: Text('\$${item.totalPrice.toStringAsFixed(2)}'),
              ),
            ),
            const Divider(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Text(
                  '\$${cart.totalAmount.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _placeOrder,
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Place Order'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentOption extends StatelessWidget {
  final String value;
  final String label;
  final String groupValue;
  final ValueChanged<String> onChanged;

  const _PaymentOption({
    required this.value,
    required this.label,
    required this.groupValue,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return RadioListTile<String>(
      value: value,
      groupValue: groupValue,
      onChanged: (value) {
        if (value != null) onChanged(value);
      },
      title: Text(label),
    );
  }
}
