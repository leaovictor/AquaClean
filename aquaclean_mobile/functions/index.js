/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

// Set max instances to control costs
setGlobalOptions({ maxInstances: 10 });

/**
 * Triggers when a booking document is updated.
 * Checks if the 'status' field has changed.
 * If changed, sends an FCM notification to the user.
 */
exports.onBookingStatusChange = onDocumentUpdated("bookings/{bookingId}", async (event) => {
    const oldData = event.data.before.data();
    const newData = event.data.after.data();

    // If status hasn't changed, do nothing
    if (oldData.status === newData.status) {
        return;
    }

    const userId = newData.userId;
    const newStatus = newData.status;
    const bookingId = event.params.bookingId;

    console.log(`Booking ${bookingId} status changed from ${oldData.status} to ${newStatus} for user ${userId}`);

    try {
        // 1. Get User's FCM Token
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        if (!userDoc.exists) {
            console.log(`User ${userId} not found`);
            return;
        }

        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken) {
            console.log(`No FCM token for user ${userId}`);
            return;
        }

        // 2. Prepare Notification Content
        let title = "Atualização de Agendamento";
        let body = `O status do seu agendamento mudou para ${newStatus}.`;

        switch (newStatus) {
            case "confirmed":
                title = "Agendamento Confirmado!";
                body = "Seu agendamento foi confirmado. Te esperamos lá!";
                break;
            case "washing":
                title = "Lavagem Iniciada 🚿";
                body = "Seu carro está tomando um banho agora.";
                break;
            case "drying":
                title = "Secagem em Andamento 💨";
                body = "Quase lá! Estamos dando o brilho final.";
                break;
            case "finished":
                title = "Seu carro brilha! ✨";
                body = "Tudo pronto. Pode vir retirar seu veículo.";
                break;
            case "cancelled":
                title = "Agendamento Cancelado";
                body = "Seu agendamento foi cancelado.";
                break;
        }

        // 3. Send FCM Message
        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                bookingId: bookingId,
                status: newStatus,
                click_action: "FLUTTER_NOTIFICATION_CLICK",
            },
            token: fcmToken,
        };

        await admin.messaging().send(message);
        console.log(`Notification sent to user ${userId}`);

        // 4. Save to Firestore Notification History (Optional, since app does it too, but good for redundancy)
        // If the app is already creating this in 'NotificationService.sendStatusNotification', we might duplicate.
        // However, 'NotificationService' runs on the CLIENT (Staff app).
        // If we want the SERVER to be the source of truth, we should rely on this Function.
        // For this MVP, the User asked for "Cloud Functions logic", so let's save it here too or instead.
        // To avoid duplication, we'll assume the Client App (Staff) MIGHT NOT write to 'users/{uid}/notifications'
        // if we rely on this function. But the previous step implemented it in the Client.
        // Let's keep this purely for PUSH (FCM) and let the Client handle the History write,
        // OR write to history here as a backup. Let's write to history here to be safe.

        await admin.firestore().collection("users").doc(userId).collection("notifications").add({
            title: title,
            body: body,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            bookingId: bookingId,
            isRead: false,
            type: "status_update"
        });

    } catch (error) {
        console.error("Error sending notification:", error);
    }
});
