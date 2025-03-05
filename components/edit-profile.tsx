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

export default function EditProfile() {
  const [name, setName] = useState("")
  const [skillsTeach, setSkillsTeach] = useState<string[]>([])
  const [skillsLearn, setSkillsLearn] = useState<string[]>([])
  const [experience, setExperience] = useState("Beginner")
  const [gender, setGender] = useState("")
  const [age, setAge] = useState("")
  const [nationality, setNationality] = useState("")
  const [locality, setLocality] = useState("")
  const [languages, setLanguages] = useState<string[]>([])
  const [availability, setAvailability] = useState("")
  const [visibility, setVisibility] = useState("public")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user, userProfile } = useAuth()

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

  const toggleLanguage = (language: string) => {
    setLanguages((prev) => (prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]))
  }

  const toggleSkillTeach = (skill: string) => {
    setSkillsTeach((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const toggleSkillLearn = (skill: string) => {
    setSkillsLearn((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  // Load user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      setIsLoading(true)
      try {
        // If userProfile is already available from context, use it
        if (userProfile) {
          setName(userProfile.username || userProfile.displayName || "")
          setSkillsTeach(userProfile.skillsTeach || [])
          setSkillsLearn(userProfile.skillsLearn || [])
          setExperience(userProfile.experience || "Beginner")
          setGender(userProfile.gender || "")
          setAge(userProfile.age || "")
          setNationality(userProfile.nationality || "")
          setLocality(userProfile.locality || "")
          setLanguages(userProfile.languages || [])

          // Convert availability object to string if needed
          if (typeof userProfile.availability === "object") {
            // Create a readable string from the availability object
            const availabilityString = Object.entries(userProfile.availability)
              .filter(([_, times]) => Array.isArray(times) && times.length > 0)
              .map(([day, times]) => `${day}: ${Array.isArray(times) ? times.join(", ") : times}`)
              .join("; ")

            setAvailability(availabilityString || "")
          } else if (typeof userProfile.availability === "string") {
            setAvailability(userProfile.availability)
          }

          setVisibility(userProfile.visibility || "public")
        } else {
          // Fetch profile directly from service if not in context
          const profile = await userService.getUserProfile(user.uid)
          if (profile) {
            setName(profile.username || profile.displayName || "")
            setSkillsTeach(profile.skillsTeach || [])
            setSkillsLearn(profile.skillsLearn || [])
            setExperience(profile.experience || "Beginner")
            setGender(profile.gender || "")
            setAge(profile.age || "")
            setNationality(profile.nationality || "")
            setLocality(profile.locality || "")
            setLanguages(profile.languages || [])

            // Handle availability same as above
            if (typeof profile.availability === "object") {
              const availabilityString = Object.entries(profile.availability)
                .filter(([_, times]) => Array.isArray(times) && times.length > 0)
                .map(([day, times]) => `${day}: ${Array.isArray(times) ? times.join(", ") : times}`)
                .join("; ")

              setAvailability(availabilityString || "")
            } else if (typeof profile.availability === "string") {
              setAvailability(profile.availability)
            }

            setVisibility(profile.visibility || "public")
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err)
        setError("Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [user, userProfile, router])

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
    if (!availability.trim()) {
      setError("Please enter your availability")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to update your profile")
      return
    }

    setError("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
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
        availability, // Store as string for now
        visibility: visibility as "public" | "private",
      })

      // Show success message
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        duration: 3000,
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setError(err.message || "An error occurred while updating your profile")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Edit Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                <RadioGroupItem value="male" id="edit-male" />
                <Label htmlFor="edit-male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="edit-female" />
                <Label htmlFor="edit-female">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non-binary" id="edit-non-binary" />
                <Label htmlFor="edit-non-binary">Non-binary</Label>
              </div>
            </RadioGroup>
          </div>

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
                    id={`edit-language-${language}`}
                    checked={languages.includes(language)}
                    onCheckedChange={() => toggleLanguage(language)}
                  />
                  <Label htmlFor={`edit-language-${language}`}>{language}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Input
              id="availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="E.g., Weekends, Evenings after 6 PM"
              className="w-full p-2.5 border border-input rounded"
            />
            <p className="text-sm text-muted-foreground">Describe when you're available (days/times)</p>
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
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
  )
}

