import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { userService, type UserProfile } from "./user-service"

export interface MatchResult {
  user: UserProfile
  matchReason: string
  matchScore: number
  isSampleUser?: boolean
}

// Sample users that will always be shown when no matches are found
const sampleUsers: UserProfile[] = [
  {
    uid: "sample-user-1",
    username: "alex_tech",
    displayName: "Alex Johnson",
    email: "alex@example.com",
    bio: "Software engineer with 5 years of experience. I love teaching programming concepts and learning about design.",
    location: "San Francisco, CA",
    profileImage: "/placeholder.svg?height=200&width=200",
    skillsToTeach: ["JavaScript", "React", "Node.js"],
    skillsToLearn: ["UI/UX Design", "Graphic Design", "Public Speaking"],
    availability: ["Weekends", "Evenings"],
    profileCreated: true,
    createdAt: new Date().toISOString(),
    isSampleUser: true,
  },
  {
    uid: "sample-user-2",
    username: "design_maria",
    displayName: "Maria Rodriguez",
    email: "maria@example.com",
    bio: "UI/UX designer passionate about creating beautiful interfaces. I'd love to teach design principles and learn coding.",
    location: "New York, NY",
    profileImage: "/placeholder.svg?height=200&width=200",
    skillsToTeach: ["UI/UX Design", "Figma", "Adobe XD"],
    skillsToLearn: ["JavaScript", "React", "Frontend Development"],
    availability: ["Weekdays", "Mornings"],
    profileCreated: true,
    createdAt: new Date().toISOString(),
    isSampleUser: true,
  },
  {
    uid: "sample-user-3",
    username: "photo_james",
    displayName: "James Wilson",
    email: "james@example.com",
    bio: "Professional photographer with 10 years of experience. I can teach photography and photo editing, and I want to learn web development.",
    location: "Chicago, IL",
    profileImage: "/placeholder.svg?height=200&width=200",
    skillsToTeach: ["Photography", "Photoshop", "Lightroom"],
    skillsToLearn: ["HTML", "CSS", "JavaScript"],
    availability: ["Weekends", "Afternoons"],
    profileCreated: true,
    createdAt: new Date().toISOString(),
    isSampleUser: true,
  },
]

export const findMatchesService = {
  // Find users who can teach skills that the current user wants to learn
  findMatches: async (userId: string): Promise<MatchResult[]> => {
    try {
      console.log("Finding matches for user:", userId)

      // Get current user profile
      const currentUserProfile = await userService.getUserProfile(userId)

      if (!currentUserProfile) {
        console.error("Current user profile not found")
        return generateSampleMatches()
      }

      const skillsToLearn = currentUserProfile.skillsToLearn || []

      if (skillsToLearn.length === 0) {
        console.log("User has no skills to learn")
        return generateSampleMatches()
      }

      console.log("User wants to learn:", skillsToLearn)

      // Find users who can teach the skills the current user wants to learn
      const usersRef = collection(db, "users")
      const matchResults: MatchResult[] = []

      // For each skill the user wants to learn, find users who can teach it
      for (const skill of skillsToLearn) {
        const q = query(usersRef, where("skillsToTeach", "array-contains", skill), where("profileCreated", "==", true))

        const querySnapshot = await getDocs(q)

        querySnapshot.forEach((docSnapshot) => {
          if (docSnapshot.id !== userId) {
            const userData = docSnapshot.data() as UserProfile

            // Calculate match score based on skill overlap
            const matchScore = calculateMatchScore(currentUserProfile, userData)

            // Generate match reason
            const matchReason = `${userData.displayName} can teach you ${skill}`

            // Add to results if not already added
            if (!matchResults.some((match) => match.user.uid === userData.uid)) {
              matchResults.push({
                user: userData,
                matchReason,
                matchScore,
              })
            }
          }
        })
      }

      // Sort by match score
      matchResults.sort((a, b) => b.matchScore - a.matchScore)

      // If no matches found, return sample users
      if (matchResults.length === 0) {
        console.log("No matches found, returning sample users")
        return generateSampleMatches()
      }

      console.log(`Found ${matchResults.length} matches`)
      return matchResults
    } catch (error) {
      console.error("Error finding matches:", error)
      return generateSampleMatches()
    }
  },
}

// Helper function to calculate match score
function calculateMatchScore(currentUser: UserProfile, potentialMatch: UserProfile): number {
  let score = 0

  // Skills the current user wants to learn that the potential match can teach
  const teachSkillMatches =
    currentUser.skillsToLearn?.filter((skill) => potentialMatch.skillsToTeach?.includes(skill)) || []

  // Skills the current user can teach that the potential match wants to learn
  const learnSkillMatches =
    currentUser.skillsToTeach?.filter((skill) => potentialMatch.skillsToLearn?.includes(skill)) || []

  // Each matching skill adds 10 points
  score += teachSkillMatches.length * 10
  score += learnSkillMatches.length * 10

  // Mutual skill exchange (both can teach each other) adds bonus points
  const mutualExchange = teachSkillMatches.length > 0 && learnSkillMatches.length > 0
  if (mutualExchange) {
    score += 20
  }

  // Availability match adds points
  const availabilityMatch =
    currentUser.availability?.some((time) => potentialMatch.availability?.includes(time)) || false

  if (availabilityMatch) {
    score += 15
  }

  return score
}

// Generate sample matches with realistic match reasons
function generateSampleMatches(): MatchResult[] {
  return sampleUsers.map((user) => {
    const skills = user.skillsToTeach || []
    const randomSkill = skills[Math.floor(Math.random() * skills.length)]

    return {
      user,
      matchReason: `${user.displayName} can teach you ${randomSkill}`,
      matchScore: 70 + Math.floor(Math.random() * 30), // Random score between 70-99
      isSampleUser: true,
    }
  })
}

