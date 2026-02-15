import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/product_provider.dart';
import '../providers/cart_provider.dart';
import '../components/enhanced_product_card.dart';
import 'cart_page.dart';
import 'wishlist_page.dart';
import 'profile_page.dart';
import 'product_detail_enhanced.dart';

class EnhancedHomePage extends StatefulWidget {
  const EnhancedHomePage({super.key});

  @override
  State<EnhancedHomePage> createState() => _EnhancedHomePageState();
}

class _EnhancedHomePageState extends State<EnhancedHomePage> {
  int _currentIndex = 0;
  String? _selectedCategoryId;
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  late List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      _buildHomeContent(),
      const CartPage(),
      const WishlistPage(),
      const ProfilePage(),
    ];
  }

  Widget _buildHomeContent() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with greeting
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.blue.shade700, Colors.blue.shade400],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Welcome! 👋',
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(50),
                      ),
                      child: const Icon(
                        Icons.notifications,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Search bar
                TextField(
                  controller: _searchController,
                  onChanged: (value) {
                    context.read<ProductProvider>().searchProducts(value);
                  },
                  decoration: InputDecoration(
                    hintText: 'Search products...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Categories horizontal scroll
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Categories',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 120,
                  child: Consumer<ProductProvider>(
                    builder: (context, productProvider, _) {
                      // Mock categories (should be fetched from provider)
                      final categories = [
                        CategoryMock('all', '🌟 All', Colors.blue),
                        CategoryMock(
                          'electronics',
                          '📱 Electronics',
                          Colors.orange,
                        ),
                        CategoryMock('fashion', '👗 Fashion', Colors.pink),
                        CategoryMock('home', '🏠 Home', Colors.green),
                      ];

                      return ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: categories.length,
                        itemBuilder: (context, index) {
                          final cat = categories[index];
                          final isSelected = _selectedCategoryId == cat.id;

                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedCategoryId = cat.id == 'all'
                                    ? null
                                    : cat.id;
                              });
                              context.read<ProductProvider>().filterByCategory(
                                _selectedCategoryId,
                              );
                              _searchController.clear();
                            },
                            child: Container(
                              margin: const EdgeInsets.only(right: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? cat.color
                                    : Colors.grey[200],
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    cat.emoji,
                                    style: const TextStyle(fontSize: 32),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    cat.name,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: isSelected
                                          ? Colors.white
                                          : Colors.grey[800],
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Featured products section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Featured Products',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 12),
          Consumer<ProductProvider>(
            builder: (context, productProvider, _) {
              if (productProvider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              final products = productProvider.products;
              if (products.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      children: [
                        Icon(
                          Icons.shopping_bag,
                          size: 64,
                          color: Colors.grey[300],
                        ),
                        const SizedBox(height: 16),
                        const Text('No products found'),
                      ],
                    ),
                  ),
                );
              }

              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.7,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: products.length,
                  itemBuilder: (context, index) {
                    final product = products[index];
                    return EnhancedProductCard(
                      product: product,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) =>
                                ProductDetailEnhanced(product: product),
                          ),
                        );
                      },
                    );
                  },
                ),
              );
            },
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: Consumer<CartProvider>(
        builder: (context, cart, _) {
          return BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) => setState(() => _currentIndex = index),
            type: BottomNavigationBarType.fixed,
            items: [
              const BottomNavigationBarItem(
                icon: Icon(Icons.home),
                label: 'Home',
              ),
              BottomNavigationBarItem(
                icon: Stack(
                  children: [
                    const Icon(Icons.shopping_cart),
                    if (cart.itemCount > 0)
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          padding: const EdgeInsets.all(1),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 18,
                            minHeight: 18,
                          ),
                          child: Text(
                            '${cart.itemCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                ),
                label: 'Cart',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.favorite),
                label: 'Wishlist',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          );
        },
      ),
    );
  }
}

class CategoryMock {
  final String id;
  final String name;
  final Color color;
  final String emoji;

  CategoryMock(this.id, this.name, this.color) : emoji = name.split(' ')[0];
}
