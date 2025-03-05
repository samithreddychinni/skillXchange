// Debug helper to check authentication state
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "./firebase"

export const debugAuthState = () => {
  const auth = getAuth()

  console.log("Current auth state:", auth.currentUser ? `Logged in as ${auth.currentUser.uid}` : "Not logged in")

  onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? `User: ${user.uid}` : "No user")
  })
}

export const checkUserDocument = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId)
    const docSnap = await getDoc(userRef)

    if (docSnap.exists()) {
      console.log("User document exists:", docSnap.data())
      return true
    } else {
      console.log("No user document found")
      return false
    }
  } catch (error) {
    console.error("Error checking user document:", error)
    return false
  }
}

