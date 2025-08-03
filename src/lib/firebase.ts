import {initializeApp, getApps, getApp, type FirebaseOptions} from 'firebase/app';
import {getAuth, GoogleAuthProvider} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import { getStorage } from "firebase/storage";

// Configurazione per il progetto originale Goal Getter
const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyDr-GqAmHkR4n36Y9jG5dE1B5z3c_c8vXc",
    authDomain: "goal-getter-nkpvt.firebaseapp.com",
    projectId: "goal-getter-nkpvt",
    storageBucket: "goal-getter-nkpvt.appspot.com",
    messagingSenderId: "370124898302",
    appId: "1:370124898302:web:90b7915c3905531d06180b"
};


// Initialize the app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export {app, auth, db, storage, googleProvider};
