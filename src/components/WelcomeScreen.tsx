import { Sparkles, Code, FileText, Lightbulb, MessageSquare, Zap, Image, Globe } from "lucide-react";
import { motion } from "framer-motion";

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
}

const quickActions = [
  {
    icon: Code,
    label: "Write Code",
    prompt: "Help me write a React component for a responsive navigation menu",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: FileText,
    label: "Explain Concepts",
    prompt: "Explain how machine learning neural networks work in simple terms",
    color: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: Lightbulb,
    label: "Brainstorm Ideas",
    prompt: "Give me 5 creative startup ideas using AI technology",
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: Globe,
    label: "Real-time Data",
    prompt: "What's the current weather in Delhi and today's top news?",
    color: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-400",
  },
];

const capabilities = [
  { icon: Zap, label: "Lightning Fast" },
  { icon: Code, label: "Code Expert" },
  { icon: Image, label: "Vision AI" },
  { icon: Globe, label: "Real-time Data" },
];

export const WelcomeScreen = ({ onQuickAction }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
      {/* Logo with glow effect */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 rounded-3xl blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
          <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Hello!
          </span>
        </h1>
        <p className="text-lg text-muted-foreground">
          How can I help you today?
        </p>
      </motion.div>

      {/* Capabilities pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap justify-center gap-2 mb-10"
      >
        {capabilities.map((cap, i) => (
          <div
            key={cap.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs text-muted-foreground"
          >
            <cap.icon className="w-3 h-3" />
            <span>{cap.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions - Perplexity style cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-2xl"
      >
        <div className="grid sm:grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              onClick={() => onQuickAction(action.prompt)}
              className={`group relative flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-gradient-to-br ${action.color} hover:border-primary/40 transition-all duration-300 text-left overflow-hidden`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`shrink-0 w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                <action.icon className={`w-5 h-5 ${action.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block mb-1">{action.label}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">{action.prompt}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-xs text-muted-foreground/50 mt-10"
      >
        Created by Soham from India 🇮🇳
      </motion.p>
    </div>
  );
};
