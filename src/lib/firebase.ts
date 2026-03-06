import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBVV0CT8LvN9w8QGjHVvDrfhkMUUZgNuaI",
  authDomain: "the-qurobai.firebaseapp.com",
  databaseURL: "https://the-qurobai-default-rtdb.firebaseio.com",
  projectId: "the-qurobai",
  storageBucket: "the-qurobai.firebasestorage.app",
  messagingSenderId: "996783380027",
  appId: "1:996783380027:web:0a5712681affa51769ee1e",
};

const app = initializeApp(firebaseConfig);

let messaging: Messaging | null = null;

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (e) {
      console.error("Firebase messaging init error:", e);
      return null;
    }
  }
  return messaging;
}

export async function getFCMToken(): Promise<string | null> {
  const m = getFirebaseMessaging();
  if (!m) return null;
  try {
    const token = await getToken(m, {
      vapidKey: "", // Will use Firebase's default
    });
    return token;
  } catch (e) {
    console.error("FCM token error:", e);
    return null;
  }
}

export function onFCMMessage(callback: (payload: any) => void) {
  const m = getFirebaseMessaging();
  if (!m) return () => {};
  return onMessage(m, callback);
}

export { app };
