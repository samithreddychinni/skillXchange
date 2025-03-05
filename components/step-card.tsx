interface StepCardProps {
  number: number
  title: string
  description: string
}

export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="flex flex-col items-center space-y-3 animate-slide-up hover-lift">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-white border border-primary/30">
        {number}
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-center text-blue-100">{description}</p>
    </div>
  )
}

