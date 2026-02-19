import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_app/models/address_model.dart';
import 'package:flutter_app/services/firestore_service.dart';

class AddressProvider extends ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();

  List<Address> _addresses = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  StreamSubscription<List<Address>>? _subscription;

  List<Address> get addresses => _addresses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Address? get defaultAddress {
    for (final address in _addresses) {
      if (address.isDefault) return address;
    }
    return _addresses.isNotEmpty ? _addresses.first : null;
  }

  void updateUser(String? userId) {
    if (_userId == userId) return;
    _userId = userId;
    _subscription?.cancel();
    _addresses = [];
    _error = null;

    if (userId == null) {
      _isLoading = false;
      notifyListeners();
      return;
    }

    _isLoading = true;
    notifyListeners();
    _subscription = _firestoreService.getAddresses(userId).listen(
      (addresses) {
        _addresses = addresses;
        _isLoading = false;
        _error = null;
        notifyListeners();
      },
      onError: (e) {
        _error = e.toString();
        _isLoading = false;
        notifyListeners();
      },
    );
  }

  Future<void> upsertAddress(Address address) async {
    if (_userId == null) return;
    final isFirst = _addresses.isEmpty;
    final shouldDefault = address.isDefault || isFirst;
    final normalized = Address(
      id: address.id,
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: shouldDefault,
      createdAt: address.createdAt,
      updatedAt: DateTime.now(),
    );
    await _firestoreService.upsertAddress(_userId!, normalized);
    if (shouldDefault) {
      await _firestoreService.setDefaultAddress(_userId!, address.id);
    }
  }

  Future<void> deleteAddress(String addressId) async {
    if (_userId == null) return;
    await _firestoreService.deleteAddress(_userId!, addressId);
  }

  Future<void> setDefault(String addressId) async {
    if (_userId == null) return;
    await _firestoreService.setDefaultAddress(_userId!, addressId);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
