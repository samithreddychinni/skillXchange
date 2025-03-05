"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"
import { matchingService } from "@/lib/services/matching-service"
import { toast } from "@/components/ui/use-toast"

interface FindMatchesButtonProps {
  onMatchesFound?: () => void
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export default function FindMatchesButton({
  onMatchesFound,
  variant = "default",
  size = "default",
  className = "",
}: FindMatchesButtonProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleFindMatches = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to find matches.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Find matches for the current user
      const matches = await matchingService.findMatches(user.uid)

      // Show success message
      toast({
        title: "Matches Found",
        description: `Found ${matches.length} potential matches for you.`,
        variant: "success",
      })

      // Call the callback if provided
      if (onMatchesFound) {
        onMatchesFound()
      }
    } catch (error) {
      console.error("Error finding matches:", error)
      toast({
        title: "Error Finding Matches",
        description: "An error occurred while finding matches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleFindMatches} disabled={loading || !user} variant={variant} size={size} className={className}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Finding Matches...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Find Matches
        </>
      )}
    </Button>
  )
}

