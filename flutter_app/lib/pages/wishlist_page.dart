import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/wishlist_provider.dart';
import '../providers/product_provider.dart';
import '../components/enhanced_product_card.dart';
import 'product_detail_enhanced.dart';

class WishlistPage extends StatelessWidget {
  const WishlistPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Wishlist'), centerTitle: true),
      body: Consumer2<WishlistProvider, ProductProvider>(
        builder: (context, wishlist, products, _) {
          if (wishlist.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          final favoriteProducts = products.products
              .where((p) => wishlist.isFavorite(p.id))
              .toList();

          if (favoriteProducts.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.favorite_border,
                    size: 64,
                    color: Colors.grey[300],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Your wishlist is empty',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Add items to your wishlist to see them here',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }

          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.7,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: favoriteProducts.length,
            itemBuilder: (context, index) {
              final product = favoriteProducts[index];
              return EnhancedProductCard(
                product: product,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ProductDetailEnhanced(product: product),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
