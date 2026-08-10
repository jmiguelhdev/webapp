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

const knownCollections = [
  'fiscal_invoices',
  'invoices',
  'sales',
  'ventas',
  'comprobantes',
  'afip_invoices',
  'transactions',
  'account_transactions',
  'accounting_entries',
  'frigorifico_entries',
  'clients',
  'faena_consumption',
  'travels'
];

async function inspect() {
  console.log('--- FIRESTORE INSPECTION --- Project:', process.env.VITE_FIREBASE_PROJECT_ID);
  for (const collName of knownCollections) {
    try {
      const snap = await getDocs(collection(db, collName));
      console.log(`Collection '${collName}': ${snap.size} docs`);
      if (!snap.empty && snap.size > 0) {
        const sampleDoc = snap.docs[0].data();
        console.log(`   Sample '${collName}':`, JSON.stringify(sampleDoc).substring(0, 180));
      }
    } catch (err) {
      console.log(`Error '${collName}':`, err.message);
    }
  }
  process.exit(0);
}

inspect();
