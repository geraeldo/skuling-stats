import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCfRWv3kiNSLT3odL-bRwFurmVZ_fU-SiU",
  authDomain: "skuling-feedback.firebaseapp.com",
  projectId: "skuling-feedback",
  storageBucket: "skuling-feedback.appspot.com",
  messagingSenderId: "898678959294",
  appId: "1:898678959294:web:c744be02210406067d82ef",
};

initializeApp(firebaseConfig);

//init firestore
const db = getFirestore();

export { db };
