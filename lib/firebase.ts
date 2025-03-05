// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAnalytics, isSupported } from "firebase/analytics"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOR_mIyCrT4Kdi-RRb2Mfp3tguQIxCd9E",
  authDomain: "skillxchange-aaedc.firebaseapp.com",
  projectId: "skillxchange-aaedc",
  storageBucket: "skillxchange-aaedc.appspot.com",
  messagingSenderId: "597223037531",
  appId: "1:597223037531:web:73b042ad007418d27e3d7e",
  measurementId: "G-MWQ1NYERMS",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Initialize Analytics conditionally (only in browser)
const initializeAnalytics = async () => {
  try {
    if (typeof window !== "undefined" && (await isSupported())) {
      return getAnalytics(app)
    }
  } catch (error) {
    console.error("Analytics initialization error:", error)
  }
  return null
}

// Initialize analytics
const analytics = initializeAnalytics()

export { auth, db, storage, analytics }

