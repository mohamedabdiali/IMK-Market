import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product_model.dart';
import '../providers/wishlist_provider.dart';
import '../providers/cart_provider.dart';

class EnhancedProductCard extends StatefulWidget {
  final Product product;
  final VoidCallback onTap;

  const EnhancedProductCard({
    super.key,
    required this.product,
    required this.onTap,
  });

  @override
  State<EnhancedProductCard> createState() => _EnhancedProductCardState();
}

class _EnhancedProductCardState extends State<EnhancedProductCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1, end: 1.05).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<WishlistProvider>(
      builder: (context, wishlist, _) {
        final isFavorite = wishlist.isFavorite(widget.product.id);

        return MouseRegion(
          onEnter: (_) => _animationController.forward(),
          onExit: (_) => _animationController.reverse(),
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: GestureDetector(
              onTap: widget.onTap,
              child: Card(
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Image with gradient overlay
                      Stack(
                        children: [
                          SizedBox(
                            height: 140,
                            width: double.infinity,
                            child: Container(
                              color: Colors.grey[300],
                              child: widget.product.images.isNotEmpty
                                  ? Image.network(
                                      widget.product.images[0],
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, _, _) =>
                                          const Icon(Icons.image_not_supported),
                                    )
                                  : const Icon(Icons.image_not_supported),
                            ),
                          ),
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(50),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.1),
                                    blurRadius: 8,
                                  ),
                                ],
                              ),
                              child: IconButton(
                                iconSize: 20,
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(
                                  minWidth: 40,
                                  minHeight: 40,
                                ),
                                icon: Icon(
                                  isFavorite
                                      ? Icons.favorite
                                      : Icons.favorite_border,
                                  color: isFavorite
                                      ? Colors.red
                                      : Colors.grey[600],
                                ),
                                onPressed: () async {
                                  await wishlist.toggleFavorite(
                                    widget.product.id,
                                  );
                                },
                              ),
                            ),
                          ),
                          if (widget.product.stock == 0)
                            Positioned.fill(
                              child: Container(
                                color: Colors.black.withValues(alpha: 0.5),
                                child: const Center(
                                  child: Text(
                                    'Out of Stock',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                      // Product info
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.product.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleSmall
                                  ?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(
                                  Icons.star,
                                  size: 16,
                                  color: Colors.orange,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${widget.product.rating}',
                                  style: Theme.of(context).textTheme.labelSmall,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '(${widget.product.stock} in stock)',
                                  style: Theme.of(context).textTheme.labelSmall
                                      ?.copyWith(color: Colors.grey[600]),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '\$${widget.product.price.toStringAsFixed(2)}',
                                  style: Theme.of(context).textTheme.titleSmall
                                      ?.copyWith(
                                        color: Colors.green,
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                                InkWell(
                                  onTap: widget.product.stock > 0
                                      ? () async {
                                          try {
                                            await context
                                                .read<CartProvider>()
                                                .addProduct(widget.product);
                                            if (context.mounted) {
                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                const SnackBar(
                                                  content:
                                                      Text('Added to cart!'),
                                                  duration: Duration(
                                                    milliseconds: 800,
                                                  ),
                                                ),
                                              );
                                            }
                                          } catch (e) {
                                            if (context.mounted) {
                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                SnackBar(
                                                  content: Text(
                                                    'Failed to add: ${e.toString()}',
                                                  ),
                                                ),
                                              );
                                            }
                                          }
                                        }
                                      : null,
                                  child: Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: widget.product.stock > 0
                                          ? Colors.blue
                                          : Colors.grey[300],
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Icon(
                                      Icons.add_shopping_cart,
                                      size: 16,
                                      color: widget.product.stock > 0
                                          ? Colors.white
                                          : Colors.grey[600],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
