// C:\Users\HP\Desktop\coding\CareSphere\frontend\src\Firebase\firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC7POku1ofofXT7jwo1L3Aq0O-0dD-uMUk",
  authDomain: "caresphere-c870c.firebaseapp.com",
  projectId: "caresphere-c870c",
  storageBucket: "caresphere-c870c.firebasestorage.app",
  messagingSenderId: "785418315133",
  appId: "1:785418315133:web:5238eb79d972d84cea9814",
  measurementId: "G-BR5CS7G9WM"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging };
