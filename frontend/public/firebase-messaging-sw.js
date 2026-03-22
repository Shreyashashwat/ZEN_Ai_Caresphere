// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase
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

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Background message received:', payload);

  // Use data payload (sent from cron job) for consistency
  const data = payload.data || {};
  const medicineId = data.medicineId;
  const title = data.title || '💊 Medicine Reminder';
  const body = data.body || '';

  const notificationOptions = {
    body,
    icon: '/logo192.png',
    data, // keep all fields for click actions
    actions: [
      
    ]
  };

  // Show system notification
  self.registration.showNotification(title, notificationOptions);
});

// Handle notification click actions
self.addEventListener('notificationclick', function(event) {
  const medicineId = event.notification.data?.medicineId;

  if (event.action === 'snooze' && medicineId) {
    // Call backend to snooze the reminder
    event.waitUntil(
      fetch(`http://localhost:8000/api/v1/medicine/${medicineId}/snooze`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: 10 })
      })
      .then(() => console.log(`💤 Medicine ${medicineId} snoozed via SW click`))
      .catch(err => console.error('❌ Error snoozing via SW:', err))
    );
  }

  // Close the notification regardless
  event.notification.close();
});

// Optional: Listen for push events to log any raw payloads
self.addEventListener('push', function(event) {
  console.log('[SW] Raw push event:', event);
});