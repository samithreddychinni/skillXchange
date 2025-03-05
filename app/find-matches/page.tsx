"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import FindMatchesPage from "@/components/find-matches-page"
import { useAuth } from "@/lib/context/auth-context"
import { Loader2 } from "lucide-react"

export default function FindMatches() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, hasCompletedProfile, checkProfileCompletion } = useAuth()

  // Check if user is authenticated and has completed profile
  useEffect(() => {
    const verifyUser = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        const profileComplete = await checkProfileCompletion()

        if (!profileComplete) {
          router.push("/profile/setup")
        }
      } catch (error) {
        console.error("Error checking profile completion:", error)
      } finally {
        setLoading(false)
      }
    }

    verifyUser()
  }, [user, router, checkProfileCompletion])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="pt-[60px]">
        <FindMatchesPage />
      </div>
    </>
  )
}

