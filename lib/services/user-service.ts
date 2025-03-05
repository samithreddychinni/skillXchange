import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  type QueryDocumentSnapshot,
  type Timestamp,
  startAfter,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "../firebase"

export interface UserProfile {
  uid: string
  username: string
  email: string
  displayName?: string
  photoURL?: string
  bio?: string
  skillsTeach?: string[]
  skillsLearn?: string[]
  experience?: string
  gender?: string
  age?: string
  nationality?: string
  locality?: string
  languages?: string[]
  availability?: any
  visibility?: "public" | "private"
  honorScore?: number
  ratings?: any[]
  createdAt?: string
  updatedAt?: Timestamp
  profileCreated?: boolean
}

export interface UserRating {
  ratedBy: string
  rating: number
  feedback?: string
  timestamp: string
}

export interface UserSearchParams {
  skillsTeach?: string[]
  skillsLearn?: string[]
  experience?: string
  languages?: string[]
  nationality?: string
  locality?: string
  lastDoc?: QueryDocumentSnapshot
  pageSize?: number
}

export const userService = {
  // Create a new user profile
  async createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      console.log("Creating user profile for:", uid)
      const userRef = doc(db, "users", uid)

      // Set default values
      const userData = {
        uid,
        ...data,
        honorScore: 50, // Default honor score
        profileCreated: false, // Default profile status
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: serverTimestamp(),
      }

      console.log("User data prepared:", { ...userData, uid })
      await setDoc(userRef, userData)
      console.log("User profile created successfully")
    } catch (error: any) {
      console.error("Error creating user profile:", error)

      // Enhanced error handling
      if (error.code === "permission-denied") {
        console.error("Permission denied. Check Firebase rules and authentication.")
        throw new Error("Permission denied. Please make sure you're properly logged in.")
      }

      throw error
    }
  },

  // Get user profile by ID
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, "users", uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        return { uid, ...userSnap.data() } as UserProfile
      }

      return null
    } catch (error) {
      console.error("Error getting user profile:", error)
      throw error
    }
  },

  // Update user profile
  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      console.log("Updating user profile for:", uid)
      console.log("Update data:", data)

      const userRef = doc(db, "users", uid)

      // Check if document exists first
      const docSnap = await getDoc(userRef)
      if (!docSnap.exists()) {
        console.log("Document doesn't exist, creating instead of updating")
        // If document doesn't exist, create it instead
        return this.createUserProfile(uid, data)
      }

      // Add updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(userRef, updateData)
      console.log("User profile updated successfully")
    } catch (error: any) {
      console.error("Error updating user profile:", error)

      // Enhanced error handling
      if (error.code === "permission-denied") {
        console.error("Permission denied. Check Firebase rules and authentication.")
        throw new Error("Permission denied. Please make sure you're properly logged in.")
      } else if (error.code === "not-found") {
        console.error("Document not found. Creating new document instead.")
        return this.createUserProfile(uid, data)
      }

      throw error
    }
  },

  // Upload profile image
  async uploadProfileImage(uid: string, file: File): Promise<string> {
    try {
      // Create a storage reference
      const storageRef = ref(storage, `profile-images/${uid}/${file.name}`)

      // Upload file
      await uploadBytes(storageRef, file)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Update user profile with new photo URL
      await this.updateUserProfile(uid, { photoURL: downloadURL })

      return downloadURL
    } catch (error) {
      console.error("Error uploading profile image:", error)
      throw error
    }
  },

  // Search users by username
  async searchUsersByUsername(searchTerm: string, maxResults = 10): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, "users")
      const q = query(
        usersRef,
        where("username", ">=", searchTerm),
        where("username", "<=", searchTerm + "\uf8ff"),
        where("visibility", "==", "public"),
        limit(maxResults),
      )

      const querySnapshot = await getDocs(q)
      const users: UserProfile[] = []

      querySnapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() } as UserProfile)
      })

      return users
    } catch (error) {
      console.error("Error searching users:", error)
      throw error
    }
  },

  // Get users by skill (for matching)
  async getUsersBySkill(skill: string, maxResults = 20): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, "users")
      const q = query(
        usersRef,
        where("skillsTeach", "array-contains", skill),
        where("visibility", "==", "public"),
        limit(maxResults),
      )

      const querySnapshot = await getDocs(q)
      const users: UserProfile[] = []

      querySnapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() } as UserProfile)
      })

      return users
    } catch (error) {
      console.error("Error getting users by skill:", error)
      throw error
    }
  },

  // Add rating to user
  async addRating(uid: string, rating: UserRating): Promise<void> {
    try {
      const userRef = doc(db, "users", uid)

      // Add rating to user's ratings array
      await updateDoc(userRef, {
        ratings: arrayUnion(rating),
        updatedAt: serverTimestamp(),
      })

      // Update honor score based on rating
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile
        const ratings = userData.ratings || []

        // Calculate new honor score (average of all ratings * 20)
        const totalRatings = ratings.length
        const sumRatings = ratings.reduce((sum, r) => sum + r.rating, 0)
        const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 2.5
        const newHonorScore = Math.round(averageRating * 20)

        // Update honor score
        await updateDoc(userRef, {
          honorScore: newHonorScore,
          updatedAt: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error("Error adding rating:", error)
      throw error
    }
  },

  // Get top rated users
  async getTopRatedUsers(maxResults = 10): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("visibility", "==", "public"), orderBy("honorScore", "desc"), limit(maxResults))

      const querySnapshot = await getDocs(q)
      const users: UserProfile[] = []

      querySnapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() } as UserProfile)
      })

      return users
    } catch (error) {
      console.error("Error getting top rated users:", error)
      throw error
    }
  },

  // Get user profile by username
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("username", "==", username), limit(1))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      return { uid: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as UserProfile
    }

    return null
  },

  // Search for users based on criteria
  async searchUsers(params: UserSearchParams): Promise<{
    users: UserProfile[]
    lastDoc: QueryDocumentSnapshot | null
  }> {
    const { skillsTeach, skillsLearn, experience, languages, nationality, locality, lastDoc, pageSize = 10 } = params

    const usersRef = collection(db, "users")
    let q = query(usersRef, where("visibility", "==", "public"), orderBy("honorScore", "desc"), limit(pageSize))

    // Add pagination if lastDoc is provided
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    // We'll do client-side filtering for the other criteria
    // since Firestore doesn't support array-contains queries on multiple fields
    const querySnapshot = await getDocs(q)

    const users: UserProfile[] = []
    let newLastDoc: QueryDocumentSnapshot | null = null

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserProfile

      // Apply filters
      let match = true

      if (skillsTeach && skillsTeach.length > 0) {
        const hasMatchingTeachSkill = skillsTeach.some((skill) =>
          userData.skillsTeach?.some((userSkill) => userSkill.toLowerCase().includes(skill.toLowerCase())),
        )
        if (!hasMatchingTeachSkill) match = false
      }

      if (match && skillsLearn && skillsLearn.length > 0) {
        const hasMatchingLearnSkill = skillsLearn.some((skill) =>
          userData.skillsLearn?.some((userSkill) => userSkill.toLowerCase().includes(skill.toLowerCase())),
        )
        if (!hasMatchingLearnSkill) match = false
      }

      if (match && experience && userData.experience !== experience) {
        match = false
      }

      if (match && languages && languages.length > 0) {
        const hasMatchingLanguage = languages.some((lang) => userData.languages?.includes(lang))
        if (!hasMatchingLanguage) match = false
      }

      if (match && nationality && userData.nationality !== nationality) {
        match = false
      }

      if (match && locality && !userData.locality?.toLowerCase().includes(locality.toLowerCase())) {
        match = false
      }

      if (match) {
        users.push({ uid: doc.id, ...userData })
      }

      // Update lastDoc for pagination
      newLastDoc = doc
    })

    return {
      users,
      lastDoc: querySnapshot.docs.length > 0 ? newLastDoc : null,
    }
  },
}

