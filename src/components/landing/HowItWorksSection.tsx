import { motion } from "framer-motion";
import { UserPlus, Settings2, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create your account",
    description:
      "Sign up in seconds — no credit card, no commitment. Get instant access to your workspace.",
  },
  {
    icon: Settings2,
    title: "Configure your workflow",
    description:
      "Connect your tools, invite your team, and customize dashboards to match your process.",
  },
  {
    icon: Rocket,
    title: "Ship with confidence",
    description:
      "Let AI surface insights while you focus on building. Deploy faster and smarter, every time.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24">
      <div className="container space-y-16">
        <motion.div
          className="text-center max-w-2xl mx-auto space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2>How it works</h2>
          <p className="text-lg text-muted-foreground">
            Get up and running in three simple steps.
          </p>
        </motion.div>

        <div className="relative grid md:grid-cols-3 gap-12 md:gap-8">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-border" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="relative text-center space-y-4"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.45, delay: i * 0.15 }}
            >
              <div className="mx-auto flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-4 border-background relative z-10">
                <step.icon className="h-10 w-10 text-primary" />
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold font-display">
                  {i + 1}
                </span>
              </div>
              <h4>{step.title}</h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
