importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAEWnPNtu9gQt7C7FkkPRKGdIVgPm7adas",
  authDomain: "caresphere-474703.firebaseapp.com",
  projectId: "caresphere-474703",
  storageBucket: "caresphere-474703.firebasestorage.app",
  messagingSenderId: "748085462199",
  appId: "1:748085462199:web:9a5ad7823e59000c2bf932"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message ", payload);

  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: "/logo192.png",
  });
});