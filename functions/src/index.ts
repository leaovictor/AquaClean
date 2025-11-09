import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));

app.get("/hello", (req, res) => {
  res.send("Hello from Firebase!");
});

export const api = functions.https.onRequest(app);
