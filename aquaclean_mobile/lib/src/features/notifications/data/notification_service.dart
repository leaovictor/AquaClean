import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../shared/models/booking.dart';
import '../../../shared/models/user_notification.dart';

class NotificationService {
  // These fields must be nullable or late initialized if we want to avoid initialization on unsupported platforms
  // But since they are final, we initialize them.
  // However, accessing .instance might crash on Linux for some plugins.
  // Let's use lazy initialization or try-catch if needed.
  // For now, we assume .instance is safe to call but methods might fail,
  // OR we just don't use them if platform is not supported.

  // FirebaseMessaging.instance might throw on Linux if not supported.
  // So we should only access it if supported.
  FirebaseMessaging? _firebaseMessaging;

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  StreamSubscription? _notificationSubscription;

  Future<void> initialize() async {
    if (!kIsWeb &&
        (Platform.isLinux || Platform.isWindows || Platform.isMacOS)) {
      print('Firebase Messaging not supported on Desktop. Skipping.');
      return;
    }

    try {
      _firebaseMessaging = FirebaseMessaging.instance;
    } catch (e) {
      print('Failed to get FirebaseMessaging instance: $e');
      return;
    }

    // 1. Request Permission
    NotificationSettings settings = await _firebaseMessaging!.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');
    } else {
      print('User declined or has not accepted permission');
      return;
    }

    // 2. Setup Local Notifications
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initializationSettings =
        InitializationSettings(android: initializationSettingsAndroid);

    await _localNotifications.initialize(initializationSettings);

    // 3. Foreground Message Handler
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (message.notification != null) {
        _showLocalNotification(
          title: message.notification?.title,
          body: message.notification?.body,
        );
      }
    });

    // 4. Token Refresh Handler
    _firebaseMessaging!.onTokenRefresh.listen((newToken) {
      _saveTokenToDatabase(newToken);
    });
  }

  Future<String?> getToken() async {
    if (_firebaseMessaging == null) return null;
    return await _firebaseMessaging!.getToken();
  }

  Future<void> _saveTokenToDatabase(String token) async {
    final user = _auth.currentUser;
    if (user != null) {
      await _firestore.collection('users').doc(user.uid).update({
        'fcmToken': token,
        'lastTokenUpdate': FieldValue.serverTimestamp(),
      });
    }
  }

  Future<void> saveCurrentToken() async {
    final token = await getToken();
    if (token != null) {
      await _saveTokenToDatabase(token);
    }
  }

  Future<void> _showLocalNotification({String? title, String? body}) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
          'high_importance_channel',
          'High Importance Notifications',
          importance: Importance.max,
          priority: Priority.high,
        );
    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
    );

    await _localNotifications.show(
      DateTime.now().millisecond,
      title,
      body,
      platformChannelSpecifics,
    );
  }

  // --- NEW LOGIC ---

  Future<void> sendStatusNotification({
    required String userId,
    required BookingStatus status,
    required String bookingId,
  }) async {
    String title = 'Atualização de Agendamento';
    String body = 'O status do seu agendamento mudou.';

    switch (status) {
      case BookingStatus.confirmed:
        title = 'Agendamento Confirmado!';
        body = 'Seu agendamento foi confirmado. Te esperamos lá!';
        break;
      case BookingStatus.washing:
        title = 'Lavagem Iniciada 🚿';
        body = 'Seu carro está tomando um banho agora.';
        break;
      case BookingStatus.drying:
        title = 'Secagem em Andamento 💨';
        body = 'Quase lá! Estamos dando o brilho final.';
        break;
      case BookingStatus.finished:
        title = 'Seu carro brilha! ✨';
        body = 'Tudo pronto. Pode vir retirar seu veículo.';
        break;
      case BookingStatus.cancelled:
        title = 'Agendamento Cancelado';
        body = 'Seu agendamento foi cancelado.';
        break;
      default:
        break;
    }

    final notification = UserNotification(
      id: '', // Firestore will generate
      title: title,
      body: body,
      timestamp: DateTime.now(),
      bookingId: bookingId,
      isRead: false,
    );

    await _firestore
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .add(notification.toJson());
  }

  void listenToUserNotifications(String userId) {
    _notificationSubscription?.cancel();
    _notificationSubscription = _firestore
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .orderBy('timestamp', descending: true)
        .limit(1)
        .snapshots()
        .listen((snapshot) {
          for (var change in snapshot.docChanges) {
            if (change.type == DocumentChangeType.added) {
              final data = change.doc.data();
              if (data != null) {
                // Check if notification is recent (e.g. within last 10 seconds)
                // to avoid showing old notifications on app start
                final timestamp = (data['timestamp'] as Timestamp).toDate();
                if (DateTime.now().difference(timestamp).inSeconds < 10) {
                  _showLocalNotification(
                    title: data['title'],
                    body: data['body'],
                  );
                }
              }
            }
          }
        });
  }

  void dispose() {
    _notificationSubscription?.cancel();
  }
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  final service = NotificationService();
  ref.onDispose(() => service.dispose());
  return service;
});
