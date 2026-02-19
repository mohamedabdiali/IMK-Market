import 'package:flutter/material.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _notifications = true;
  bool _marketingEmails = false;
  bool _orderUpdates = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SwitchListTile(
            title: const Text('Push Notifications'),
            subtitle: const Text('Get alerts about deals and updates'),
            value: _notifications,
            onChanged: (value) => setState(() => _notifications = value),
          ),
          SwitchListTile(
            title: const Text('Order Updates'),
            subtitle: const Text('Track shipping and delivery updates'),
            value: _orderUpdates,
            onChanged: (value) => setState(() => _orderUpdates = value),
          ),
          SwitchListTile(
            title: const Text('Marketing Emails'),
            subtitle: const Text('Receive promotions and newsletters'),
            value: _marketingEmails,
            onChanged: (value) => setState(() => _marketingEmails = value),
          ),
          const SizedBox(height: 24),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Privacy & Security'),
            subtitle: const Text('Manage your privacy settings'),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}
