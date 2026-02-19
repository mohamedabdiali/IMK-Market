import 'package:flutter/material.dart';

class SupportPage extends StatelessWidget {
  const SupportPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help & Support')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Need help?',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          const Text(
            'Contact our support team and we will respond as quickly as possible.',
          ),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              leading: const Icon(Icons.email_outlined),
              title: const Text('Email'),
              subtitle: const Text('support@imkmarket.com'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.phone_outlined),
              title: const Text('Phone'),
              subtitle: const Text('+232-76-123-456'),
            ),
          ),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('FAQ'),
            subtitle: const Text('Common questions and answers'),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}
