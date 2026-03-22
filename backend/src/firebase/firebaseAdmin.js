// import admin from "firebase-admin";
// import serviceAccount from "./serviceAccountKey.json" assert { type: "json" }; // Download from Firebase → Project Settings → Service Accounts

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// export default admin;


// import admin from "firebase-admin";
// import dotenv from "dotenv";
// dotenv.config();

// const firebaseConfig = {
//   apiKey: "AIzaSyAEWnPNtu9gQt7C7FkkPRKGdIVgPm7adas",
//   authDomain: "caresphere-474703.firebaseapp.com",
//   projectId: "caresphere-474703",
//   storageBucket: "caresphere-474703.firebasestorage.app",
//   messagingSenderId: "748085462199",
//   appId: "1:748085462199:web:9a5ad7823e59000c2bf932"
// };

// // const firebaseConfig= {
// //   type: process.env.FIREBASE_TYPE,
// //   project_id: process.env.FIREBASE_PROJECT_ID,
// //   private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
// //   client_email: process.env.FIREBASE_CLIENT_EMAIL,
// //   client_id: process.env.FIREBASE_CLIENT_ID,
// //   auth_uri: process.env.FIREBASE_AUTH_URI,
// //   token_uri: process.env.FIREBASE_TOKEN_URI,
// //   auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
// //   client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
// // };

// admin.initializeApp({
//   credential: admin.credential.cert(firebaseConfig)
// });

// export default admin;




// import admin from "firebase-admin";
// import path from "path";
// import { readFileSync } from "fs";

// const keyPath = path.resolve(process.cwd(), "serviceAccountKey.json");
// // or if JSON is inside src/firebase folder: path.resolve(process.cwd(), "src", "firebase", "serviceAccountKey.json")
// const keyJson = JSON.parse(readFileSync(keyPath, "utf-8"));


// // const key = JSON.parse(readFileSync("./serviceAccountKey.json", "utf-8"));
// admin.initializeApp({
//   credential: admin.credential.cert(keyJson),
// });
// export default admin;


import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;


if (!projectId || !clientEmail || !privateKey) {
  console.warn("WARNING: Firebase environment variables missing. Firebase Admin not initialized.");
} else {
  // Replace literal "\n" (two characters) with real newlines
  privateKey = privateKey.replace(/\\n/g, "\n");

  // Build the service account object
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

