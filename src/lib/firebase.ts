import {initializeApp, getApps, getApp, type FirebaseOptions} from 'firebase/app';
import {getAuth, GoogleAuthProvider} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import { getStorage } from "firebase/storage";

// Configurazione corretta e forzata per Accademia del Calcio
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyB5fGichZFydGTgcJcAy6GRjjN__XtMYCg",
  authDomain: "accademia-del-calcio-8b229.firebaseapp.com",
  projectId: "accademia-del-calcio-8b229",
  storageBucket: "accademia-del-calcio-8b229.appspot.com",
  messagingSenderId: "589870953259",
  appId: "1:589870953259:web:3d8e1e71e8c94f5a888b6e",
  measurementId: "G-NGCK00HRCV"
};


// Initialize the app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export {app, auth, db, storage, googleProvider};
