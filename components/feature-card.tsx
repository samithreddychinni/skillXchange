import type React from "react"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center space-y-4 rounded-lg border border-border bg-card p-6 shadow-md h-full animate-slide-up hover-lift">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="text-center text-muted-foreground flex-grow">{description}</p>
    </div>
  )
}

