import { initializeApp } from 'firebase/app'; 
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
// Optionally import analytics if you want to use it
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAMPzum7f6VC95fA-1ZJ6vnmdRRA8WF4EU",
  authDomain: "tasksmart-73c97.firebaseapp.com",
  projectId: "tasksmart-73c97",
  storageBucket: "tasksmart-73c97.appspot.com",
  messagingSenderId: "786645516509",
  appId: "1:786645516509:web:41f8ed3286930433bd9b34",
  measurementId: "G-TYHJ7M8248"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistence to LOCAL to keep the user logged in
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

// Connect to auth emulator in development if needed
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  // Uncomment this line to use the Firebase Auth Emulator
  // connectAuthEmulator(auth, "http://localhost:9099");
}

export const analytics = getAnalytics(app);
// Optionally export analytics if you want to use it
// export const analytics = getAnalytics(app); 