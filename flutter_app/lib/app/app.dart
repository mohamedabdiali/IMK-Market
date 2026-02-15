import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_app/providers/auth_provider.dart';
import 'package:flutter_app/providers/product_provider.dart';
import 'package:flutter_app/providers/cart_provider.dart';
import 'package:flutter_app/providers/wishlist_provider.dart';
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
        ChangeNotifierProvider(create: (_) => ProductProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => WishlistProvider()),
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
