import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import qurobLogo from "@/assets/qurob-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = 1500;
    const interval = 30;
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, interval);

    const exitTimer = setTimeout(() => setIsExiting(true), 1300);
    const completeTimer = setTimeout(() => onComplete(), 1500);

    return () => {
      clearInterval(timer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Subtle radial gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)]" />

          {/* Logo */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.img
              src={qurobLogo}
              alt="QurobAi Logo"
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl shadow-2xl"
              style={{ filter: "drop-shadow(0 0 24px hsl(var(--primary) / 0.35))" }}
            />
          </motion.div>

          {/* Text */}
          <motion.div
            className="mt-6 text-center relative z-10"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gradient">QurobAi</h1>
            <p className="text-muted-foreground text-xs mt-1">India's AI Companion</p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="mt-6 w-40 md:w-52 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className="h-[3px] bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </motion.div>

          {/* Skip button */}
          <motion.button
            onClick={onComplete}
            className="absolute bottom-8 right-8 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Skip →
          </motion.button>

          {/* Version */}
          <motion.div
            className="absolute bottom-8 left-8 text-[10px] text-muted-foreground/30 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            v3.0
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
