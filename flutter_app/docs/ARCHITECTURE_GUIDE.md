# Architecture & Data Flow Guide

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Flutter App (main.dart)              │
│                     - Firebase Init                     │
│                     - Theme Configuration               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              App (lib/app/app.dart)                     │
│      ┌─────────────────────────────────────┐           │
│      │      MultiProvider Setup            │           │
│      ├─────────────────────────────────────┤           │
│      │  • AuthProvider (Firebase Auth)     │           │
│      │  • ProductProvider (Firestore)      │           │
│      │  • CartProvider (Local State)       │           │
│      │  • WishlistProvider (Local State)   │           │
│      └─────────────────────────────────────┘           │
│                                                          │
│      MaterialApp with Routes → Pages                    │
└──────────────────────────────────────────────────────────┘

                     │
       ┌─────────────┼─────────────┬──────────────┐
       │             │             │              │
       ▼             ▼             ▼              ▼
   ┌────────┐  ┌─────────┐  ┌────────┐  ┌──────────┐
   │ Login  │  │  Home   │  │ Detail │  │  Other   │
   │ Page   │  │  Page   │  │  Page  │  │  Pages   │
   └────────┘  └─────────┘  └────────┘  └──────────┘
       │             │             │              │
       └─────────────┼─────────────┴──────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │    Service Layer             │
        ├──────────────────────────────┤
        │  • FirebaseAuthService       │
        │  • FirestoreService          │
        │  • FirebaseStorageService    │
        └──────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │     Firebase Backend         │
        ├──────────────────────────────┤
        │  • Firebase Authentication   │
        │  • Cloud Firestore           │
        │  • Cloud Storage (Images)    │
        └──────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

### User Authentication Flow

```
┌────────────────────────────────────────────────────┐
│         EnhancedLoginPage (UI)                    │
│  - Displays login/register form                   │
│  - User enters email & password                   │
└────────────────────┬───────────────────────────────┘
                     │
                     │ User taps "Login" or "Register"
                     ▼
┌────────────────────────────────────────────────────┐
│      AuthProvider (State Management)              │
│  - Calls loginWithEmail() / registerWithEmail()   │
│  - Sets loading state                             │
│  - Sets error state if needed                     │
└────────────────────┬───────────────────────────────┘
                     │
                     │ Calls method
                     ▼
┌────────────────────────────────────────────────────┐
│   FirebaseAuthService (Service Layer)             │
│  - Firebase Auth API calls                        │
│  - Returns User or error                          │
└────────────────────┬───────────────────────────────┘
                     │
                     │ Network call
                     ▼
┌────────────────────────────────────────────────────┐
│         Firebase Authentication                   │
│  - Email/password verification                    │
│  - Creates user in Auth database                  │
│  - Returns auth token                             │
└────────────────────┬───────────────────────────────┘
                     │
                     │ Returns response
                     ▼
   ┌─────────────────────────────────────┐
   │  Success? Check                     │
   └────┬────────────────────────────┬───┘
        │ Yes                        │ No
        ▼                           ▼
   ┌──────────┐               ┌────────────┐
   │ notifyFor└──────►Set │  │Set error   │
   │   Listeners│      isAuthed=true   │  │ message
   └──────────┘               └────────────┘
        │                          │
        │ Triggers rebuild         │ Triggers rebuild
        ▼                          ▼
   EnhancedHomePage          Error SnackBar
   (auto navigation)         (on login page)
```

### Product Browsing Flow

```
┌────────────────────────────────────────────────────┐
│       EnhancedHomePage (UI)                       │
│  - Displays search bar                            │
│  - Displays category carousel                     │
│  - Displays product grid                          │
└─────────┬──────────────────────┬───────────────────┘
          │                      │
    Search input         Category selected
          │                      │
          ▼                      ▼
┌──────────────────┐  ┌────────────────────┐
│ ProductProvider  │  │ ProductProvider    │
│  ._updateSearch()│  │  ._updateCategory()│
└────────┬─────────┘  └─────────┬──────────┘
         │                      │
         └──────────┬───────────┘
                    │ notifyListeners()
                    ▼
         ProductProvider.products
              (filtered list)
                    │
                    │ Triggers GridView rebuild
                    ▼
          EnhancedProductCard
          (repeats for each)
                    │
              Card displays:
              ├─ Image
              ├─ Name
              ├─ Price
              ├─ Stock
              ├─ Heart (Wishlist)
              └─ Cart button
```

### Cart Management Flow

