import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_app/providers/auth_provider.dart';
import 'package:flutter_app/providers/category_provider.dart';
import 'package:flutter_app/providers/product_provider.dart';
import 'package:flutter_app/providers/cart_provider.dart';
import 'package:flutter_app/providers/wishlist_provider.dart';
import 'package:flutter_app/providers/address_provider.dart';
import 'package:flutter_app/providers/order_provider.dart';
import 'package:flutter_app/pages/enhanced_home_page.dart';
import 'package:flutter_app/pages/enhanced_login_page.dart';
import 'package:flutter_app/app/theme/app_theme.dart';

class EcommerceApp extends StatelessWidget {
  const EcommerceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CategoryProvider()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
        ChangeNotifierProxyProvider<AuthProvider, CartProvider>(
          create: (_) => CartProvider(),
          update: (_, auth, cart) {
            final userId = auth.isTrackingSession ? null : auth.currentUser?.id;
            cart!.updateUser(userId);
            return cart;
          },
        ),
        ChangeNotifierProxyProvider<AuthProvider, WishlistProvider>(
          create: (_) => WishlistProvider(),
          update: (_, auth, wishlist) {
            final userId = auth.isTrackingSession ? null : auth.currentUser?.id;
            wishlist!.updateUser(userId);
            return wishlist;
          },
        ),
        ChangeNotifierProxyProvider<AuthProvider, AddressProvider>(
          create: (_) => AddressProvider(),
          update: (_, auth, addresses) {
            final userId = auth.isTrackingSession ? null : auth.currentUser?.id;
            addresses!.updateUser(userId);
            return addresses;
          },
        ),
        ChangeNotifierProxyProvider<AuthProvider, OrderProvider>(
          create: (_) => OrderProvider(),
          update: (_, auth, orders) {
            final userId = auth.isTrackingSession ? null : auth.currentUser?.id;
            orders!.updateUser(userId);
            return orders;
          },
        ),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'E-commerce Market',
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: ThemeMode.system,
        home: Consumer<AuthProvider>(
          builder: (context, auth, _) => auth.isAuthenticated
              ? const EnhancedHomePage()
              : const EnhancedLoginPage(),
        ),
      ),
    );
  }
}
