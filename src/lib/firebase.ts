import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// استبدل هذه القيم بقيم مشروعك من Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDxUrCK6Vs-GTVB7wa0ZfsbdRS-Su05MTA",
  authDomain: "hyper-catalog.firebaseapp.com",
  projectId: "hyper-catalog",
  storageBucket: "hyper-catalog.firebasestorage.app",
  messagingSenderId: "311778308274",
  appId: "1:311778308274:web:78480d5b6c2e8093e059ab",
  measurementId: "G-VDPXCQ6TQJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
