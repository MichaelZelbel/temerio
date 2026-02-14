import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-info/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-info/5 blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="info" className="mb-4">
              <Sparkles className="mr-1 h-3 w-3" />
              Now in Public Beta
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl !leading-[1.1]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Turn Documents Into a{" "}
            <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
              Structured Timeline
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Temerio extracts key events from your documents and organizes them into a
            clear, searchable timeline — built for clarity and perspective.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button size="xl" asChild>
              <Link to="/auth">
                Get Started Free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/docs">See How It Works</Link>
            </Button>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-success" />
              Free to start
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-warning" />
              AI-powered extraction
            </span>
          </motion.div>
        </div>

        {/* Hero visual placeholder */}
        <motion.div
          className="mt-16 mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div className="relative rounded-2xl border bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden aspect-[16/9]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-info/10" />
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3 p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground font-medium">
                  Dashboard Preview
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
