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
    const duration = 1500;
    const interval = 25;
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
    }, duration + 100);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
    };
  }, []);

  const handleSkip = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      {/* Logo */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={qurobLogo}
          alt="QurobAi"
          className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-2xl"
          style={{ filter: "drop-shadow(0 0 30px hsl(var(--primary) / 0.3))" }}
        />
      </motion.div>

      {/* Text */}
      <motion.div
        className="mt-5 text-center relative z-10"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gradient">QurobAi</h1>
        <p className="text-muted-foreground text-xs mt-1 tracking-wider">India's AI Companion</p>
      </motion.div>

      {/* Progress */}
      <motion.div
        className="mt-6 w-36 md:w-44 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="h-[2px] bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>

      {/* Skip */}
      <motion.button
        onClick={handleSkip}
        className="absolute bottom-6 right-6 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Skip →
      </motion.button>

      <div className="absolute bottom-6 left-6 text-[10px] text-muted-foreground/25 z-10">v3.1</div>
    </div>
  );
};
