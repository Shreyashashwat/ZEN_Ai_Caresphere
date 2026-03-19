import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Firebase environment variables missing.");
  throw new Error("Missing Firebase admin credentials environment variables");
}

privateKey = privateKey.replace(/\\n/g, "\n");

const serviceAccount = {
  project_id: projectId,
  client_email: clientEmail,
  private_key: privateKey,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;