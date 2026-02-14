import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function FinalCTASection() {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 p-12 md:p-20 text-center space-y-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />

          <h2 className="text-primary-foreground relative z-10">
            Ready to get started?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto relative z-10">
            Join thousands of teams already building smarter with Temerio. Your
            first 14 days are on us.
          </p>
          <div className="relative z-10">
            <Button
              size="xl"
              variant="secondary"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              asChild
            >
              <Link to="/auth">
                Start Building for Free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
