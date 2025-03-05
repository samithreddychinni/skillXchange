"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import ProfileSetup from "@/components/profile-setup"

export default function ProfileSetupPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // No authentication check needed for now
  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <>
      <Navbar />
      <ProfileSetup />
    </>
  )
}

