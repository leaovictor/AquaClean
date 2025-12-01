# AquaClean Flutter Migration Plan

## 1. Project Overview
This document outlines the plan to recreate the AquaClean web application as a mobile application using **Flutter** and **Firebase**.
The goal is to replicate the existing functionality (Authentication, Dashboard, Booking, Admin Panel) using a robust mobile architecture.

## 2. Tech Stack
- **Frontend**: Flutter (Dart)
- **Backend**: Firebase
  - **Authentication**: Email/Password
  - **Database**: Cloud Firestore (NoSQL)
  - **Storage**: Firebase Storage (for assets/images)
  - **Functions**: Cloud Functions (if needed for complex logic)

## 3. Architecture
We will use a **Feature-First** architecture with **Riverpod** for state management.

```
lib/
├── main.dart
├── firebase_options.dart (generated)
├── src/
│   ├── app.dart (MaterialApp, Theme)
│   ├── routing/ (GoRouter configuration)
│   ├── features/
│   │   ├── auth/ (SignIn, SignUp, ForgotPassword)
│   │   ├── dashboard/ (User Dashboard)
│   │   ├── booking/ (Booking flow)
│   │   ├── profile/ (User Profile, Subscription)
│   │   ├── admin/ (Admin Dashboard, Management)
│   │   └── shared/ (Common widgets like WhatsAppWidget)
│   └── utils/ (Constants, Formatters)
```

## 4. Data Model (Firestore)
We will map the existing Supabase schema to Firestore collections:

### `users` (Collection)
- `uid` (Document ID)
- `email` (String)
- `role` (String: 'admin' | 'customer')
- `subscription_status` (String: 'active' | 'inactive' | 'pending')
- `created_at` (Timestamp)
- `profile_data` (Map: name, phone, etc.)

### `appointments` (Collection)
- `id` (Document ID)
- `user_id` (String)
- `date` (Timestamp)
- `service_type` (String)
- `status` (String: 'pending' | 'confirmed' | 'completed' | 'cancelled')
- `payment_status` (String)
- `details` (Map)

### `plans` (Collection)
- `id` (Document ID)
- `name` (String)
- `price` (Number)
- `features` (Array<String>)
- `active` (Boolean)

## 5. Setup Instructions (For User)
Please follow these steps to initialize the Flutter project:

1.  **Create the Project**:
    Run the following command in your terminal (in the directory where you want the project to live):
    ```bash
    flutter create aquaclean --org com.aquaclean --platforms android,ios
    ```

2.  **Add Dependencies**:
    Navigate into the new folder (`cd aquaclean`) and run:
    ```bash
    flutter pub add firebase_core firebase_auth cloud_firestore flutter_riverpod go_router intl google_fonts flutter_animate
    ```

3.  **Configure Firebase**:
    - Ensure you have the Firebase CLI installed (`npm install -g firebase-tools`).
    - Run `flutterfire configure` in the project root.
    - Select your Firebase project (create one if needed) and the platforms (Android, iOS).

4.  **Notify Me**:
    Once the project is created and Firebase is configured, let me know. I will then read this file and start implementing the code.

## 6. Implementation Phases (For Agent)
- **Phase 1**: Project Structure & Navigation.
- **Phase 2**: Authentication Implementation.
- **Phase 3**: User Dashboard & Booking.
- **Phase 4**: Admin Features.
- **Phase 5**: Polish & UI Refinement.
