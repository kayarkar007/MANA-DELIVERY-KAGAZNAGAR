/**
 * firebaseClient.ts
 * ─────────────────────────────────────────────────────────────────────
 * Client-side Firebase app initialization.
 * Used ONLY in browser components ("use client").
 * DO NOT import this in server components or API routes.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID ?? "manadeliveryapp-f834c",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton — avoid re-initializing on hot reload
let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;

if (typeof window !== "undefined") {
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
}

export { firebaseAuth };
