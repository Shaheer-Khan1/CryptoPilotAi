import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeiUITLIDPXmkQE2PCWnLZ4pQCXfzOmpQ",
  authDomain: "cryptopilotai.firebaseapp.com",
  projectId: "cryptopilotai",
  storageBucket: "cryptopilotai.firebasestorage.app",
  messagingSenderId: "148334603177",
  appId: "1:148334603177:web:167db90bed63c83c3ff2b8"
};

// Debug: Print config on load
console.log('🔧 Firebase initializing with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence (helps with network issues)
try {
  // Note: This should only be called once, before any other Firestore operations
  if (typeof window !== 'undefined') {
    import('firebase/firestore').then(({ enableNetwork, connectFirestoreEmulator }) => {
      console.log('🔗 Firestore network enabled');
    }).catch(err => {
      console.warn('⚠️ Firestore network setup warning:', err);
    });
  }
} catch (error) {
  console.warn('⚠️ Firestore offline setup warning:', error);
}

export { app, auth, db };
