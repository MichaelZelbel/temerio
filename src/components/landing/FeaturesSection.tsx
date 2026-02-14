import { motion } from "framer-motion";
import {
  Brain,
  Users,
  ShieldCheck,
  Puzzle,
  BarChart3,
  Headphones,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description:
      "Leverage machine learning to uncover patterns and opportunities hidden in your data.",
  },
  {
    icon: Users,
    title: "Seamless Collaboration",
    description:
      "Work together in real-time with shared dashboards, comments, and role-based access.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant with end-to-end encryption, SSO, and audit logging built in.",
  },
  {
    icon: Puzzle,
    title: "Integrations",
    description:
      "Connect to 200+ tools you already use — Slack, Jira, Salesforce, and more.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Beautiful, real-time dashboards that turn complex data into clear decisions.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description:
      "Dedicated support engineers available around the clock to keep you moving.",
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function FeaturesSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container space-y-12">
        <motion.div
          className="text-center max-w-2xl mx-auto space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2>Everything you need to scale</h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed for modern teams that move fast and think big.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group rounded-2xl border bg-card p-6 space-y-4 transition-shadow hover:shadow-lg"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h4>{feature.title}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
