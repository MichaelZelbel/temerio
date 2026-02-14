import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface UpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

const benefits = [
  "Unlimited items & workspaces",
  "Advanced AI features",
  "Priority support",
  "Team collaboration",
  "API access",
];

export function UpsellModal({ open, onOpenChange, featureName = "This feature" }: UpsellModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="rounded-full bg-primary/10 p-4 mb-2"
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>
          <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          <DialogDescription>
            {featureName} is available on the Pro plan. Unlock your full potential.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 py-4">
          {benefits.map((b, i) => (
            <motion.li
              key={b}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2.5 text-sm"
            >
              <Check className="h-4 w-4 text-success shrink-0" />
              {b}
            </motion.li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link to="/pricing" onClick={() => onOpenChange(false)}>
              <Sparkles className="h-4 w-4 mr-2" />
              View Plans
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
