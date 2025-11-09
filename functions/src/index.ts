import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { CreateVehicleRequestSchema } from "@/shared/types";

admin.initializeApp();
const db = admin.firestore();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.use((req, res, next) => {
  // Enhanced logging to see more details about the incoming request
  console.log(`Request received: ${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.body,
  });
  next();
});

// Authentication Middleware
const authenticate = async (req: Request, res: Response, next: express.NextFunction) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
    return res.status(403).send("Unauthorized");
  }
  const idToken = req.headers.authorization.split("Bearer ")[1];
  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    (req as any).user = decodedIdToken;
    return next();
  } catch (e) {
    return res.status(403).send("Unauthorized");
  }
};

const mainApi = express.Router();
mainApi.use(authenticate); // Apply middleware to all routes within mainApi

// --- User Profile Routes ---
mainApi.get("/users/me", async (req: Request, res: Response) => {
  try {
    const userRef = db.collection("users").doc((req as any).user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // User does not exist in Firestore, let's create them.
      const newUser = {
        email: (req as any).user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await userRef.set(newUser);
      const createdUserDoc = await userRef.get();
      // Return 201 Created since we just created the user profile
      return res.status(201).send(createdUserDoc.data());
    }

    return res.status(200).send(userDoc.data());
  } catch (error) {
    console.error("Error in /users/me endpoint:", error);
    return res.status(500).send({ error: "Failed to fetch or create user data" });
  }
});

mainApi.put("/profile", async (req: Request, res: Response) => {
  try {
    const userRef = db.collection("users").doc((req as any).user.uid);
    await userRef.set({ ...req.body }, { merge: true });
    return res.status(200).send({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).send({ error: "Failed to update profile" });
  }
});


// --- Vehicle Routes ---
mainApi.get("/vehicles", async (req: Request, res: Response) => {
  try {
    const vehiclesSnapshot = await db.collection("vehicles").where("userId", "==", (req as any).user.uid).get();
    const vehicles: any[] = [];
    vehiclesSnapshot.forEach((doc) => {
      vehicles.push({ id: doc.id, ...doc.data() });
    });
    return res.status(200).send(vehicles);
  } catch (error) {
    return res.status(500).send({ error: "Failed to fetch vehicles" });
  }
});

mainApi.post("/vehicles", async (req: Request, res: Response) => {
  try {
    const validatedData = CreateVehicleRequestSchema.parse(req.body);
    const newVehicle = { ...validatedData, userId: (req as any).user.uid };
    const docRef = await db.collection("vehicles").add(newVehicle);
    return res.status(201).send({ id: docRef.id, ...newVehicle });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).send({ error: "Invalid vehicle data", details: error.issues });
    }
    console.error("Error adding vehicle:", error);
    return res.status(500).send({ error: "Failed to add vehicle" });
  }
});

// --- Appointment Routes ---
mainApi.get("/appointments", async (req: Request, res: Response) => {
  try {
    const appointmentsSnapshot = await db.collection("appointments").where("userId", "==", (req as any).user.uid).get();
    const appointments: any[] = [];
    appointmentsSnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() });
    });
    return res.status(200).send(appointments);
  } catch (error) {
    return res.status(500).send({ error: "Failed to fetch appointments" });
  }
});


app.use('/api', mainApi); // Mount the mainApi router at the /api path

// Add a catch-all route for debugging unmatched paths
app.use('*', (req, res) => {
  console.log('Catch-all route triggered for an unmatched path:', {
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
  });
  res.status(404).send(`Express server could not find this route. Path: ${req.path}`);
});

export const api = functions.https.onRequest(app);

export const hello = functions.https.onRequest((request, response) => {
  response.send("Hello from your new function!");
});

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user: admin.auth.DecodedIdToken;
    }
  }
}
