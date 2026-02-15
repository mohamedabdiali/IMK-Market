import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product_model.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';

class ProductDetailEnhanced extends StatefulWidget {
  final Product product;

  const ProductDetailEnhanced({super.key, required this.product});

  @override
  State<ProductDetailEnhanced> createState() => _ProductDetailEnhancedState();
}

class _ProductDetailEnhancedState extends State<ProductDetailEnhanced> {
  int _currentImageIndex = 0;
  int _quantity = 1;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Product Details'),
        actions: [
          Consumer<WishlistProvider>(
            builder: (context, wishlist, _) {
              final isFavorite = wishlist.isFavorite(widget.product.id);
              return IconButton(
                icon: Icon(
                  isFavorite ? Icons.favorite : Icons.favorite_border,
                  color: isFavorite ? Colors.red : null,
                ),
                onPressed: () {
                  wishlist.toggleFavorite(widget.product.id);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        isFavorite
                            ? 'Removed from wishlist'
                            : 'Added to wishlist',
                      ),
                      duration: const Duration(milliseconds: 800),
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image carousel
            if (widget.product.images.isNotEmpty) ...[
              SizedBox(
                height: 300,
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: (index) {
                    setState(() => _currentImageIndex = index);
                  },
                  itemCount: widget.product.images.length,
                  itemBuilder: (context, index) {
                    return Image.network(
                      widget.product.images[index],
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) =>
                          const Icon(Icons.image_not_supported),
                    );
                  },
                ),
              ),
              // Image indicators
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    widget.product.images.length,
                    (index) => Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: _currentImageIndex == index ? 12 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _currentImageIndex == index
                            ? Colors.blue
                            : Colors.grey[300],
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),
              ),
            ] else
              Container(
                height: 300,
                color: Colors.grey[300],
                child: const Icon(Icons.image_not_supported),
              ),
            // Product info
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and rating row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.product.name,
                              style: Theme.of(context).textTheme.headlineSmall
                                  ?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(
                                  Icons.star,
                                  color: Colors.orange,
                                  size: 20,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${widget.product.rating}',
                                  style: Theme.of(context).textTheme.bodyLarge,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Price and stock
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Price',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: Colors.grey[600]),
                            ),
                            Text(
                              '\$${widget.product.price.toStringAsFixed(2)}',
                              style: Theme.of(context).textTheme.headlineSmall
                                  ?.copyWith(
                                    color: Colors.green,
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'Stock',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: Colors.grey[600]),
                            ),
                            Text(
                              '${widget.product.stock} items',
                              style: Theme.of(context).textTheme.bodyLarge
                                  ?.copyWith(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Description
                  Text(
                    'Description',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.product.description,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 24),
                  // Quantity selector
                  Text(
                    'Quantity',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove),
                          onPressed: _quantity > 1
                              ? () {
                                  setState(() => _quantity--);
                                }
                              : null,
                        ),
                        SizedBox(
                          width: 50,
                          child: Text(
                            '$_quantity',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyLarge
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add),
                          onPressed: _quantity < widget.product.stock
                              ? () {
                                  setState(() => _quantity++);
                                }
                              : null,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  // Add to cart button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: widget.product.stock > 0
                          ? () {
                              for (int i = 0; i < _quantity; i++) {
                                context.read<CartProvider>().addProduct(
                                  widget.product,
                                );
                              }
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    '$_quantity item${_quantity > 1 ? 's' : ''} added to cart!',
                                  ),
                                  backgroundColor: Colors.green,
                                ),
                              );
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue.shade700,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        widget.product.stock > 0
                            ? 'Add to Cart'
                            : 'Out of Stock',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
