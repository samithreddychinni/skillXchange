"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/lib/context/auth-context"
import { userService } from "@/lib/services/user-service"
import { authService } from "@/lib/services/auth-service"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// List of skills for dropdown
const skillOptions = [
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "HTML/CSS",
  "UI/UX Design",
  "Data Science",
  "Machine Learning",
  "Mobile Development",
  "DevOps",
  "Cooking",
  "Photography",
  "Writing",
  "Public Speaking",
  "Graphic Design",
  "Music",
  "Painting",
  "Dancing",
  "Yoga",
  "Meditation",
  "Language Learning",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
]

// List of nationalities
const nationalities = [
  "Afghan",
  "Albanian",
  "Algerian",
  "American",
  "Andorran",
  "Angolan",
  "Argentine",
  "Armenian",
  "Australian",
  "Austrian",
  "Azerbaijani",
  "Bahamian",
  "Bahraini",
  "Bangladeshi",
  "Barbadian",
  "Belarusian",
  "Belgian",
  "Belizean",
  "Beninese",
  "Bhutanese",
  "Bolivian",
  "Bosnian",
  "Brazilian",
  "British",
  "Bruneian",
  "Bulgarian",
  "Burkinabe",
  "Burmese",
  "Burundian",
  "Cambodian",
  "Cameroonian",
  "Canadian",
  "Cape Verdean",
  "Central African",
  "Chadian",
  "Chilean",
  "Chinese",
  "Colombian",
  "Comoran",
  "Congolese",
  "Costa Rican",
  "Croatian",
  "Cuban",
  "Cypriot",
  "Czech",
  "Danish",
  "Djiboutian",
  "Dominican",
  "Dutch",
  "Ecuadorian",
  "Egyptian",
  "Emirati",
  "Equatorial Guinean",
  "Eritrean",
  "Estonian",
  "Ethiopian",
  "Fijian",
  "Filipino",
  "Finnish",
  "French",
  "Gabonese",
  "Gambian",
  "Georgian",
  "German",
  "Ghanaian",
  "Greek",
  "Grenadian",
  "Guatemalan",
  "Guinean",
  "Guyanese",
  "Haitian",
  "Honduran",
  "Hungarian",
  "Icelandic",
  "Indian",
  "Indonesian",
  "Iranian",
  "Iraqi",
  "Irish",
  "Israeli",
  "Italian",
  "Ivorian",
  "Jamaican",
  "Japanese",
  "Jordanian",
  "Kazakhstani",
  "Kenyan",
  "Korean",
  "Kuwaiti",
  "Kyrgyz",
  "Laotian",
  "Latvian",
  "Lebanese",
  "Liberian",
  "Libyan",
  "Lithuanian",
  "Luxembourgish",
  "Macedonian",
  "Malagasy",
  "Malawian",
  "Malaysian",
  "Maldivian",
  "Malian",
  "Maltese",
  "Mauritanian",
  "Mauritian",
  "Mexican",
  "Moldovan",
  "Monacan",
  "Mongolian",
  "Montenegrin",
  "Moroccan",
  "Mozambican",
  "Namibian",
  "Nepalese",
  "New Zealand",
  "Nicaraguan",
  "Nigerian",
  "Norwegian",
  "Omani",
  "Pakistani",
  "Panamanian",
  "Papua New Guinean",
  "Paraguayan",
  "Peruvian",
  "Polish",
  "Portuguese",
  "Qatari",
  "Romanian",
  "Russian",
  "Rwandan",
  "Saint Lucian",
  "Salvadoran",
  "Samoan",
  "Saudi",
  "Senegalese",
  "Serbian",
  "Seychellois",
  "Sierra Leonean",
  "Singaporean",
  "Slovak",
  "Slovenian",
  "Somali",
  "South African",
  "Spanish",
  "Sri Lankan",
  "Sudanese",
  "Surinamese",
  "Swedish",
  "Swiss",
  "Syrian",
  "Taiwanese",
  "Tajik",
  "Tanzanian",
  "Thai",
  "Togolese",
  "Trinidadian",
  "Tunisian",
  "Turkish",
  "Turkmen",
  "Ugandan",
  "Ukrainian",
  "Uruguayan",
  "Uzbekistani",
  "Venezuelan",
  "Vietnamese",
  "Yemeni",
  "Zambian",
  "Zimbabwean",
]

