// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCp4WU0H44LdlmWgHqtyPd0uHNDUbhNkQs",
  authDomain: "diamondhacks-8ca9f.firebaseapp.com",
  projectId: "diamondhacks-8ca9f",
  storageBucket: "diamondhacks-8ca9f.firebasestorage.app",
  messagingSenderId: "827334911833",
  appId: "1:827334911833:web:5a95c6f03eb5e899a2ce48",
  measurementId: "G-34PKKY372F"
};

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth service
const auth: Auth = getAuth(app);

// Export the instances
export { app, auth };