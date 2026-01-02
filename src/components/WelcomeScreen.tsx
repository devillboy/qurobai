import { motion } from "framer-motion";
import { Sparkles, Code, FileText, Lightbulb, MessageSquare, Zap, Shield, Globe } from "lucide-react";

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
}

const quickActions = [
  {
    icon: Code,
    label: "Write Code",
    prompt: "Help me write a React component",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: FileText,
    label: "Explain Something",
    prompt: "Explain how AI works in simple terms",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Lightbulb,
    label: "Brainstorm Ideas",
    prompt: "Give me creative ideas for a startup",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: MessageSquare,
    label: "Just Chat",
    prompt: "Tell me something interesting!",
    color: "from-pink-500 to-rose-500",
  },
];

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get instant responses powered by advanced AI technology",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your conversations are encrypted and protected",
  },
  {
    icon: Globe,
    title: "Always Available",
    description: "24/7 access to your friendly AI companion",
  },
  {
    icon: Code,
    title: "Code Expert",
    description: "Write, debug, and explain code in any language",
  },
];

export const WelcomeScreen = ({ onQuickAction }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-4 md:py-8 overflow-y-auto px-2">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6 md:mb-8"
      >
        {/* 3D Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative mb-4 md:mb-6 inline-block"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-2xl md:rounded-3xl blur-xl md:blur-2xl opacity-50 animate-pulse" />
          <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/30 transform hover:rotate-6 transition-transform duration-300">
            <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-5xl font-bold mb-2 md:mb-3"
        >
          <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            QurobAi
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-base md:text-lg text-muted-foreground mb-1 md:mb-2"
        >
          Your Friendly AI Companion 💜
        </motion.p>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs md:text-sm text-muted-foreground/70"
        >
          Created with ❤️ by Soham from India 🇮🇳
        </motion.p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-2xl px-2 mb-6 md:mb-8"
      >
        <h2 className="text-xs md:text-sm font-medium text-muted-foreground text-center mb-3 md:mb-4">
          Get started with one of these
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              onClick={() => onQuickAction(action.prompt)}
              className="group relative p-3 md:p-4 rounded-xl md:rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 rounded-xl md:rounded-2xl transition-opacity`} />
              <action.icon className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs md:text-sm font-medium text-foreground/80 group-hover:text-foreground">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-2xl px-2"
      >
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="p-3 md:p-4 rounded-lg md:rounded-xl bg-card/30 backdrop-blur-sm border border-border/30"
            >
              <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-primary mb-1 md:mb-2" />
              <h3 className="text-xs md:text-sm font-medium text-foreground mb-0.5 md:mb-1">{feature.title}</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
