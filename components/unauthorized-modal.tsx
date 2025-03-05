"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UnauthorizedModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UnauthorizedModal({ isOpen, onClose }: UnauthorizedModalProps) {
  const router = useRouter()

  const handleLogin = () => {
    onClose()
    router.push("/login")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[300px]">
        <DialogHeader>
          <DialogTitle className="text-[#2c3e50]">Authentication Required</DialogTitle>
          <DialogDescription>Please log in to access this page.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleLogin} className="w-full bg-[#3498db] hover:bg-[#2980b9]">
            Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

