import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from "./firebaseServiceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = getFirestore();
export const auth = getAuth();
