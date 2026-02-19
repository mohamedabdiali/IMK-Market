import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/cart_provider.dart';
import 'checkout_page.dart';

class CartPage extends StatelessWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cart')),
      body: Consumer<CartProvider>(
        builder: (context, cart, _) {
          if (cart.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
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
                      subtitle: Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove),
                            onPressed: () async {
                              await cart.changeQuantity(
                                item.product.id,
                                item.quantity - 1,
                              );
                            },
                          ),
                          Text('${item.quantity}'),
                          IconButton(
                            icon: const Icon(Icons.add),
                            onPressed: () async {
                              await cart.changeQuantity(
                                item.product.id,
                                item.quantity + 1,
                              );
                            },
                          ),
                        ],
                      ),
                      trailing: Text(
                        '\$${item.totalPrice.toStringAsFixed(2)}',
                      ),
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