export default function ProfileSetup() {
  const [name, setName] = useState("")
  const [skillsTeach, setSkillsTeach] = useState<string[]>([])
  const [skillsLearn, setSkillsLearn] = useState<string[]>([])
  const [experience, setExperience] = useState("Beginner")
  const [gender, setGender] = useState("")
  const [age, setAge] = useState("")
  const [nationality, setNationality] = useState("")
  const [locality, setLocality] = useState("")
  const [languages, setLanguages] = useState<string[]>([])
  const [availability, setAvailability] = useState<Record<string, string[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  })
  const [visibility, setVisibility] = useState("public")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const router = useRouter()
  const { user } = useAuth()

  // Verify if user has already created a profile
  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        const hasProfile = await authService.hasCompletedProfileSetup(user.uid)
        if (hasProfile) {
          // User already has a profile, redirect to dashboard
          toast({
            title: "Profile Already Set Up",
            description: "You've already completed your profile.",
            duration: 3000,
          })
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking profile status:", error)
      } finally {
        setIsVerifying(false)
      }
    }

    checkProfileStatus()
  }, [user, router])

  const daysOfWeek = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" },
  ]

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const minute = i % 2 === 0 ? "00" : "30"
    const formattedHour = hour < 10 ? `0${hour}` : hour
    return `${formattedHour}:${minute}`
  })

  const commonLanguages = [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Hindi",
    "Arabic",
    "Portuguese",
    "Russian",
  ]

  const toggleTimeSlot = (day: string, time: string) => {
    setAvailability((prev) => {
      const updatedDay = prev[day] || []
      const newTimes = updatedDay.includes(time) ? updatedDay.filter((t) => t !== time) : [...updatedDay, time]

      return {
        ...prev,
        [day]: newTimes,
      }
    })
  }

  const toggleLanguage = (language: string) => {
    setLanguages((prev) => (prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]))
  }

  const toggleSkillTeach = (skill: string) => {
    setSkillsTeach((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const toggleSkillLearn = (skill: string) => {
    setSkillsLearn((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const validateForm = () => {
    if (!name.trim()) {
      setError("Please enter your name")
      return false
    }
    if (skillsTeach.length === 0) {
      setError("Please select at least one skill you can teach")
      return false
    }
    if (skillsLearn.length === 0) {
      setError("Please select at least one skill you want to learn")
      return false
    }
    if (!gender) {
      setError("Please select your gender")
      return false
    }
    if (!age) {
      setError("Please enter your age")
      return false
    }
    if (!nationality) {
      setError("Please select your nationality")
      return false
    }
    if (!locality.trim()) {
      setError("Please enter your locality")
      return false
    }
    if (languages.length === 0) {
      setError("Please select at least one language")
      return false
    }

    // Check if at least one time slot is selected
    const hasTimeSlot = Object.values(availability).some((times) => times.length > 0)
    if (!hasTimeSlot) {
      setError("Please select at least one availability time slot")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to set up your profile")
      return
    }

    setError("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      console.log("Starting profile setup for user:", user.uid)

      // Update profile in Firebase
      await userService.updateUserProfile(user.uid, {
        username: name,
        displayName: name,
        skillsTeach,
        skillsLearn,
        experience,
        gender,
        age,
        nationality,
        locality,
        languages,
        availability,
        visibility: visibility as "public" | "private",
        honorScore: 50, // Default honor score for new users
        profileCreated: true, // Mark profile as created
      })

      console.log("Profile updated successfully")

      // Also mark profile as created in auth service
      await authService.markProfileAsCreated(user.uid)
      console.log("Profile marked as created in auth service")

      // Show success message
      toast({
        title: "Profile Setup Complete",
        description: "Your profile has been successfully created. Now you can start matching with others!",
        variant: "success",
        duration: 3000,
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Error setting up profile:", err)

      // Enhanced error handling
      if (err.code === "permission-denied") {
        setError("Permission denied. Please make sure you're properly logged in.")
      } else if (err.code === "not-found") {
        setError("User profile not found. Please try logging out and back in.")
      } else {
        setError(err.message || "An error occurred while setting up your profile")
      }
    } finally {
      setLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">Verifying your account...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 pt-[60px] pb-[60px]">
      <Card className="w-full max-w-[800px] shadow-md my-8 animate-fade-in">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Set Up Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 animate-slide-up">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full p-2.5 border rounded transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Skills You Can Teach</Label>
                  <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto grid grid-cols-2 gap-2">
                    {skillOptions.map((skill) => (
                      <div key={`teach-${skill}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`teach-${skill}`}
                          checked={skillsTeach.includes(skill)}
                          onCheckedChange={() => toggleSkillTeach(skill)}
                        />
                        <Label htmlFor={`teach-${skill}`} className="text-sm">
                          {skill}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Skills You Want to Learn</Label>
                  <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto grid grid-cols-2 gap-2">
                    {skillOptions.map((skill) => (
                      <div key={`learn-${skill}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`learn-${skill}`}
                          checked={skillsLearn.includes(skill)}
                          onCheckedChange={() => toggleSkillLearn(skill)}
                        />
                        <Label htmlFor={`learn-${skill}`} className="text-sm">
                          {skill}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger id="experience" className="w-full">
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non-binary" id="non-binary" />
                      <Label htmlFor="non-binary">Non-binary</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Enter your age"
                    className="w-full p-2.5 border rounded transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger id="nationality" className="w-full">
                      <SelectValue placeholder="Select your nationality" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {nationalities.map((nation) => (
                        <SelectItem key={nation} value={nation}>
                          {nation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locality">City/Location</Label>
                  <Input
                    id="locality"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="Enter your city/locality"
                    className="w-full p-2.5 border rounded transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Languages</Label>
                  <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-[200px] overflow-y-auto">
                    {commonLanguages.map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <Checkbox
                          id={`language-${language}`}
                          checked={languages.includes(language)}
                          onCheckedChange={() => toggleLanguage(language)}
                        />
                        <Label htmlFor={`language-${language}`}>{language}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Availability</Label>
                  <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
                    {daysOfWeek.map((day) => (
                      <div key={day.id} className="mb-4">
                        <h4 className="font-medium mb-2">{day.label}</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {timeSlots.slice(16, 44).map(
                            (
                              time, // Only show reasonable hours (8am-10pm)
                            ) => (
                              <div key={`${day.id}-${time}`} className="flex items-center space-x-1">
                                <Checkbox
                                  id={`${day.id}-${time}`}
                                  checked={availability[day.id]?.includes(time)}
                                  onCheckedChange={() => toggleTimeSlot(day.id, time)}
                                />
                                <Label htmlFor={`${day.id}-${time}`} className="text-xs">
                                  {time}
                                </Label>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Profile Visibility</Label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger id="visibility" className="w-full">
                      <SelectValue placeholder="Select profile visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

