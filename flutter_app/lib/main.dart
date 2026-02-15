import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'package:flutter_app/app/app.dart';
import 'package:flutter_app/app/setup/splash_page.dart';
import 'package:flutter_app/app/setup/startup_error_page.dart';
import 'package:flutter_app/firebase_options.dart';
import 'package:flutter_app/pages/order_tracking_page.dart';

void main() {
  runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();

      FlutterError.onError = (details) {
        FlutterError.presentError(details);
        Zone.current.handleUncaughtError(
          details.exception,
          details.stack ?? StackTrace.empty,
        );
      };

      runApp(const BootstrapApp());
    },
    (error, stackTrace) {
      debugPrint('Uncaught startup error: $error');
    },
  );
}

class BootstrapApp extends StatelessWidget {
  const BootstrapApp({super.key});

  Future<FirebaseApp?> _initFirebase() async {
    if (!DefaultFirebaseOptions.isConfigured) return null;
    return Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<FirebaseApp?>(
      future: _initFirebase(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const MaterialApp(
            debugShowCheckedModeBanner: false,
            home: SplashPage(),
          );
        }

        if (snapshot.hasError) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            home: StartupErrorPage(error: snapshot.error),
          );
        }

        // If Firebase not configured, show demo mode
        if (!DefaultFirebaseOptions.isConfigured) {
          return const MaterialApp(
            debugShowCheckedModeBanner: false,
            title: 'IMK Market (Demo Mode)',
            home: DemoModeApp(),
          );
        }

        return const EcommerceApp();
      },
    );
  }
}

/// Demo mode app with mock data (no Firebase required)
class DemoModeApp extends StatelessWidget {
  const DemoModeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'IMK Market',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0066CC),
          brightness: Brightness.light,
        ),
      ),
      home: const DemoMainPages(),
    );
  }
}

/// Mock data
final mockProducts = [
  {
    'id': '1',
    'name': 'Wireless Headphones',
    'price': 79.99,
    'image': '🎧',
    'category': 'Electronics',
    'rating': 4.5,
    'stock': 12,
  },
  {
    'id': '2',
    'name': 'Running Shoes',
    'price': 89.99,
    'image': '👟',
    'category': 'Fashion',
    'rating': 4.8,
    'stock': 8,
  },
  {
    'id': '3',
    'name': 'Desk Lamp',
    'price': 34.99,
    'image': '💡',
    'category': 'Home',
    'rating': 4.2,
    'stock': 25,
  },
  {
    'id': '4',
    'name': 'Phone Case',
    'price': 19.99,
    'image': '📱',
    'category': 'Electronics',
    'rating': 4.3,
    'stock': 50,
  },
  {
    'id': '5',
    'name': 'Designer T-Shirt',
    'price': 49.99,
    'image': '👕',
    'category': 'Fashion',
    'rating': 4.6,
    'stock': 20,
  },
  {
    'id': '6',
    'name': 'Coffee Maker',
    'price': 129.99,
    'image': '☕',
    'category': 'Home',
    'rating': 4.7,
    'stock': 5,
  },
];

/// Main app with bottom nav
class DemoMainPages extends StatefulWidget {
  const DemoMainPages({super.key});

  @override
  State<DemoMainPages> createState() => _DemoMainPagesState();
}