```
User taps "Add to Cart" on EnhancedProductCard
          │
          ▼
┌──────────────────────────────────┐
│   CartProvider                   │
│   .addProduct(Product product)   │
└────────┬───────────────────────┘
         │
         │ Modify cartItems list
         ▼
┌──────────────────────────────────┐
│   CartItem created:              │
│   - product: Product             │
│   - quantity: int                │
│   - totalPrice: getter           │
└────────┬───────────────────────┘
         │
         │ Add to cartItems
         ▼
   notifyListeners()
         │
         │ Triggers rebuilds
         ├─► BottomNavBar (badge updates)
         ├─► CartPage (list updates)
         └─► EnhancedProductCard (cart button state)
                    │
                    ▼
            User sees badge with count
            User can navigate to CartPage
```

### Wishlist Toggle Flow

```
User taps Heart button on EnhancedProductCard
          │
          ▼
┌────────────────────────────────┐
│   WishlistProvider             │
│   .toggleFavorite(productId)   │
└────────┬───────────────────────┘
         │
         │ Check if in favorites
         ▼
    ┌────────────────────┐
    │ If in Set:         │
    │ ├─ Remove it       │
    │ └─ Heart = border  │
    │                    │
    │ If not in Set:     │
    │ ├─ Add it          │
    │ └─ Heart = filled  │
    └────────┬───────────┘
             │
             ▼
    notifyListeners()
             │
    ┌────────┴────────────────────┐
    │        Triggers rebuilds     │
    ▼                              ▼
EnhancedProductCard        WishlistPage
(heart icon changes)       (list updates)
```

### Product Detail Navigation Flow

```
User taps on EnhancedProductCard (or see more)
          │
          ▼
┌──────────────────────────────┐
│  Navigator.push()            │
│  → ProductDetailEnhanced()   │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  ProductDetailEnhanced Page      │
│  - Receives Product as argument  │
│  - Displays:                     │
│    • Image carousel (PageView)   │
│    • Product info               │
│    • Quantity selector          │
│    • Price display              │
│    • Stock status               │
│    • Add to cart button         │
│    • Wishlist toggle in header  │
└──────────────┬───────────────────┘
               │
        User interactions:
        ├─ View images (swipe)
        ├─ Change quantity (±)
        ├─ Toggle wishlist (❤)
        └─ Add to cart (button)
                │
          ┌─────┴──────┬──────────┐
          ▼            ▼          ▼
     CartProvider  Wishlist   SnackBar
     .addProduct() .toggle()  .show()
```

### Profile & User Account Flow

```
User taps Profile tab in BottomNav
          │
          ▼
┌────────────────────────────────┐
│     ProfilePage                │
│     - Checks if user logged in │
└────────┬───────────────────────┘
         │
    ┌────┴─────┐
    │ Logged in?│
    ├─Yes      │ No
    ▼          ▼
┌────────┐   ┌──────────────┐
│Profile │   │UnAuth Error  │
│Avatar  │   │Message       │
│Email   │   │"Please Login"│
│Badges  │   └──────────────┘
│Menus   │
└────┬───┘
     │
  User taps:
  ├─ Orders → OrderPage
  ├─ Addresses → AddressPage
  ├─ Payments → PaymentPage
  ├─ Settings → SettingsPage
  ├─ Help → HelpPage
  └─ Logout → Dialog
       │
       ▼
   ┌───────────────────┐
   │ Logout Dialog     │
   │ "Are you sure?"   │
  ├─ Cancel → dismiss  │
  └─ Logout → call:
       │
       ▼
   AuthProvider
   .logout()
       │
       ▼
   SnackBar
   "Signed out"
       │
       ▼
   Redirect to
   EnhancedLoginPage
```

---

## 📦 Component Dependency Tree

```
App (MultiProvider)
├── AuthProvider
│   └── FirebaseAuthService
│       └── Firebase Auth
│           └── User
│
├── ProductProvider
│   └── FirestoreService
│       └── Firestore Database
│           └── Collection: products
│
├── CartProvider
│   └── CartItem (model)
│       └── Product (model)
│
├── WishlistProvider
│   └── Set<String> (productIds)
│
└── Pages
    ├── EnhancedLoginPage
    │   └── Consumer<AuthProvider>
    │
    ├── EnhancedHomePage
    │   ├── Consumer<ProductProvider>
    │   ├── Consumer<CartProvider> (badge)
    │   └── EnhancedProductCard
    │       ├── Consumer<WishlistProvider>
    │       └── Consumer<CartProvider>
    │
    ├── ProductDetailEnhanced
    │   ├── Consumer<WishlistProvider>
    │   └── Consumer<CartProvider>
    │
    ├── WishlistPage
    │   └── Consumer2<WishlistProvider, ProductProvider>
    │       └── EnhancedProductCard (repeated)
    │
    ├── CartPage
    │   └── Consumer<CartProvider>
    │
    └── ProfilePage
        └── Consumer<AuthProvider>
```

