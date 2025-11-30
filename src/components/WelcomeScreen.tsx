import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, Code2 } from "lucide-react";
import { QuickActions } from "./QuickActions";

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
}

const features = [
  { icon: Zap, text: "Lightning fast" },
  { icon: Shield, text: "100% Private" },
  { icon: Code2, text: "Open Source" },
];

export const WelcomeScreen = ({ onQuickAction }: WelcomeScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Main icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative mb-8"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center glow-primary">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
        {/* Orbiting dots */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute -top-2 left-1/2 w-2 h-2 rounded-full bg-primary/60" />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute top-1/2 -right-2 w-1.5 h-1.5 rounded-full bg-accent/60" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">
          Welcome to <span className="text-gradient-primary">Nova</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Your intelligent AI assistant, powered by open-source models.
          Completely free, private, and self-hostable.
        </p>
      </motion.div>

      {/* Feature badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-3 mb-10"
      >
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-border"
          >
            <feature.icon className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">{feature.text}</span>
          </div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-lg"
      >
        <p className="text-sm text-muted-foreground mb-4">Quick start</p>
        <QuickActions onSelect={onQuickAction} />
      </motion.div>
    </div>
  );
};
