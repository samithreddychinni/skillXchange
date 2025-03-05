"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type User, onAuthStateChanged } from "firebase/auth"
import { auth } from "../firebase"
import { authService } from "../services/auth-service"
import { userService, type UserProfile } from "../services/user-service"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  register: (email: string, password: string, username: string) => Promise<User>
  login: (emailOrUsername: string, password: string) => Promise<User>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserEmail: (newEmail: string, password: string) => Promise<void>
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>
  hasCompletedProfile: boolean
  checkProfileCompletion: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false)

  useEffect(() => {
    console.log("Setting up auth state listener")
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `User: ${user.uid}` : "No user")
      setUser(user)

      if (user) {
        // Fetch user profile
        try {
          console.log("Fetching user profile for:", user.uid)
          const profile = await userService.getUserProfile(user.uid)
          console.log("Profile fetched:", profile)
          setUserProfile(profile)

          // Check if profile is complete
          if (profile) {
            setHasCompletedProfile(profile.profileCreated === true)
            console.log("Profile completion status:", profile.profileCreated)
          } else {
            setHasCompletedProfile(false)
            console.log("No profile found, setting hasCompletedProfile to false")
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setHasCompletedProfile(false)
        }
      } else {
        setUserProfile(null)
        setHasCompletedProfile(false)
        console.log("No user, resetting profile state")
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const checkProfileCompletion = async (): Promise<boolean> => {
    if (!user) return false

    try {
      console.log("Checking profile completion for:", user.uid)
      const hasProfile = await authService.hasCompletedProfileSetup(user.uid)
      console.log("Profile completion check result:", hasProfile)
      setHasCompletedProfile(hasProfile)
      return hasProfile
    } catch (error) {
      console.error("Error checking profile completion:", error)
      return false
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    register: authService.register,
    login: authService.login,
    logout: authService.logout,
    resetPassword: authService.resetPassword,
    updateUserEmail: authService.updateUserEmail,
    updateUserPassword: authService.updateUserPassword,
    hasCompletedProfile,
    checkProfileCompletion,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}

