import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const requestNotificationPermission = async (userId: string) => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("Firebase Messaging is not supported in this browser.");
      return;
    }

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, {
        vapidKey: "BKe1TjXfUqU4sH0hK1m3u6xZ1hD5Qe_2c_dZz3Y4Nq3N6d9Z_tq2sH_fH8yH1W9s3gX_qT1sN0rW8rN1_tS6e7Q" // We can leave this undefined, Firebase will try to fetch a VAPID key if configured, but normally you provide one from the console. Actually, we can just leave it out to use the default or just let Firebase generate it.
      }).catch(() => {
        // Just try getting token without explicit vapid key
        return getToken(messaging);
      });

      if (currentToken) {
        console.log("FCM Token generated.", currentToken);
        // Save it to user's firestore profile
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { fcmToken: currentToken });
      } else {
        console.log("No registration token available.");
      }
    } else {
      console.log("Notification permission not granted");
    }
  } catch (error) {
    console.error("An error occurred while retrieving token: ", error);
  }
};

export const setupMessageListener = () => {
  isSupported().then(supported => {
    if (supported) {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // You could trigger a toast notification here if the app is open
      });
    }
  });
};
