import { Sparkles, Code, Globe, Search, Image, Zap, Brain, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
}

const quickActions = [
  { icon: "✍️", label: "Write Code", prompt: "Help me write a React component for a responsive navigation menu", color: "from-blue-500/10 to-blue-600/5" },
  { icon: "💡", label: "Brainstorm Ideas", prompt: "Give me 5 creative startup ideas using AI technology", color: "from-amber-500/10 to-amber-600/5" },
  { icon: "🔍", label: "Web Search", prompt: "[Web Search] Latest AI developments and breakthroughs", color: "from-emerald-500/10 to-emerald-600/5" },
  { icon: "🎨", label: "Create Image", prompt: "Generate an image of a futuristic city with flying cars at sunset", color: "from-purple-500/10 to-purple-600/5" },
  { icon: "📚", label: "Explain Topic", prompt: "Explain how machine learning neural networks work in simple terms", color: "from-cyan-500/10 to-cyan-600/5" },
  { icon: "🔬", label: "Deep Search", prompt: "[Deep Search] Compare React vs Next.js for building modern web apps", color: "from-rose-500/10 to-rose-600/5" },
];

export const WelcomeScreen = ({ onQuickAction }: WelcomeScreenProps) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("display_name").eq("user_id", user.id).single()
        .then(({ data }) => {
          setDisplayName(data?.display_name || user.email?.split("@")[0] || "");
        });
    }
  }, [user]);

  const firstName = displayName.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6 md:py-10 px-3 md:px-4">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 md:mb-10"
      >
        <p className="text-sm text-muted-foreground mb-2">{greeting},</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="text-gradient">{firstName}</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-base">
          What would you like to explore today?
        </p>
      </motion.div>

      {/* Quick Actions — card grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12 }}
        className="w-full max-w-xl mb-8"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              onClick={() => onQuickAction(action.prompt)}
              className={`flex flex-col items-start gap-2 p-3.5 rounded-xl border border-border/40 bg-gradient-to-br ${action.color} hover:border-primary/30 transition-all duration-300 text-left group touch-manipulation`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 + index * 0.04 }}
            >
              <span className="text-xl">{action.icon}</span>
              <div>
                <span className="text-sm font-medium block">{action.label}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/60 transition-colors mt-1" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Capabilities */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground/60"
      >
        {[
          { icon: Zap, label: "Fast" },
          { icon: Code, label: "Code" },
          { icon: Image, label: "Vision" },
          { icon: Globe, label: "Search" },
          { icon: Brain, label: "Reasoning" },
        ].map((cap) => (
          <div key={cap.label} className="flex items-center gap-1">
            <cap.icon className="w-3 h-3" />
            <span>{cap.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
