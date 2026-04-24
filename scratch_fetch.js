import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchCollection(name) {
  try {
    const q = query(collection(db, name), limit(1));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`--- ${name} ---`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error fetching ${name}:`, error.message);
  }
}

async function main() {
  await fetchCollection("choferes");
  await fetchCollection("camiones");
  await fetchCollection("jaulas");
  await fetchCollection("viajes");
  process.exit(0);
}

main();
