import 'package:flutter/material.dart';
import 'package:badges/badges.dart' as badges;
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';
import 'home_tab.dart';
import 'products_tab.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeTab(),
    ProductsTab(),
    CartTab(),
    OrdersTab(),
    ProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          AppConstants.appName,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: AppTheme.primaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // Navigate to search screen
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Search coming soon!')),
              );
            },
          ),
          IconButton(
            icon: badges.Badge(
              badgeContent: const Text(
                '0',
                style: TextStyle(color: Colors.white, fontSize: 10),
              ),
              badgeStyle: const badges.BadgeStyle(
                badgeColor: AppTheme.accentColor,
              ),
              child: const Icon(Icons.shopping_cart_outlined),
            ),
            onPressed: () {
              // Switch to cart tab
              setState(() => _currentIndex = 2);
            },
          ),
          const SizedBox(width: AppTheme.spacing8),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.grid_view_outlined),
            activeIcon: Icon(Icons.grid_view),
            label: 'Products',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_cart_outlined),
            activeIcon: Icon(Icons.shopping_cart),
            label: 'Cart',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Orders',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

// Cart Tab (Placeholder)
class CartTab extends StatelessWidget {
  const CartTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cart')),
      body: const Center(child: Text('Cart Screen - Coming Soon')),
    );
  }
}

// Orders Tab (Placeholder)
class OrdersTab extends StatelessWidget {
  const OrdersTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Orders')),
      body: const Center(child: Text('Orders Screen - Coming Soon')),
    );
  }
}

// Profile Tab
class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  Future<void> _logout(BuildContext context) async {
    final authService = AuthService();
    await authService.logout();

    if (!context.mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final authService = AuthService();
    final user = authService.currentUser;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(AppTheme.spacing16),
        children: [
          if (user != null) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppTheme.spacing16),
                child: Column(
                  children: [
                    const CircleAvatar(
                      radius: 40,
                      backgroundColor: AppTheme.primaryColor,
                      child: Icon(
                        Icons.person,
                        size: 48,
                        color: AppTheme.textOnPrimary,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacing16),
                    Text(
                      user.name,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: AppTheme.spacing4),
                    Text(
                      user.email,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    if (user.phone.isNotEmpty) ...[
                      const SizedBox(height: AppTheme.spacing4),
                      Text(
                        user.phone,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spacing24),
          ],

          ListTile(
            leading: const Icon(Icons.location_on_outlined),
            title: const Text('Addresses'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // Navigate to addresses
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text('Settings'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // Navigate to settings
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.help_outline),
            title: const Text('Help & Support'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // Navigate to help
            },
          ),
          const Divider(),
          const SizedBox(height: AppTheme.spacing24),
          OutlinedButton.icon(
            onPressed: () => _logout(context),
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.accentColor,
              side: const BorderSide(color: AppTheme.accentColor, width: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}
