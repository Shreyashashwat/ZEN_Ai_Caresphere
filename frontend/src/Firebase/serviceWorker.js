import { clientsClaim } from 'workbox-core';
import { skipWaiting } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';
skipWaiting();
clientsClaim();
const firebaseConfig = {
  apiKey: "AIzaSyAEWnPNtu9gQt7C7FkkPRKGdIVgPm7adas",
  authDomain: "caresphere-474703.firebaseapp.com",
  projectId: "caresphere-474703",
  storageBucket: "caresphere-474703.firebasestorage.app",
  messagingSenderId: "748085462199",
  appId: "1:748085462199:web:9a5ad7823e59000c2bf932"
};

initializeApp(firebaseConfig);
const messaging = getMessaging();

precacheAndRoute(self.__WB_MANIFEST);
