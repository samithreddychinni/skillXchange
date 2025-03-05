"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import MatchList from "@/components/match-list"
import Chat from "@/components/chat"
import VideoCall from "@/components/video-call"
import HowItWorksSection from "@/components/how-it-works-section"
import FeaturesSection from "@/components/features-section"
import FindMatchesButton from "@/components/find-matches-button"
import { useAuth } from "@/lib/context/auth-context"
import { presenceService } from "@/lib/services/presence-service"
import { userService } from "@/lib/services/user-service"
import { Loader2 } from "lucide-react"

export default function Dashboard() {
  const { user, loading, hasCompletedProfile, checkProfileCompletion } = useAuth()
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [selectedMatchUsername, setSelectedMatchUsername] = useState<string | null>(null)
  const [refreshMatchList, setRefreshMatchList] = useState(0)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  // Check if profile is complete
  useEffect(() => {
    const verifyProfileCompletion = async () => {
      if (!user) return

      setCheckingProfile(true)

      try {
        const profileComplete = await checkProfileCompletion()

        if (!profileComplete) {
          // Redirect to profile setup if profile is not complete
          router.push("/profile/setup")
        }
      } catch (error) {
        console.error("Error checking profile completion:", error)
      } finally {
        setCheckingProfile(false)
      }
    }

    if (user && !loading) {
      verifyProfileCompletion()
    }
  }, [user, loading, router, checkProfileCompletion])

  // Set user as online when dashboard loads
  useEffect(() => {
    if (user) {
      presenceService.setUserOnline(user.uid)

      // Set user as offline when component unmounts
      return () => {
        presenceService.setUserOffline(user.uid)
      }
    }
  }, [user])

  const handleSelectMatch = async (matchId: string) => {
    setSelectedMatchId(matchId)

    // Get username for the selected match
    if (user) {
      try {
        const matchProfile = await userService.getUserProfile(matchId)
        if (matchProfile) {
          setSelectedMatchUsername(matchProfile.username)
        }
      } catch (error) {
        console.error("Error getting match profile:", error)
      }
    }
  }

  const handleMatchesFound = () => {
    // Trigger a refresh of the match list
    setRefreshMatchList((prev) => prev + 1)
  }

  if (loading || checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <>
      <Navbar />
      <div className="bg-background">
        <div className="container mx-auto px-4 pt-[80px] pb-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold animate-slide-up">Dashboard</h1>
            <div className="flex gap-2">
              <FindMatchesButton onMatchesFound={handleMatchesFound} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Match List - 70% on desktop */}
            <div className="lg:col-span-7">
              <MatchList
                uid={user.uid}
                onSelectMatch={handleSelectMatch}
                key={refreshMatchList} // Force refresh when matches are found
              />
            </div>

            {/* Chat - 30% on desktop */}
            <div className="lg:col-span-3">
              <Chat
                uid={user.uid}
                recipientId={selectedMatchId}
                recipientUsername={selectedMatchUsername || undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Video Call Section - Full Width */}
      <div className="bg-secondary py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 animate-slide-up">Video Calling</h2>
          <VideoCall
            uid={user.uid}
            recipientId={selectedMatchId}
            recipientUsername={selectedMatchUsername || undefined}
          />
        </div>
      </div>

      {/* How It Works Section - Navy Blue */}
      <div className="bg-[#1e3a8a] text-white">
        <HowItWorksSection />
      </div>

      {/* Features Section - White */}
      <div className="bg-white">
        <FeaturesSection />
      </div>
    </>
  )
}

