import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'order_tracking_page.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Profile'), centerTitle: true),
      body: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (!auth.isAuthenticated) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  const Text('Not signed in'),
                ],
              ),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                if (auth.isTrackingSession)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blue.shade100),
                    ),
                    child: Text(
                      'Tracking session active for ${auth.trackingOrderId ?? "order"}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                // Profile header
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blue.shade700, Colors.blue.shade400],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(50),
                        ),
                        child: Icon(
                          Icons.person,
                          size: 50,
                          color: Colors.blue.shade700,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        auth.isTrackingSession
                            ? (auth.trackingOrderId ?? 'Tracking Customer')
                            : (auth.currentUser?.email ?? 'User'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'Customer Session',
                          style: TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                // Menu items
                _buildProfileMenuItem(
                  context,
                  icon: Icons.shopping_bag,
                  title: 'My Orders',
                  subtitle: 'Track and monitor your shipment',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => OrderTrackingPage(
                          initialOrderId: auth.trackingOrderId,
                          initialTrackingNumber: auth.trackingNumber,
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
                _buildProfileMenuItem(
                  context,
                  icon: Icons.location_on,
                  title: 'Addresses',
                  subtitle: 'Manage delivery addresses',
                  onTap: () {},
                ),
                const SizedBox(height: 12),
                _buildProfileMenuItem(
                  context,
                  icon: Icons.payment,
                  title: 'Payment Methods',
                  subtitle: 'Manage your payment methods',
                  onTap: () {},
                ),
                const SizedBox(height: 12),
                _buildProfileMenuItem(
                  context,
                  icon: Icons.settings,
                  title: 'Settings',
                  subtitle: 'App preferences and security',
                  onTap: () {},
                ),
                const SizedBox(height: 12),
                _buildProfileMenuItem(
                  context,
                  icon: Icons.help,
                  title: 'Help & Support',
                  subtitle: 'Get help with your questions',
                  onTap: () {},
                ),
                const SizedBox(height: 32),
                // Logout button
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Logout'),
                          content: const Text(
                            'Are you sure you want to logout?',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Cancel'),
                            ),
                            TextButton(
                              onPressed: () {
                                Navigator.pop(context);
                                context.read<AuthProvider>().logout();
                              },
                              child: const Text(
                                'Logout',
                                style: TextStyle(color: Colors.red),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Logout',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildProfileMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[200]!),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: Colors.blue.shade700),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey[600]),
          ],
        ),
      ),
    );
  }
}
