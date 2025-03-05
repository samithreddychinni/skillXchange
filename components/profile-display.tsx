"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, MapPin, Globe, Calendar, Award, BookOpen, Code } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"
import { userService, type UserProfile } from "@/lib/services/user-service"

interface ProfileDisplayProps {
  userId?: string // Optional - if not provided, displays current user's profile
}

export default function ProfileDisplay({ userId }: ProfileDisplayProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, userProfile } = useAuth()

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        // If userId is provided, fetch that user's profile
        if (userId) {
          const fetchedProfile = await userService.getUserProfile(userId)
          setProfile(fetchedProfile)
        }
        // Otherwise, use the current user's profile from context or fetch it
        else if (user) {
          if (userProfile) {
            setProfile(userProfile)
          } else {
            const fetchedProfile = await userService.getUserProfile(user.uid)
            setProfile(fetchedProfile)
          }
        } else {
          setError("No user found")
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId, user, userProfile])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">{error || "Profile not found"}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          {profile.username || profile.displayName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>Experience: {profile.experience || "Not specified"}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Location: {profile.locality || "Not specified"}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>Nationality: {profile.nationality || "Not specified"}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Availability: {typeof profile.availability === "string" ? profile.availability : "Flexible"}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                Skills I Can Teach
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skillsTeach && profile.skillsTeach.length > 0 ? (
                  profile.skillsTeach.map((skill) => (
                    <Badge key={`teach-${skill}`} variant="outline" className="bg-primary/10">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No skills specified</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Skills I Want to Learn
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skillsLearn && profile.skillsLearn.length > 0 ? (
                  profile.skillsLearn.map((skill) => (
                    <Badge key={`learn-${skill}`} variant="outline" className="bg-secondary/50">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No skills specified</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {profile.languages && profile.languages.length > 0 ? (
                  profile.languages.map((language) => (
                    <Badge key={language} variant="outline">
                      {language}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No languages specified</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

