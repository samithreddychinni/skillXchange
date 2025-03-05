import Login from "@/components/login"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login - Skill X Change",
  description: "Login to your Skill X Change account",
}

export default function LoginPage() {
  return <Login />
}