---

## 🔗 State Management Relationships

```
                    EnhancedHomePage
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
        ProductProvider CartProvider BottomNav
        (products list) (cart count) (badge)
              │           │           │
              │           │           │
              └───────┬───┴───┬───────┘
                      │       │
              EnhancedProductCard
                      │
            ┌─────────┼─────────┐
            │         │         │
            ▼         ▼         ▼
        Wishlist   CartProvider
        Provider   (add to cart)
        (toggle ❤) (update count)
            │         │
            └────┬────┴────┐
                 │         │
           WishlistPage  BottomNav
           (shows likes)  (updates badge)
```

---

## 🔄 Navigation Flow

```
                  App (MultiProvider)
                      │
        ┌─────────────┴──────────────┐
        │                            │
  Not Authenticated            Authenticated
        │                            │
        ▼                            ▼
  EnhancedLoginPage        EnhancedHomePage
        │                    (default route)
   ┌────┴────┐                    │
   │          │            ┌──────┼──────┐
 Login    Register   (tab selection)     │
   │          │        │  │  │  │       │
   ▼          ▼        ▼  ▼  ▼  ▼       ▼
 Auth Auth    │1│ │2│ │3│ │4│    Logout
 succ fail    Home Cart Wish Profile    │
   │    │       │    │   │     │        │
   └──┬─┘       │    │   │     │        │
      │         ▼    ▼   ▼     ▼        │
   setAuth  EnhancedHome CartPage WishlistPage
   (true)   HomePage    (list)   (grid)
            ├─ Search
            ├─ Categories
            ├─ GridView
            │  └─ Tap card
            │      ▼
            └─► ProductDetailEnhanced
                ├─ View images
                ├─ Add to cart
                └─ Toggle wishlist

                            ┌─────────┐
                            │LoginPage│
                            │(via icon)
                            └─────────┘
```

---

## 🏢 Folder Structure & Responsibility

```
lib/
├── main.dart                    ← App entry point
│                                 └─ Initializes Firebase
│                                 └─ Runs BootstrapApp
│
├── app/
│   └── app.dart                 ← Root widget
│                                 └─ Configures MultiProvider
│                                 └─ Sets up routes
│                                 └─ Applies theme
│
├── pages/                        ← Screen implementations
│   ├── enhanced_login_page.dart  #### 5 NEW PAGES ####
│   ├── enhanced_home_page.dart
│   ├── product_detail_enhanced.dart
│   ├── wishlist_page.dart
│   ├── profile_page.dart
│   │
│   ├── cart_page.dart            #### Original Pages ####
│   ├── home_page.dart
│   ├── login_page.dart
│   └── product_detail.dart
│
├── components/                   ← Reusable widgets
│   └── enhanced_product_card.dart #### NEW COMPONENT ####
│
├── providers/                    ← State management
│   ├── auth_provider.dart        └─ Manages auth state
│   ├── product_provider.dart     └─ Product list & filtering
│   ├── cart_provider.dart        └─ Shopping cart
│   └── wishlist_provider.dart    #### NEW PROVIDER ####
│                                  └─ Favorite products
│
├── models/                       ← Data classes
│   ├── user_model.dart
│   ├── product_model.dart
│   ├── category_model.dart
│   └── cart_item.dart
│
├── services/                     ← Backend integration
│   ├── firebase_auth_service.dart
│   ├── firestore_service.dart
│   └── firebase_storage_service.dart
│
└── lib/ (or utils/)             ← Utility functions
    ├── api.ts
    └── utils.ts
```

---

## 📊 State Evolution Timeline

```
User Session Lifecycle:
├─ App Starts
│  ├─ main.dart initializes Firebase
│  └─ app.dart sets up MultiProvider
│
├─ User NOT authenticated
│  ├─ AuthProvider.isAuthenticated = false
│  ├─ App displays EnhancedLoginPage
│  └─ Other providers inactive
│
├─ User Enters Credentials
│  ├─ EnhancedLoginPage gets input
│  ├─ AuthProvider.loginWithEmail() called
│  ├─ FirebaseAuthService.loginWithEmail()
│  ├─ Firebase Auth validates
│  └─ Returns success/error
│
├─ Authentication Success
│  ├─ AuthProvider.isAuthenticated = true
│  ├─ User object set in AuthProvider
│  ├─ App navigates to EnhancedHomePage
│  └─ ProductProvider, CartProvider active
│
├─ User Browses Products
│  ├─ ProductProvider gets Firestore stream
│  ├─ User interacts with products
│  ├─ CartProvider manages selections
│  ├─ WishlistProvider tracks favorites
│  └─ Providers notify listeners on changes
│
├─ User Logs Out
│  ├─ ProfilePage logout tapped
│  ├─ AuthProvider.logout() called
│  ├─ FirebaseAuthService.logout()
│  ├─ AuthProvider.isAuthenticated = false
│  └─ App navigates to EnhancedLoginPage
│
└─ App Continues...
   (Loop continues)
```

