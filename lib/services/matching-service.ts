import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "../firebase"
import type { UserProfile } from "./user-service"

export interface Match {
  userId: string
  username: string
  matchScore: number
  skillsTeach: string[]
  skillsLearn: string[]
  experience: string
  nationality?: string
  honorRating: "Poor" | "Moderate" | "High" | "Excellent"
  matchReason: string
  timestamp: Timestamp
}

export const matchingService = {
  // Find matches for a user based on complementary skills
  async findMatches(userId: string): Promise<Match[]> {
    try {
      // Get the user's profile
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        throw new Error("User not found")
      }

      const userData = userSnap.data() as UserProfile

      // Get all users with public visibility
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("visibility", "==", "public"))
      const querySnapshot = await getDocs(q)

      const potentialMatches: Match[] = []

      // Process each user to find matches
      querySnapshot.forEach((doc) => {
        // Skip the current user
        if (doc.id === userId) return

        const potentialMatch = doc.data() as UserProfile

        // Calculate match score based on complementary skills
        const matchScore = this.calculateMatchScore(userData, potentialMatch)

        // Only include users with a match score above 0
        if (matchScore > 0) {
          // Determine honor rating based on honor score
          const honorRating = this.getHonorRating(potentialMatch.honorScore)

          // Generate match reason
          const matchReason = this.generateMatchReason(userData, potentialMatch)

          potentialMatches.push({
            userId: doc.id,
            username: potentialMatch.username,
            matchScore,
            skillsTeach: potentialMatch.skillsTeach || [],
            skillsLearn: potentialMatch.skillsLearn || [],
            experience: potentialMatch.experience || "Beginner",
            nationality: potentialMatch.nationality,
            honorRating,
            matchReason,
            timestamp: Timestamp.now(),
          })
        }
      })

      // Sort matches by match score (highest first)
      potentialMatches.sort((a, b) => b.matchScore - a.matchScore)

      // Store matches in the user's matches collection
      await this.storeMatches(userId, potentialMatches)

      return potentialMatches
    } catch (error) {
      console.error("Error finding matches:", error)
      throw error
    }
  },

  // Calculate match score based on complementary skills
  calculateMatchScore(user1: UserProfile, user2: UserProfile): number {
    let score = 0

    // Check for complementary skills (user1 teaches what user2 wants to learn)
    for (const teachSkill of user1.skillsTeach || []) {
      for (const learnSkill of user2.skillsLearn || []) {
        if (this.skillsMatch(teachSkill, learnSkill)) {
          score += 10
        }
      }
    }

    // Check for complementary skills (user2 teaches what user1 wants to learn)
    for (const teachSkill of user2.skillsTeach || []) {
      for (const learnSkill of user1.skillsLearn || []) {
        if (this.skillsMatch(teachSkill, learnSkill)) {
          score += 10
        }
      }
    }

    // Bonus for language matches
    const commonLanguages = (user1.languages || []).filter((lang) => (user2.languages || []).includes(lang))
    score += commonLanguages.length * 2

    // Bonus for nationality match
    if (user1.nationality && user2.nationality && user1.nationality === user2.nationality) {
      score += 5
    }

    // Bonus for experience level match
    if (user1.experience === user2.experience) {
      score += 3
    }

    // Bonus for honor score
    if (user2.honorScore && user2.honorScore >= 80) {
      score += 5
    } else if (user2.honorScore && user2.honorScore >= 60) {
      score += 3
    } else if (user2.honorScore && user2.honorScore >= 40) {
      score += 1
    }

    return score
  },

  // Check if two skills match (case insensitive, partial match)
  skillsMatch(skill1: string, skill2: string): boolean {
    const s1 = skill1.toLowerCase().trim()
    const s2 = skill2.toLowerCase().trim()

    return s1 === s2 || s1.includes(s2) || s2.includes(s1)
  },

  // Get honor rating based on honor score
  getHonorRating(honorScore?: number): "Poor" | "Moderate" | "High" | "Excellent" {
    if (!honorScore) return "Moderate"
    if (honorScore >= 80) return "Excellent"
    if (honorScore >= 60) return "High"
    if (honorScore >= 40) return "Moderate"
    return "Poor"
  },

  // Generate match reason
  generateMatchReason(user1: UserProfile, user2: UserProfile): string {
    const matchingTeachLearn: string[] = []
    const matchingLearnTeach: string[] = []

    // Find skills where user1 teaches what user2 wants to learn
    for (const teachSkill of user1.skillsTeach || []) {
      for (const learnSkill of user2.skillsLearn || []) {
        if (this.skillsMatch(teachSkill, learnSkill)) {
          matchingTeachLearn.push(teachSkill)
        }
      }
    }

    // Find skills where user2 teaches what user1 wants to learn
    for (const teachSkill of user2.skillsTeach || []) {
      for (const learnSkill of user1.skillsLearn || []) {
        if (this.skillsMatch(teachSkill, learnSkill)) {
          matchingLearnTeach.push(teachSkill)
        }
      }
    }

    let reason = ""

    if (matchingTeachLearn.length > 0) {
      reason += `You can teach ${matchingTeachLearn.join(", ")}. `
    }

    if (matchingLearnTeach.length > 0) {
      reason += `${user2.username} can teach you ${matchingLearnTeach.join(", ")}. `
    }

    // Add language match if any
    const commonLanguages = (user1.languages || []).filter((lang) => (user2.languages || []).includes(lang))

    if (commonLanguages.length > 0) {
      reason += `You both speak ${commonLanguages.join(", ")}. `
    }

    // Add nationality match if any
    if (user1.nationality && user2.nationality && user1.nationality === user2.nationality) {
      reason += `You're both from ${user1.nationality}. `
    }

    return reason.trim()
  },

  // Store matches in the user's matches collection
  async storeMatches(userId: string, matches: Match[]): Promise<void> {
    const matchesRef = doc(db, "matches", userId)

    try {
      // Check if document exists
      const matchesSnap = await getDoc(matchesRef)

      if (matchesSnap.exists()) {
        // Update existing document
        await updateDoc(matchesRef, {
          matches,
          updatedAt: serverTimestamp(),
        })
      } else {
        // Create new document
        await setDoc(matchesRef, {
          userId,
          matches,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error("Error storing matches:", error)
      throw error
    }
  },

  // Get stored matches for a user
  async getStoredMatches(userId: string): Promise<Match[]> {
    const matchesRef = doc(db, "matches", userId)

    try {
      const matchesSnap = await getDoc(matchesRef)

      if (matchesSnap.exists()) {
        const data = matchesSnap.data()
        return data.matches || []
      }

      return []
    } catch (error) {
      console.error("Error getting stored matches:", error)
      throw error
    }
  },

  // Accept a match
  async acceptMatch(userId: string, matchUserId: string): Promise<void> {
    const userMatchesRef = doc(db, "userMatches", userId)

    try {
      const userMatchesSnap = await getDoc(userMatchesRef)

      if (userMatchesSnap.exists()) {
        // Update existing document
        await updateDoc(userMatchesRef, {
          acceptedMatches: arrayUnion(matchUserId),
          updatedAt: serverTimestamp(),
        })
      } else {
        // Create new document
        await setDoc(userMatchesRef, {
          userId,
          acceptedMatches: [matchUserId],
          rejectedMatches: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      // Check if the match is mutual
      await this.checkMutualMatch(userId, matchUserId)
    } catch (error) {
      console.error("Error accepting match:", error)
      throw error
    }
  },

  // Reject a match
  async rejectMatch(userId: string, matchUserId: string): Promise<void> {
    const userMatchesRef = doc(db, "userMatches", userId)

    try {
      const userMatchesSnap = await getDoc(userMatchesRef)

      if (userMatchesSnap.exists()) {
        // Update existing document
        await updateDoc(userMatchesRef, {
          rejectedMatches: arrayUnion(matchUserId),
          updatedAt: serverTimestamp(),
        })
      } else {
        // Create new document
        await setDoc(userMatchesRef, {
          userId,
          acceptedMatches: [],
          rejectedMatches: [matchUserId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error("Error rejecting match:", error)
      throw error
    }
  },

  // Check if a match is mutual
  async checkMutualMatch(userId1: string, userId2: string): Promise<boolean> {
    try {
      const userMatches1Ref = doc(db, "userMatches", userId1)
      const userMatches2Ref = doc(db, "userMatches", userId2)

      const [userMatches1Snap, userMatches2Snap] = await Promise.all([getDoc(userMatches1Ref), getDoc(userMatches2Ref)])

      if (!userMatches1Snap.exists() || !userMatches2Snap.exists()) {
        return false
      }

      const userMatches1Data = userMatches1Snap.data()
      const userMatches2Data = userMatches2Snap.data()

      const user1AcceptedUser2 = userMatches1Data.acceptedMatches?.includes(userId2) || false
      const user2AcceptedUser1 = userMatches2Data.acceptedMatches?.includes(userId1) || false

      const isMutualMatch = user1AcceptedUser2 && user2AcceptedUser1

      if (isMutualMatch) {
        // Create a mutual match document
        await this.createMutualMatch(userId1, userId2)
      }

      return isMutualMatch
    } catch (error) {
      console.error("Error checking mutual match:", error)
      throw error
    }
  },

  // Create a mutual match
  async createMutualMatch(userId1: string, userId2: string): Promise<void> {
    // Sort user IDs to ensure consistent document ID
    const sortedUserIds = [userId1, userId2].sort()
    const mutualMatchId = sortedUserIds.join("_")

    const mutualMatchRef = doc(db, "mutualMatches", mutualMatchId)

    try {
      const mutualMatchSnap = await getDoc(mutualMatchRef)

      if (!mutualMatchSnap.exists()) {
        // Create new mutual match document
        await setDoc(mutualMatchRef, {
          users: sortedUserIds,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: "active",
        })

        // Create a chat for the mutual match
        await this.createChatForMutualMatch(userId1, userId2)
      }
    } catch (error) {
      console.error("Error creating mutual match:", error)
      throw error
    }
  },

  // Create a chat for a mutual match
  async createChatForMutualMatch(userId1: string, userId2: string): Promise<void> {
    // Sort user IDs to ensure consistent document ID
    const sortedUserIds = [userId1, userId2].sort()
    const chatId = sortedUserIds.join("_")

    const chatRef = doc(db, "chats", chatId)

    try {
      const chatSnap = await getDoc(chatRef)

      if (!chatSnap.exists()) {
        // Create new chat document
        await setDoc(chatRef, {
          participants: sortedUserIds,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          messages: [],
        })
      }
    } catch (error) {
      console.error("Error creating chat for mutual match:", error)
      throw error
    }
  },

  // Get mutual matches for a user
  async getMutualMatches(userId: string): Promise<string[]> {
    try {
      const userMatchesRef = doc(db, "userMatches", userId)
      const userMatchesSnap = await getDoc(userMatchesRef)

      if (!userMatchesSnap.exists()) {
        return []
      }

      const userMatchesData = userMatchesSnap.data()
      const acceptedMatches = userMatchesData.acceptedMatches || []

      const mutualMatches: string[] = []

      // Check each accepted match to see if it's mutual
      for (const matchUserId of acceptedMatches) {
        const matchUserMatchesRef = doc(db, "userMatches", matchUserId)
        const matchUserMatchesSnap = await getDoc(matchUserMatchesRef)

        if (matchUserMatchesSnap.exists()) {
          const matchUserMatchesData = matchUserMatchesSnap.data()

          if (matchUserMatchesData.acceptedMatches?.includes(userId)) {
            mutualMatches.push(matchUserId)
          }
        }
      }

      return mutualMatches
    } catch (error) {
      console.error("Error getting mutual matches:", error)
      throw error
    }
  },
}

