import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/theme.dart';
import '../../main.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
    });
  }

  Future<void> _toggleNotifications(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', value);
    setState(() => _notificationsEnabled = value);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(AppTheme.spacing16),
        children: [
          // ──── Appearance ────
          Text(
            'Appearance',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: AppTheme.spacing8),
          Card(
            child: SwitchListTile(
              secondary: Icon(
                isDark ? Icons.dark_mode : Icons.light_mode,
                color: isDark ? Colors.amber : AppTheme.primaryColor,
              ),
              title: const Text('Dark Mode'),
              subtitle: Text(
                isDark ? 'Dark theme active' : 'Light theme active',
              ),
              value: isDark,
              onChanged: (value) {
                themeNotifier.value = value ? ThemeMode.dark : ThemeMode.light;
                _saveThemePreference(value);
              },
              activeColor: AppTheme.primaryColor,
            ),
          ),

          const SizedBox(height: AppTheme.spacing24),

          // ──── Notifications ────
          Text(
            'Notifications',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: AppTheme.spacing8),
          Card(
            child: SwitchListTile(
              secondary: Icon(
                _notificationsEnabled
                    ? Icons.notifications_active
                    : Icons.notifications_off_outlined,
                color: _notificationsEnabled
                    ? AppTheme.primaryColor
                    : AppTheme.textSecondary,
              ),
              title: const Text('Push Notifications'),
              subtitle: Text(
                _notificationsEnabled
                    ? 'Receive order updates and offers'
                    : 'Notifications are disabled',
              ),
              value: _notificationsEnabled,
              onChanged: _toggleNotifications,
              activeColor: AppTheme.primaryColor,
            ),
          ),

          const SizedBox(height: AppTheme.spacing24),

          // ──── App Info ────
          Text(
            'About',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: AppTheme.spacing8),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: const Text('App Version'),
                  trailing: Text(
                    '1.0.0',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _saveThemePreference(bool isDark) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_dark_mode', isDark);
  }
}
