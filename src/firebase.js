// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth, GoogleAuthProvider, signInWithRedirect, sendSignInLinkToEmail,
  isSignInWithEmailLink, signInWithEmailLink, getRedirectResult, signOut,
  connectAuthEmulator // <-- Auth Emulator
} from "firebase/auth";
import {
  getFirestore, connectFirestoreEmulator // <-- Firestore Emulator
} from 'firebase/firestore';
import {
  getStorage, connectStorageEmulator // <-- Storage Emulator
} from 'firebase/storage';
import {
  getFunctions, connectFunctionsEmulator // <-- Functions Emulator
} from 'firebase/functions';

// --- Firebase Configuration ---
// Ensure these environment variables are set in your .env file
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// --- Initialize Firebase App ---
const app = initializeApp(firebaseConfig);

// --- Initialize Firebase Services ---
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app); // Used for calling functions OR just to connect emulator
const googleProvider = new GoogleAuthProvider();

// --- Configure Google Auth Provider (Optional) ---
googleProvider.setCustomParameters({ prompt: 'select_account' });

// --- Connect to Emulators (Development ONLY!) ---
// Check if running in development and if emulator environment variables are set
// This helps prevent accidental connection attempts in production or other environments
const isDevelopment = process.env.NODE_ENV === 'development';
// Optionally use specific env vars to enable emulators
const useEmulators = isDevelopment && process.env.REACT_APP_USE_FIREBASE_EMULATORS === 'true';

if (useEmulators) {
  console.log("Development mode with Emulators ENABLED. Connecting...");
  try {
    // Default ports: Auth=9099, Firestore=8080, Storage=9199, Functions=5001
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('Auth Emulator connected.');
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Firestore Emulator connected.');
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('Storage Emulator connected.');
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Functions Emulator connected.');
  } catch (error) {
    console.error('Error connecting to Firebase emulators:', error);
  }
} else {
    console.log(`Running in ${process.env.NODE_ENV} mode. Connecting to live Firebase services (Emulators Disabled).`);
}

// --- Exports ---
export {
  auth,
  db,
  storage,
  functions, // Exporting this is fine, even if only used for emulator connection
  googleProvider,
  signInWithRedirect,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  getRedirectResult,
  signOut,
  app,
  analytics
};