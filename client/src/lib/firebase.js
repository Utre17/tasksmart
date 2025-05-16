import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
// Optionally export analytics if you want to use it
// export const analytics = getAnalytics(app); 