"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
admin.initializeApp();
const db = admin.firestore();
const app = express();
app.use(cors({ origin: true }));
// Authentication Middleware
const authenticate = async (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
        res.status(403).send("Unauthorized");
        return;
    }
    const idToken = req.headers.authorization.split("Bearer ")[1];
    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken;
        next();
        return;
    }
    catch (e) {
        res.status(403).send("Unauthorized");
        return;
    }
};
app.use(authenticate); // Apply middleware to all routes
// --- User Profile Routes ---
app.get("/users/me", async (req, res) => {
    try {
        const userDoc = await db.collection("users").doc(req.user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).send({ error: "User not found" });
        }
        return res.status(200).send(userDoc.data());
    }
    catch (error) {
        return res.status(500).send({ error: "Failed to fetch user data" });
    }
});
app.put("/profile", async (req, res) => {
    try {
        const userRef = db.collection("users").doc(req.user.uid);
        await userRef.set(Object.assign({}, req.body), { merge: true });
        res.status(200).send({ message: "Profile updated successfully" });
    }
    catch (error) {
        res.status(500).send({ error: "Failed to update profile" });
    }
});
// --- Vehicle Routes ---
app.get("/vehicles", async (req, res) => {
    try {
        const vehiclesSnapshot = await db.collection("vehicles").where("userId", "==", req.user.uid).get();
        const vehicles = [];
        vehiclesSnapshot.forEach((doc) => {
            vehicles.push(Object.assign({ id: doc.id }, doc.data()));
        });
        res.status(200).send(vehicles);
    }
    catch (error) {
        res.status(500).send({ error: "Failed to fetch vehicles" });
    }
});
app.post("/vehicles", async (req, res) => {
    try {
        const newVehicle = Object.assign(Object.assign({}, req.body), { userId: req.user.uid });
        const docRef = await db.collection("vehicles").add(newVehicle);
        res.status(201).send(Object.assign({ id: docRef.id }, newVehicle));
    }
    catch (error) {
        res.status(500).send({ error: "Failed to add vehicle" });
    }
});
// --- Appointment Routes ---
app.get("/appointments", async (req, res) => {
    try {
        const appointmentsSnapshot = await db.collection("appointments").where("userId", "==", req.user.uid).get();
        const appointments = [];
        appointmentsSnapshot.forEach((doc) => {
            appointments.push(Object.assign({ id: doc.id }, doc.data()));
        });
        res.status(200).send(appointments);
    }
    catch (error) {
        res.status(500).send({ error: "Failed to fetch appointments" });
    }
});
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map