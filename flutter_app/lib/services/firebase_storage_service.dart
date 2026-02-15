import 'package:firebase_storage/firebase_storage.dart';

class FirebaseStorageService {
  static final FirebaseStorageService _instance =
      FirebaseStorageService._internal();

  factory FirebaseStorageService() {
    return _instance;
  }

  FirebaseStorageService._internal();

  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Upload product image
  Future<String> uploadProductImage(String productId, String filePath) async {
    final ref = _storage.ref(
      'products/$productId/${DateTime.now().millisecondsSinceEpoch}',
    );
    final uploadTask = ref.putFile(filePath as dynamic);
    final snapshot = await uploadTask.whenComplete(() {});
    return await snapshot.ref.getDownloadURL();
  }

  // Upload user profile picture
  Future<String> uploadProfilePicture(String userId, String filePath) async {
    final ref = _storage.ref('users/$userId/profile');
    final uploadTask = ref.putFile(filePath as dynamic);
    final snapshot = await uploadTask.whenComplete(() {});
    return await snapshot.ref.getDownloadURL();
  }

  // Delete file
  Future<void> deleteFile(String path) {
    return _storage.ref(path).delete();
  }

  // Get download URL
  Future<String> getDownloadUrl(String path) {
    return _storage.ref(path).getDownloadURL();
  }
}
