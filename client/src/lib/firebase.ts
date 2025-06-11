import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBeiUITLIDPXmkQE2PCWnLZ4pQCXfzOmpQ",
  authDomain: "cryptopilotai.firebaseapp.com",
  projectId: "cryptopilotai",
  storageBucket: "cryptopilotai.firebasestorage.app",
  messagingSenderId: "148334603177",
  appId: "1:148334603177:web:167db90bed63c83c3ff2b8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