---

## 💼 Backend Service Interactions

```
┌──────────────────────────────────────────┐
│       Firebase Console                   │
├──────────────────────────────────────────┤
│  • Authentication (Email/Password)       │
│  • Firestore (Users, Products, Orders)   │
│  • Cloud Storage (Product images)        │
│  • Cloud Functions (Optional)            │
└─────────────┬──────────────────────────┘
              │
              │
     ┌────────┴──────────┬──────────────┐
     │                   │              │
     ▼                   ▼              ▼
┌──────────┐      ┌──────────┐   ┌──────────┐
│Firebase  │      │Firestore │   │Storage   │
│Auth      │      │Database  │   │(Images)  │
│          │      │          │   │          │
│Methods:  │      │Methods:  │   │Methods:  │
│- Create  │      │- Create  │   │- Upload  │
│- Login   │      │- Read    │   │- Download
│- Logout  │      │- Update  │   │- Delete  │
│- Reset   │      │- Delete  │   │          │
└────┬─────┘      └────┬──────┘   └────┬─────┘
     │                 │               │
     │ Called by       │ Called by     │ Called by
     │ Firebase        │ Firestore    │ Firebase
     │ AuthService     │ Service      │ StorageService
     └──────┬──────────┴───────┬──────┘
            │                  │
            ▼                  ▼
      Providers ◄────── Services
            │                  │
            ▼                  ▼
         Pages              UI Updates
```

---

## 🎯 Control Flow Example: Add to Cart

```
User taps "Add to Cart" button
          ↓
EnhancedProductCard.CartButton.onPressed()
          ↓
┌─────────────────────────────────────┐
│ Consumer<CartProvider>(builder:...)  │
│   onPressed: () {                   │
│     cartProvider.addProduct(         │
│       product: Product              │
│     )                               │
│   }                                 │
└────────────────┬────────────────────┘
                 ↓
        CartProvider.addProduct()
                 ↓
        Check cartItems list:
        ├─ Item exists?
        │  └─ Increase quantity
        └─ New item?
           └─ Create CartItem
                 ↓
        notifyListeners()
                 ↓
        ┌───────┴─────────┬─────────┐
        ↓                 ↓         ↓
  BottomNav Badge  CartPage   Snackbar
  Updates count    Refreshes  Shows "Added"
        ↓                 ↓         ↓
  Consumer<CartProvider> updates all listeners
```

---

## 🔐 Security & Error Handling Flow

```
API Call (any service)
    ↓
Try Block:
    ├─ Make Firebase call
    ├─ Validate response
    └─ Process data
    ↓
Catch Block (on error):
    ├─ Catch FirebaseAuthException
    ├─ Catch FirebaseException
    └─ Catch generic Exception
    ↓
Provider Sets Error:
    ├─ state.errorMessage = message
    └─ notifyListeners()
    ↓
Page Rebuilds:
    ├─ Consumer detects error
    ├─ Displays SnackBar
    └─ Shows user-friendly message
    ↓
User Sees Error:
    ├─ "Invalid email/password"
    ├─ "Network error. Try again."
    └─ "Something went wrong."
```

---

## Summary

**Key Architectural Principles:**

1. **Separation of Concerns**
   - Pages handle UI
   - Providers handle state
   - Services handle backend
   - Models handle data

2. **Unidirectional Data Flow**
   - User interaction → Provider → Service → Firebase → Response → Provider → UI Update

3. **Provider Pattern**
   - Efficient rebuilds with Consumer
   - Reactive state management
   - Clean dependency injection

4. **Firebase Integration**
   - Real-time Firestore streams
   - Async/await patterns
   - Error handling throughout

5. **Component Reusability**
   - EnhancedProductCard used in Home, Detail, and Wishlist
   - Providers shared across entire app

This architecture ensures:
✅ Scalability - easy to add features
✅ Maintainability - clear organization
✅ Testability - isolated components
✅ Performance - efficient updates
✅ Reliability - proper error handling
