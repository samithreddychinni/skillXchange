"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import EditProfile from "@/components/edit-profile"
import ProfileDisplay from "@/components/profile-display"
import InteractionHistory from "@/components/interaction-history"
import { useAuth } from "@/lib/context/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function EditProfilePage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  // Check if user is authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push("/login")
    } else {
      setLoading(false)
    }
  }, [user, router, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 pt-[80px] pb-8">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

        <Tabs defaultValue="view" className="w-full mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="view">View Profile</TabsTrigger>
            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
            <TabsTrigger value="history">Interaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-4">
            <ProfileDisplay />
          </TabsContent>

          <TabsContent value="edit" className="mt-4">
            <EditProfile />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <InteractionHistory userId={user?.uid || ""} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