class _DemoMainPagesState extends State<DemoMainPages> {
  int _selectedIndex = 0;
  final Set<String> _favorites = {};
  final Map<String, int> _cartItems = {};

  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      DemoHomePage(
        favorites: _favorites,
        onFavoriteToggle: (id) => setState(
          () => _favorites.contains(id)
              ? _favorites.remove(id)
              : _favorites.add(id),
        ),
        onAddToCart: (id) =>
            setState(() => _cartItems[id] = (_cartItems[id] ?? 0) + 1),
      ),
      DemoCartPage(
        cartItems: _cartItems,
        onRemove: (id) => setState(() => _cartItems.remove(id)),
        onQuantityChange: (id, qty) => setState(() => _cartItems[id] = qty),
      ),
      DemoWishlistPage(
        favorites: _favorites,
        onFavoriteToggle: (id) => setState(
          () => _favorites.contains(id)
              ? _favorites.remove(id)
              : _favorites.add(id),
        ),
      ),
      const DemoProfilePage(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(
            icon: Badge(
              label: Text(_cartItems.length.toString()),
              child: const Icon(Icons.shopping_cart),
            ),
            label: 'Cart',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              label: Text(_favorites.length.toString()),
              child: const Icon(Icons.favorite),
            ),
            label: 'Wishlist',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

/// Home Page with search
class DemoHomePage extends StatefulWidget {
  final Set<String> favorites;
  final Function(String) onFavoriteToggle;
  final Function(String) onAddToCart;

  const DemoHomePage({
    required this.favorites,
    required this.onFavoriteToggle,
    required this.onAddToCart,
    super.key,
  });

  @override
  State<DemoHomePage> createState() => _DemoHomePageState();
}

class _DemoHomePageState extends State<DemoHomePage> {
  String _searchQuery = '';
  String _selectedCategory = 'All';

  @override
  Widget build(BuildContext context) {
    final categories = ['All', 'Electronics', 'Fashion', 'Home'];
    var filtered = mockProducts
        .where(
          (p) =>
              (p['name'] as String).toLowerCase().contains(
                _searchQuery.toLowerCase(),
              ) &&
              (_selectedCategory == 'All' ||
                  p['category'] == _selectedCategory),
        )
        .toList();

    return Scaffold(
      appBar: AppBar(title: const Text('IMK Market')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: (v) => setState(() => _searchQuery = v),
              decoration: InputDecoration(
                hintText: 'Search products...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
              ),
            ),
          ),
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: categories.length,
              itemBuilder: (_, i) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: FilterChip(
                  label: Text(categories[i]),
                  selected: categories[i] == _selectedCategory,
                  onSelected: (s) => setState(
                    () => _selectedCategory = s ? categories[i] : 'All',
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.75,
              ),
              itemCount: filtered.length,
              itemBuilder: (_, i) {
                final p = filtered[i];
                final isFav = widget.favorites.contains(p['id']);
                return Card(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: Stack(
                          children: [
                            Container(
                              color: Colors.blue.shade50,
                              child: Center(
                                child: Text(
                                  p['image'] as String,
                                  style: const TextStyle(fontSize: 48),
                                ),
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: IconButton(
                                icon: Icon(
                                  isFav
                                      ? Icons.favorite
                                      : Icons.favorite_border,
                                  color: Colors.red,
                                ),
                                onPressed: () =>
                                    widget.onFavoriteToggle(p['id'] as String),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p['name'] as String,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            Row(
                              children: [
                                const Icon(
                                  Icons.star,
                                  size: 14,
                                  color: Colors.orange,
                                ),
                                Text(
                                  ' ${p['rating']}',
                                  style: const TextStyle(fontSize: 11),
                                ),
                              ],
                            ),
                            Text(
                              '\$${p['price']}',
                              style: TextStyle(
                                color: Colors.green.shade700,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            ElevatedButton(
                              onPressed: () {
                                widget.onAddToCart(p['id'] as String);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Added to cart'),
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                minimumSize: const Size.fromHeight(24),
                              ),
                              child: const Text(
                                'Add to Cart',
                                style: TextStyle(fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Cart Page
class DemoCartPage extends StatelessWidget {
  final Map<String, int> cartItems;
  final Function(String) onRemove;
  final Function(String, int) onQuantityChange;

  const DemoCartPage({
    required this.cartItems,
    required this.onRemove,
    required this.onQuantityChange,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final items = mockProducts
        .where((p) => cartItems.containsKey(p['id']))
        .toList();
    final total = items.fold<double>(
      0,
      (s, p) => s + (p['price'] as double) * (cartItems[p['id']] ?? 1),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Shopping Cart')),
      body: cartItems.isEmpty
          ? const Center(child: Text('Cart is empty'))
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    itemCount: items.length,
                    itemBuilder: (_, i) {
                      final p = items[i];
                      final q = cartItems[p['id']]!;
                      return ListTile(
                        title: Text(p['name'] as String),
                        subtitle: Text('\$${p['price']}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove),
                              onPressed: () => q > 1
                                  ? onQuantityChange(p['id'] as String, q - 1)
                                  : onRemove(p['id'] as String),
                            ),
                            Text('$q'),
                            IconButton(
                              icon: const Icon(Icons.add),
                              onPressed: () =>
                                  onQuantityChange(p['id'] as String, q + 1),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text(
                        'Total: \$${total.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: () =>
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Checkout coming soon!'),
                              ),
                            ),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                        ),
                        child: const Text('Checkout'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

/// Wishlist Page
class DemoWishlistPage extends StatelessWidget {
  final Set<String> favorites;
  final Function(String) onFavoriteToggle;

  const DemoWishlistPage({
    required this.favorites,
    required this.onFavoriteToggle,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final items = mockProducts
        .where((p) => favorites.contains(p['id']))
        .toList();

    return Scaffold(
      appBar: AppBar(title: const Text('My Wishlist')),
      body: items.isEmpty
          ? const Center(child: Text('No favorites'))
          : GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.75,
              ),
              itemCount: items.length,
              itemBuilder: (_, i) {
                final p = items[i];
                return Card(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: Container(
                          color: Colors.blue.shade50,
                          child: Center(
                            child: Text(
                              p['image'] as String,
                              style: const TextStyle(fontSize: 48),
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p['name'] as String,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              '\$${p['price']}',
                              style: TextStyle(
                                color: Colors.green.shade700,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            ElevatedButton(
                              onPressed: () =>
                                  onFavoriteToggle(p['id'] as String),
                              style: ElevatedButton.styleFrom(
                                minimumSize: const Size.fromHeight(24),
                              ),
                              child: const Text(
                                'Remove',
                                style: TextStyle(fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

/// Profile Page
class DemoProfilePage extends StatelessWidget {
  const DemoProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Column(
              children: [
                const Icon(Icons.account_circle, size: 80, color: Colors.blue),
                const SizedBox(height: 16),
                const Text(
                  'demo@example.com',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const Text(
                  'Premium Member',
                  style: TextStyle(color: Colors.orange),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          ListTile(
            leading: const Icon(Icons.shopping_bag),
            title: const Text('My Orders'),
            subtitle: const Text('Track your orders'),
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const OrderTrackingPage()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.location_on),
            title: const Text('Addresses'),
            subtitle: const Text('Manage addresses'),
            onTap: () => ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Coming soon'))),
          ),
          ListTile(
            leading: const Icon(Icons.credit_card),
            title: const Text('Payments'),
            subtitle: const Text('Manage payments'),
            onTap: () => ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Coming soon'))),
          ),
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Settings'),
            subtitle: const Text('App preferences'),
            onTap: () => ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Coming soon'))),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => showDialog(
              context: context,
              builder: (c) => AlertDialog(
                title: const Text('Logout'),
                content: const Text('Sign out?'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(c),
                    child: const Text('Cancel'),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(c),
                    child: const Text('Logout'),
                  ),
                ],
              ),
            ),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}
