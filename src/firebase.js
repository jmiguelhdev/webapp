// webApp/src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBoPbWqksM2RmZTD1x3-ykWUVZzfXlM2d8",
  authDomain: "kmppampalogs.firebaseapp.com",
  projectId: "kmppampalogs",
  storageBucket: "kmppampalogs.firebasestorage.app",
  messagingSenderId: "672982424982",
  appId: "1:672982424982:web:5c819788e0c33ba54f91b7",
  measurementId: "G-NS0X4WSHV4"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
