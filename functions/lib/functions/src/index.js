"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const zod_1 = require("zod");
const types_1 = require("@/shared/types");
admin.initializeApp();
const db = admin.firestore();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.path}`);
    next();
});
// Authentication Middleware
const authenticate = async (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
        return res.status(403).send("Unauthorized");
    }
    const idToken = req.headers.authorization.split("Bearer ")[1];
    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken;
        return next();
    }
    catch (e) {
        return res.status(403).send("Unauthorized");
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
        return res.status(200).send({ message: "Profile updated successfully" });
    }
    catch (error) {
        return res.status(500).send({ error: "Failed to update profile" });
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
        return res.status(200).send(vehicles);
    }
    catch (error) {
        return res.status(500).send({ error: "Failed to fetch vehicles" });
    }
});
app.post("/vehicles", async (req, res) => {
    try {
        const validatedData = types_1.CreateVehicleRequestSchema.parse(req.body);
        const newVehicle = Object.assign(Object.assign({}, validatedData), { userId: req.user.uid });
        const docRef = await db.collection("vehicles").add(newVehicle);
        return res.status(201).send(Object.assign({ id: docRef.id }, newVehicle));
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).send({ error: "Invalid vehicle data", details: error.issues });
        }
        console.error("Error adding vehicle:", error);
        return res.status(500).send({ error: "Failed to add vehicle" });
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
        return res.status(200).send(appointments);
    }
    catch (error) {
        return res.status(500).send({ error: "Failed to fetch appointments" });
    }
});
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map