import { motion } from "framer-motion";
import { BadgeCheck, Cpu } from "lucide-react";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="glass-strong border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center glow-primary">
              <BadgeCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground tracking-tight">
                Qurob<span className="text-primary">Ai</span>
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">
                India-first • Private • Fast
              </p>
            </div>
          </div>

          {/* Status & Links */}
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs text-emerald-400 font-medium">Online</span>
            </div>

            {/* Model badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Qurob Engine</span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
