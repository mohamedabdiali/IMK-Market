import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';

class CartPage extends StatelessWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cart')),
      body: Consumer<CartProvider>(
        builder: (context, cart, _) {
          if (cart.items.isEmpty) {
            return const Center(child: Text('Your cart is empty'));
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  itemCount: cart.items.length,
                  itemBuilder: (context, i) {
                    final item = cart.items[i];
                    return ListTile(
                      leading: item.product.images.isNotEmpty
                          ? Image.network(
                              item.product.images[0],
                              width: 56,
                              height: 56,
                              fit: BoxFit.cover,
                            )
                          : const Icon(Icons.image_not_supported),
                      title: Text(item.product.name),
                      subtitle: Text('Quantity: ${item.quantity}'),
                      trailing: Text('\$${item.totalPrice.toStringAsFixed(2)}'),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Total: \$${cart.totalAmount.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const CheckoutPage(),
                          ),
                        );
                      },
                      child: const Text('Checkout'),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class CheckoutPage extends StatelessWidget {
  const CheckoutPage({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Items: ${cart.itemCount}'),
            const SizedBox(height: 8),
            Text(
              'Total: \$${cart.totalAmount.toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 24),
            const Text('Payment integration placeholder.'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                // Placeholder: process order and clear cart
                cart.clear();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Order placed (placeholder)')),
                );
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
              child: const Text('Place Order (demo)'),
            ),
          ],
        ),
      ),
    );
  }
}
