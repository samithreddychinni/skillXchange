import { StepCard } from "./step-card"

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2 animate-slide-up">
            <div className="inline-block rounded-lg bg-primary/20 px-3 py-1 text-sm text-white">Process</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">How SkillX Change Works</h2>
            <p className="max-w-[900px] text-blue-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our simple process makes skill exchange accessible to everyone.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 md:grid-cols-3 lg:gap-12">
          <StepCard
            number={1}
            title="Create Your Profile"
            description="Sign up and list the skills you have and the skills you want to learn."
          />
          <StepCard
            number={2}
            title="Get Matched"
            description="Our system matches you with compatible users for mutual skill exchange."
          />
          <StepCard
            number={3}
            title="Exchange & Grow"
            description="Connect, schedule sessions, and start exchanging skills to grow together."
          />
        </div>
      </div>
    </section>
  )
}

