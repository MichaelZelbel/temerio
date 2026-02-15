import { motion } from "framer-motion";
import { FileText, Users, CheckCircle, Clock, Languages, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "PDF extraction",
    description:
      "Upload PDF documents and let AI pull out dates, events, and key facts automatically.",
  },
  {
    icon: Clock,
    title: "Structured timeline",
    description:
      "All extracted events appear on a chronological timeline you can browse, filter, and search.",
  },
  {
    icon: CheckCircle,
    title: "Review & verify",
    description:
      "Every AI-extracted event can be reviewed, edited, or dismissed before it becomes part of your record.",
  },
  {
    icon: Users,
    title: "People management",
    description:
      "Organize events by person. Track timelines for yourself or others you care about.",
  },
  {
    icon: Languages,
    title: "Multi-language support",
    description:
      "Documents in different languages are processed and translated into English for a unified timeline.",
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    description:
      "Documents are stored securely. Only you can access your uploads and extracted events.",
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
          <h2>What Temerio does today</h2>
          <p className="text-lg text-muted-foreground">
            A focused set of tools for turning documents into timelines.
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
