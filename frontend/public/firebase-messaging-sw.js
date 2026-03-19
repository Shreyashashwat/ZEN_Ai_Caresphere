importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC7POku1ofofXT7jwo1L3Aq0O-0dD-uMUk",
  authDomain: "caresphere-c870c.firebaseapp.com",
  projectId: "caresphere-c870c",
  storageBucket: "caresphere-c870c.firebasestorage.app",
  messagingSenderId: "785418315133",
  appId: "1:785418315133:web:5238eb79d972d84cea9814",
  measurementId: "G-BR5CS7G9WM"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Background message', payload);

  const notificationTitle = payload.notification?.title || 'CareSphere';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});