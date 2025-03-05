"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, User, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/context/auth-context"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // For demo purposes, consider login pages
  const isLoginPage = pathname === "/login" || pathname === "/profile/setup"

  // Show user options only if logged in
  const showUserOptions = !!user && !isLoginPage

  const handleSignOut = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleEditProfile = () => {
    router.push("/profile/edit")
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-[60px] navbar-glass text-foreground z-50 shadow-sm animate-slide-down">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center text-xl font-bold">
            {/* Logo placeholder - will be replaced with custom image */}
            <div className="h-8 w-8 mr-2"></div>
            Skill X Change
          </Link>
        </div>

        {/* Desktop Navigation */}
        {showUserOptions && (
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/find-matches" className="hover:text-primary transition-colors">
              Find Matches
            </Link>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <User size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 animate-scale">
                <DropdownMenuItem onClick={handleEditProfile}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Mobile Menu Button - Only show if logged in */}
        {showUserOptions && (
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground hover:bg-primary/10"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && showUserOptions && (
        <div className="md:hidden absolute top-[60px] left-0 right-0 navbar-glass shadow-lg animate-slide-down">
          <div className="flex flex-col p-4 space-y-4">
            <Link
              href="/dashboard"
              className="hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/find-matches"
              className="hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Find Matches
            </Link>
            <Link
              href="/profile/edit"
              className="hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Edit Profile
            </Link>
            <Button onClick={handleSignOut} className="bg-primary hover:bg-primary/80 text-primary-foreground w-full">
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}

