import { motion } from "framer-motion";
import { Bot, Zap, Shield, Upload, MessageSquare, Code2 } from "lucide-react";
import { QuickActions } from "./QuickActions";

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
}

const features = [
  { icon: Zap, text: "Lightning Fast" },
  { icon: Shield, text: "Secure & Private" },
  { icon: Upload, text: "File Uploads" },
  { icon: Code2, text: "Code Expert" },
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
        <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-primary">
          <Bot className="w-12 h-12 text-primary" />
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
          <div className="absolute top-1/2 -right-2 w-1.5 h-1.5 rounded-full bg-primary/40" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">
          Welcome to <span className="text-gradient-primary">QurobAi</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-2">
          Your intelligent AI assistant, ready to help with anything.
        </p>
        <p className="text-sm text-muted-foreground/60">
          Created by Soham from India
        </p>
      </motion.div>

      {/* Feature badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-3 my-8"
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
        <p className="text-sm text-muted-foreground mb-4">Try asking me</p>
        <QuickActions onSelect={onQuickAction} />
      </motion.div>
    </div>
  );
};