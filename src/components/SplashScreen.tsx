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
    const interval = 20;
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
  }, []);

  const handleSkip = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Ambient layers */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] left-[20%] w-[200px] h-[200px] bg-accent/6 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] right-[25%] w-[150px] h-[150px] bg-primary/5 rounded-full blur-[60px]" />
      </div>

      {/* Logo */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={qurobLogo}
          alt="QurobAi"
          className="w-22 h-22 md:w-28 md:h-28 rounded-3xl shadow-2xl"
          style={{ width: 88, height: 88, filter: "drop-shadow(0 0 40px hsl(var(--primary) / 0.35))" }}
        />
      </motion.div>

      {/* Title */}
      <motion.div
        className="mt-6 text-center relative z-10"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gradient tracking-tight">QurobAi</h1>
        <p className="text-primary/60 text-[11px] mt-2 tracking-[0.25em] uppercase font-semibold">
          Experience Like Never Before
        </p>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="mt-8 w-40 md:w-48 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="h-[3px] bg-muted/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-primary"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      </motion.div>

      {/* Skip */}
      <motion.button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Skip →
      </motion.button>

      <div className="absolute bottom-8 left-8 text-[10px] text-muted-foreground/20 z-10">v3.2</div>
    </div>
  );
};
