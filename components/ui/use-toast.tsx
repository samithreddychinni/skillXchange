"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  title?: string
  description?: string
  duration?: number
  variant?: "default" | "destructive" | "success"
}

interface ToastState extends ToastProps {
  id: string
  visible: boolean
}

// Global state for toasts
let toasts: ToastState[] = []
let listeners: ((toasts: ToastState[]) => void)[] = []

// Function to notify listeners of state changes
const notifyListeners = () => {
  listeners.forEach((listener) => listener([...toasts]))
}

// Function to add a toast
export const toast = ({ title, description, duration = 5000, variant = "default" }: ToastProps) => {
  const id = Math.random().toString(36).substring(2, 9)

  // Add toast to state
  toasts = [...toasts, { id, title, description, duration, variant, visible: true }]
  notifyListeners()

  // Auto-remove toast after duration
  setTimeout(() => {
    dismissToast(id)
  }, duration)

  return id
}

// Function to dismiss a toast
export const dismissToast = (id: string) => {
  // First set visible to false for animation
  toasts = toasts.map((t) => (t.id === id ? { ...t, visible: false } : t))
  notifyListeners()

  // Then remove after animation completes
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notifyListeners()
  }, 300)
}

// Hook to access toasts
export const useToast = () => {
  const [state, setState] = useState<ToastState[]>(toasts)

  useEffect(() => {
    const listener = (newState: ToastState[]) => {
      setState(newState)
    }

    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  return {
    toasts: state,
    toast,
    dismiss: dismissToast,
  }
}

// Toast component
export function Toast({ id, title, description, variant = "default", visible }: ToastState) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-md rounded-lg shadow-lg transition-all duration-300 ease-in-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        variant === "destructive"
          ? "bg-destructive text-destructive-foreground"
          : variant === "success"
            ? "bg-green-600 text-white"
            : "bg-white text-foreground dark:bg-gray-800 dark:text-gray-100",
      )}
    >
      <div className="flex-1 p-4">
        {title && <div className="font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      <button
        onClick={() => dismissToast(id)}
        className="flex items-center justify-center w-10 h-10 shrink-0 rounded-r-lg hover:bg-gray-50/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Toaster component to render all toasts
export function Toaster() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

