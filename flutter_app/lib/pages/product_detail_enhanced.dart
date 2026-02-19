import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product_model.dart';
import '../models/review_model.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';
import '../services/firestore_service.dart';

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
  final FirestoreService _firestoreService = FirestoreService();
  final TextEditingController _reviewController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _reviewController.dispose();
    super.dispose();
  }

  Future<void> _showReviewComposer() async {
    final auth = context.read<AuthProvider>();
    if (auth.isTrackingSession || auth.currentUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Sign in to leave a review.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    double rating = 5;
    _reviewController.clear();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Write a Review',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: List.generate(
                      5,
                      (index) => IconButton(
                        icon: Icon(
                          index < rating ? Icons.star : Icons.star_border,
                          color: Colors.orange,
                        ),
                        onPressed: () {
                          setModalState(() => rating = index + 1);
                        },
                      ),
                    ),
                  ),
                  TextField(
                    controller: _reviewController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Comment',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        final comment = _reviewController.text.trim();
                        final user = auth.currentUser!;
                        final review = Review(
                          id: DateTime.now().millisecondsSinceEpoch.toString(),
                          productId: widget.product.id,
                          userId: user.id,
                          userName: user.name ?? user.email,
                          rating: rating,
                          comment: comment,
                          createdAt: DateTime.now(),
                        );
                        await _firestoreService.addReview(
                          widget.product.id,
                          review,
                        );
                        if (mounted) Navigator.pop(context);
                      },
                      child: const Text('Submit Review'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
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
                onPressed: () async {
                  await wishlist.toggleFavorite(widget.product.id);
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
                          ? () async {
                              try {
                                await context.read<CartProvider>().addProduct(
                                      widget.product,
                                      quantity: _quantity,
                                    );
                                if (!mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      '$_quantity item${_quantity > 1 ? 's' : ''} added to cart!',
                                    ),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                              } catch (e) {
                                if (!mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Failed to add to cart: ${e.toString()}',
                                    ),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
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
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Reviews',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextButton(
                    onPressed: _showReviewComposer,
                    child: const Text('Write a review'),
                  ),
                ],
              ),
            ),
            StreamBuilder<List<Review>>(
              stream: _firestoreService.getReviews(widget.product.id),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                final reviews = snapshot.data ?? [];
                if (reviews.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('No reviews yet. Be the first to review!'),
                  );
                }
                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  itemBuilder: (context, index) {
                    final review = reviews[index];
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              review.userName,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Row(
                              children: List.generate(
                                5,
                                (i) => Icon(
                                  i < review.rating
                                      ? Icons.star
                                      : Icons.star_border,
                                  size: 16,
                                  color: Colors.orange,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(review.comment),
                      ],
                    );
                  },
                  separatorBuilder: (_, __) => const Divider(height: 24),
                  itemCount: reviews.length,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
