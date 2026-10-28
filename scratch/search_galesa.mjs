import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

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

async function search() {
  const colls = ['master_data', 'clients', 'travels', 'operators'];
  for (const c of colls) {
    console.log(`Checking collection ${c}...`);
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`  Total docs in ${c}: ${snap.size}`);
      snap.forEach(d => {
        const str = JSON.stringify(d.data());
        if (str.toLowerCase().includes('galesa')) {
          console.log(`  MATCH in ${c} (id=${d.id}):`, str);
        }
      });
    } catch (e) {
      console.log(`  Error in ${c}:`, e.message);
    }
  }
  process.exit(0);
}

search();
