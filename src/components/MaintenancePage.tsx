import { Wrench, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface MaintenancePageProps {
  message?: string;
}

export const MaintenancePage = ({ message }: MaintenancePageProps) => {
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

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <Clock className="w-3.5 h-3.5" />
          <span>We'll be back shortly</span>
        </div>
      </motion.div>
    </div>
  );
};
