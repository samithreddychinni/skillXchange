"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"
import { authService } from "@/lib/services/auth-service"
import { toast } from "@/components/ui/use-toast"

interface LoginProps {
  onLogin?: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const router = useRouter()

  // Access auth context
  const auth = useAuth()

  // If we get here, auth context is available
  useEffect(() => {
    setAuthReady(true)
  }, [])

  const { login, register } = auth

  const validateSignup = () => {
    if (!username.trim()) {
      setError("Username is required")
      return false
    }
    if (!email.trim()) {
      setError("Email is required")
      return false
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const validateLogin = () => {
    if (!usernameOrEmail.trim()) {
      setError("Username or email is required")
      return false
    }
    if (!password.trim()) {
      setError("Password is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!authReady) {
      setError("Authentication service is initializing. Please try again in a moment.")
      return
    }

    setError("")
    setLoading(true)

    try {
      if (isLogin) {
        // Validate login fields
        if (!validateLogin()) {
          setLoading(false)
          return
        }

        // Login
        const user = await login(usernameOrEmail, password)

        // Check if user has completed profile setup
        const hasProfile = await authService.hasCompletedProfileSetup(user.uid)

        // Redirect based on profile status
        if (hasProfile) {
          toast({
            title: "Login Successful",
            description: "Welcome back to Skill X Change!",
            variant: "success",
            duration: 3000,
          })
          onLogin?.()
          router.push("/dashboard")
        } else {
          toast({
            title: "Complete Your Profile",
            description: "Please set up your profile to continue",
            duration: 5000,
          })
          router.push("/profile/setup")
        }
      } else {
        // Validate signup fields
        if (!validateSignup()) {
          setLoading(false)
          return
        }

        // Sign up
        console.log("Registering user:", email, username)
        const user = await register(email, password, username)
        console.log("Registration successful, user:", user.uid)

        toast({
          title: "Registration Successful",
          description: "Let's set up your profile!",
          variant: "success",
          duration: 3000,
        })

        router.push("/profile/setup")
      }
    } catch (err: any) {
      console.error("Auth error:", err)
      // Custom error messages
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login instead.")
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid username/email or password. Please try again.")
      } else {
        setError(err.message || "An error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <Card className="w-full max-w-[400px] shadow-md animate-fade-in">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center text-gray-600">Initializing authentication...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-[400px] shadow-md animate-fade-in">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {isLogin ? "Login to Skill X Change" : "Sign Up for Skill X Change"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 animate-slide-up">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin ? (
              <div className="space-y-2">
                <Label htmlFor="usernameOrEmail">Username or Email</Label>
                <Input
                  id="usernameOrEmail"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter your username or email"
                  required
                  className="w-full p-2.5 border rounded transition-all"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    required
                    className="w-full p-2.5 border rounded transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full p-2.5 border rounded transition-all"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full p-2.5 border rounded pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full p-2.5 border rounded pr-10 transition-all"
                  />
                </div>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading || !authReady}
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isLogin ? (
                "Login"
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => {
              setIsLogin(!isLogin)
              setError("")
            }}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

