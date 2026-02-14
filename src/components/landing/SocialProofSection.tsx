import { motion } from "framer-motion";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const testimonials = [
  {
    quote:
      "Temerio transformed the way our team collaborates. The AI insights alone saved us 20 hours a week.",
    author: "Sarah Chen",
    role: "VP of Engineering, Acme Corp",
  },
  {
    quote:
      "We evaluated a dozen platforms. Temerio was the only one that felt fast, intuitive, and actually intelligent.",
    author: "Marcus Alvarez",
    role: "CTO, StartupXYZ",
  },
  {
    quote:
      "From onboarding to production, the experience was flawless. Support is world-class.",
    author: "Priya Kapoor",
    role: "Head of Product, DataFlow",
  },
  {
    quote:
      "The analytics dashboard alone is worth the price of admission. Everything else is a bonus.",
    author: "James O'Brien",
    role: "Data Lead, Scaleway",
  },
];

const logos = [
  "Acme Corp",
  "Globex",
  "Initech",
  "Umbrella",
  "Cyberdyne",
  "Wayne Ent.",
];

export function SocialProofSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container space-y-16">
        {/* Logo cloud */}
        <motion.div
          className="text-center space-y-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Trusted by innovative teams worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {logos.map((logo) => (
              <span
                key={logo}
                className="text-lg font-display font-bold text-muted-foreground/40"
              >
                {logo}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Testimonials carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <Carousel opts={{ align: "start", loop: true }} className="mx-auto max-w-4xl">
            <CarouselContent>
              {testimonials.map((t) => (
                <CarouselItem key={t.author} className="md:basis-1/2">
                  <div className="rounded-2xl border bg-card p-6 space-y-4 h-full flex flex-col">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-warning text-warning"
                        />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed flex-1">
                      "{t.quote}"
                    </p>
                    <div>
                      <p className="font-semibold text-sm">{t.author}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </motion.div>
      </div>
    </section>
  );
}
