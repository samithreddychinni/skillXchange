import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from "firebase/auth"
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../firebase"
import { userService } from "./user-service"

export const authService = {
  // Register a new user
  async register(email: string, password: string, username: string): Promise<User> {
    try {
      console.log("Starting user registration for:", email)

      // Check if username is already taken
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", username), limit(1))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        console.log("Username already taken:", username)
        throw new Error("Username is already taken")
      }

      // Create user with email and password
      console.log("Creating Firebase auth user")
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log("User created successfully:", user.uid)

      // Update user profile with username
      console.log("Updating user profile with username")
      await updateProfile(user, {
        displayName: username,
      })

      // Create user profile in Firestore
      console.log("Creating user profile in Firestore")
      const userData = {
        uid: user.uid,
        username,
        email,
        displayName: username,
        createdAt: new Date().toISOString(),
        profileCreated: false, // Important: Track if profile is created
        honorScore: 50, // Default honor score
        visibility: "public",
      }

      // Use setDoc with merge option to ensure the document is created
      await setDoc(doc(db, "users", user.uid), userData, { merge: true })

      console.log("User registration completed successfully")
      return user
    } catch (error: any) {
      console.error("Error registering user:", error)

      // Enhanced error handling
      if (error.code === "auth/email-already-in-use") {
        throw new Error("This email is already registered. Please login instead.")
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Please enter a valid email address.")
      } else if (error.code === "auth/weak-password") {
        throw new Error("Password is too weak. Please use a stronger password.")
      } else if (error.code === "permission-denied") {
        throw new Error("Permission denied. Please check your connection and try again.")
      }

      throw error
    }
  },

  // Login with email and password
  async login(emailOrUsername: string, password: string): Promise<User> {
    try {
      // Determine if input is email or username
      const isEmail = emailOrUsername.includes("@")

      if (isEmail) {
        // Login with email
        const userCredential = await signInWithEmailAndPassword(auth, emailOrUsername, password)
        return userCredential.user
      } else {
        // Find user by username
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("username", "==", emailOrUsername), limit(1))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          throw new Error("Invalid username or password")
        }

        const userData = querySnapshot.docs[0].data()

        // Login with email
        const userCredential = await signInWithEmailAndPassword(auth, userData.email, password)
        return userCredential.user
      }
    } catch (error) {
      console.error("Error logging in:", error)
      throw error
    }
  },

  // Check if user has completed profile setup
  async hasCompletedProfileSetup(uid: string): Promise<boolean> {
    try {
      const userDocRef = doc(db, "users", uid)
      const userSnapshot = await getDoc(userDocRef)

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data()
        return userData.profileCreated === true
      }

      return false
    } catch (error) {
      console.error("Error checking profile setup:", error)
      throw error
    }
  },

  // Mark profile as created
  async markProfileAsCreated(uid: string): Promise<void> {
    try {
      const userDocRef = doc(db, "users", uid)
      await setDoc(
        userDocRef,
        {
          profileCreated: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      console.error("Error marking profile as created:", error)
      throw error
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error logging out:", error)
      throw error
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error("Error resetting password:", error)
      throw error
    }
  },

  // Update user email
  async updateUserEmail(newEmail: string, password: string): Promise<void> {
    try {
      const user = auth.currentUser

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, password)
      await reauthenticateWithCredential(user, credential)

      // Update email
      await updateEmail(user, newEmail)

      // Update email in Firestore
      await userService.updateUserProfile(user.uid, { email: newEmail })
    } catch (error) {
      console.error("Error updating email:", error)
      throw error
    }
  },

  // Update user password
  async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, newPassword)
    } catch (error) {
      console.error("Error updating password:", error)
      throw error
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser
  },
}

