
import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;


if (!projectId || !clientEmail || !privateKey) {
  console.warn("WARNING: Firebase environment variables missing. Firebase Admin not initialized.");
} else {
  privateKey = privateKey.replace(/\\n/g, "\n");

  const serviceAccount = {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
}

export default admin;
