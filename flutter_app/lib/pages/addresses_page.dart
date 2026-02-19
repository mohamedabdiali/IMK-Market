import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/address_model.dart';
import '../providers/address_provider.dart';

class AddressesPage extends StatelessWidget {
  const AddressesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Addresses')),
      body: Consumer<AddressProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.addresses.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.location_on, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 12),
                  const Text('No addresses added yet.'),
                ],
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemBuilder: (context, index) {
              final address = provider.addresses[index];
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            address.label,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (address.isDefault)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.green.shade50,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'Default',
                                style: TextStyle(
                                  color: Colors.green,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(address.fullName),
                      Text(address.phone),
                      Text(address.formatted),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      AddressFormPage(address: address),
                                ),
                              );
                            },
                            child: const Text('Edit'),
                          ),
                          TextButton(
                            onPressed: () async {
                              await provider.deleteAddress(address.id);
                            },
                            style: TextButton.styleFrom(
                              foregroundColor: Colors.red,
                            ),
                            child: const Text('Delete'),
                          ),
                          const Spacer(),
                          if (!address.isDefault)
                            TextButton(
                              onPressed: () async {
                                await provider.setDefault(address.id);
                              },
                              child: const Text('Set Default'),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemCount: provider.addresses.length,
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const AddressFormPage()),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

class AddressFormPage extends StatefulWidget {
  final Address? address;

  const AddressFormPage({super.key, this.address});

  @override
  State<AddressFormPage> createState() => _AddressFormPageState();
}

class _AddressFormPageState extends State<AddressFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _labelController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _line1Controller = TextEditingController();
  final _line2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _countryController = TextEditingController();
  final _postalController = TextEditingController();
  bool _isDefault = false;

  @override
  void initState() {
    super.initState();
    final address = widget.address;
    if (address != null) {
      _labelController.text = address.label;
      _nameController.text = address.fullName;
      _phoneController.text = address.phone;
      _line1Controller.text = address.line1;
      _line2Controller.text = address.line2;
      _cityController.text = address.city;
      _stateController.text = address.state;
      _countryController.text = address.country;
      _postalController.text = address.postalCode;
      _isDefault = address.isDefault;
    }
  }

  @override
  void dispose() {
    _labelController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _line1Controller.dispose();
    _line2Controller.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _countryController.dispose();
    _postalController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final provider = context.read<AddressProvider>();
    final id = widget.address?.id ??
        DateTime.now().millisecondsSinceEpoch.toString();
    final address = Address(
      id: id,
      label: _labelController.text.trim(),
      fullName: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      line1: _line1Controller.text.trim(),
      line2: _line2Controller.text.trim(),
      city: _cityController.text.trim(),
      state: _stateController.text.trim(),
      country: _countryController.text.trim(),
      postalCode: _postalController.text.trim(),
      isDefault: _isDefault,
      createdAt: widget.address?.createdAt ?? DateTime.now(),
      updatedAt: DateTime.now(),
    );
    await provider.upsertAddress(address);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.address == null ? 'Add Address' : 'Edit Address'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _labelController,
              decoration: const InputDecoration(
                labelText: 'Label (Home, Office)',
                border: OutlineInputBorder(),
              ),
              validator: (value) =>
                  value == null || value.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Full Name',
                border: OutlineInputBorder(),
              ),
              validator: (value) =>
                  value == null || value.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(
                labelText: 'Phone',
                border: OutlineInputBorder(),
              ),
              validator: (value) =>
                  value == null || value.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _line1Controller,
              decoration: const InputDecoration(
                labelText: 'Address Line 1',
                border: OutlineInputBorder(),
              ),
              validator: (value) =>
                  value == null || value.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _line2Controller,
              decoration: const InputDecoration(
                labelText: 'Address Line 2 (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _cityController,
                    decoration: const InputDecoration(
                      labelText: 'City',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Required'
                        : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _stateController,
                    decoration: const InputDecoration(
                      labelText: 'State',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _countryController,
                    decoration: const InputDecoration(
                      labelText: 'Country',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Required'
                        : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _postalController,
                    decoration: const InputDecoration(
                      labelText: 'Postal Code',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              value: _isDefault,
              onChanged: (value) => setState(() => _isDefault = value),
              title: const Text('Set as default address'),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _save,
                child: const Text('Save Address'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
