import { Users, BarChart, Zap, CheckCircle, Mail, ArrowRight } from "lucide-react"
import { FeatureCard } from "./feature-card"

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2 animate-slide-up">
            <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">Features</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
              Why Choose SkillX Change?
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our platform offers unique features designed to make skill exchange seamless and rewarding.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <FeatureCard
            icon={<Users className="h-6 w-6 text-primary" />}
            title="Expert Community"
            description="Connect with verified experts across various fields and industries."
          />
          <FeatureCard
            icon={<BarChart className="h-6 w-6 text-primary" />}
            title="Skill Tracking"
            description="Monitor your progress and growth with detailed analytics and feedback."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6 text-primary" />}
            title="Fast Matching"
            description="Our AI-powered system matches you with the perfect skill exchange partners."
          />
          <FeatureCard
            icon={<CheckCircle className="h-6 w-6 text-primary" />}
            title="Verified Skills"
            description="All skills and expertise are verified through our comprehensive validation process."
          />
          <FeatureCard
            icon={<Mail className="h-6 w-6 text-primary" />}
            title="Secure Messaging"
            description="Communicate safely with potential skill exchange partners through our platform."
          />
          <FeatureCard
            icon={<ArrowRight className="h-6 w-6 text-primary" />}
            title="Continuous Learning"
            description="Access resources and workshops to keep improving your skills."
          />
        </div>
      </div>
    </section>
  )
}

