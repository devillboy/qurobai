import { Wrench, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

interface MaintenancePageProps {
  message?: string;
  endsAt?: string | null;
}

const formatTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h, m, s };
};

export const MaintenancePage = ({ message, endsAt }: MaintenancePageProps) => {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) return;
    const endTime = new Date(endsAt).getTime();

    const calc = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endTime - now) / 1000));
      setRemaining(diff);
      if (diff === 0) window.location.reload();
    };

    // Calculate total duration on first render
    const diff = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    setRemaining(diff);
    setTotalDuration(diff);

    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const time = remaining !== null ? formatTime(remaining) : null;
  const progress = totalDuration && remaining !== null ? ((totalDuration - remaining) / totalDuration) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10"
        >
          <Wrench className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="text-3xl font-bold text-foreground">System Upgrade</h1>

        <p className="text-muted-foreground text-sm leading-relaxed">
          {message || "QurobAi is currently under maintenance. We're making things better for you. Please check back soon!"}
        </p>

        {time !== null && remaining !== null && remaining > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              {[
                { val: time.h, label: "Hours" },
                { val: time.m, label: "Min" },
                { val: time.s, label: "Sec" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <motion.div
                    key={item.val}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                  >
                    <span className="text-2xl font-bold text-primary font-mono">
                      {String(item.val).padStart(2, "0")}
                    </span>
                  </motion.div>
                  <span className="text-[10px] text-muted-foreground mt-1">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="px-8">
              <Progress value={progress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {Math.round(progress)}% complete
              </p>
            </div>
          </div>
        )}

        {(!endsAt || (remaining !== null && remaining <= 0)) && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <Clock className="w-3.5 h-3.5" />
            <span>We'll be back shortly</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
