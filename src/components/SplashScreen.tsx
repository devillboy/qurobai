import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import qurobLogo from "@/assets/qurob-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    const duration = 1800;
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

    const completeTimer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, duration + 200);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
    };
  }, []); // No dependency on onComplete - use ref instead

  const handleSkip = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Subtle radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)]" />

      {/* Logo */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={qurobLogo}
          alt="QurobAi Logo"
          className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-2xl"
          style={{ filter: "drop-shadow(0 0 24px hsl(var(--primary) / 0.35))" }}
        />
      </motion.div>

      {/* Text */}
      <motion.div
        className="mt-5 text-center relative z-10"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gradient">QurobAi</h1>
        <p className="text-muted-foreground text-xs mt-1 tracking-wide">India's AI Companion</p>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="mt-6 w-40 md:w-48 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="h-[3px] bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>

      {/* Skip button */}
      <motion.button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Skip →
      </motion.button>

      {/* Version */}
      <div className="absolute bottom-8 left-8 text-[10px] text-muted-foreground/30 z-10">
        v3.0
      </div>
    </div>
  );
};
