"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare, Video } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { findMatchesService, type MatchResult } from "@/lib/services/find-matches-service"
import { useChat } from "@/lib/hooks/use-chat"
import { useCall } from "@/lib/hooks/use-call"

export default function MatchList() {
  const { user } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const { startChat } = useChat()
  const { startCall } = useCall()

  useEffect(() => {
    if (user?.uid) {
      fetchMatches()
    }
  }, [user?.uid])

  const fetchMatches = async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      // Get matches from the find-matches-service
      const results = await findMatchesService.findMatches(user.uid)

      // Always show at least 3 matches (use sample users if needed)
      if (results.length > 0) {
        setMatches(results.slice(0, 3))
      } else {
        // If no matches, we'll already have sample users from the service
        setMatches(results)
      }
    } catch (error) {
      console.error("Error fetching matches:", error)
      // Use sample users if there's an error
      const sampleResults = await findMatchesService.findMatches(user.uid)
      setMatches(sampleResults)
    } finally {
      setLoading(false)
    }
  }

  const handleChatClick = (match: MatchResult) => {
    if (!user?.uid) return

    // Start chat and navigate to find-matches page
    startChat(user.uid, match.user.uid, match.isSampleUser)
    router.push("/find-matches")
  }

  const handleCallClick = (match: MatchResult) => {
    if (!user?.uid) return

    // Start call and navigate to find-matches page
    startCall(user.uid, match.user.uid, match.isSampleUser)
    router.push("/find-matches")
  }

  const handleViewAllClick = () => {
    router.push("/find-matches")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Potential Matches</h2>
        <Button variant="outline" size="sm" onClick={handleViewAllClick}>
          View All
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {matches.map((match) => (
          <Card key={match.user.uid} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src={match.user.profileImage || "/placeholder.svg?height=100&width=100"}
                    alt={match.user.displayName}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{match.user.displayName}</h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {match.matchScore}% Match
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{match.matchReason}</p>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleChatClick(match)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Chat</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleCallClick(match)}
                    >
                      <Video className="h-4 w-4" />
                      <span>Call</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {matches.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No matches found. Try updating your profile with more skills.</p>
          </div>
        )}
      </div>
    </div>
  )
}

