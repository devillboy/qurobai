import { motion } from "framer-motion";
import { Sparkles, Github, Cpu } from "lucide-react";

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
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground tracking-tight">
                Nova<span className="text-primary">AI</span>
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">
                Free • Open Source • Self-Hosted
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
              <span className="text-xs text-muted-foreground">Llama 3.1 8B</span>
            </div>

            {/* GitHub */}
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-lg glass border border-border flex items-center justify-center hover:border-primary/50 transition-colors"
            >
              <Github className="w-4 h-4 text-muted-foreground" />
            </motion.a>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
