import { Sparkles, Code, FileText, Lightbulb, Globe, Search, Image, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
}

const quickActions = [
  { icon: "✍️", label: "Write Code", prompt: "Help me write a React component for a responsive navigation menu" },
  { icon: "💡", label: "Brainstorm", prompt: "Give me 5 creative startup ideas using AI technology" },
  { icon: "🔍", label: "Web Search", prompt: "[Web Search] Latest AI developments and breakthroughs" },
  { icon: "🎨", label: "Create Image", prompt: "Generate an image of a futuristic city with flying cars at sunset" },
  { icon: "📚", label: "Explain", prompt: "Explain how machine learning neural networks work in simple terms" },
  { icon: "🔬", label: "Deep Search", prompt: "[Deep Search] Compare React vs Next.js for building modern web apps" },
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

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-4 md:py-8 px-3 md:px-4">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6 md:mb-8"
      >
        <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight">
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Hi, {firstName}
          </span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Where should we start?
        </p>
      </motion.div>

      {/* Quick Actions - Pill style like Gemini */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="w-full max-w-2xl mb-6 md:mb-8"
      >
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              onClick={() => onQuickAction(action.prompt)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border/60 bg-secondary/50 hover:bg-secondary hover:border-primary/40 transition-all text-sm font-medium touch-manipulation"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <span className="text-base">{action.icon}</span>
              <span>{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Capabilities row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-wrap justify-center gap-3 md:gap-4 text-xs text-muted-foreground/70"
      >
        {[
          { icon: Zap, label: "Lightning Fast" },
          { icon: Code, label: "Code Expert" },
          { icon: Image, label: "Vision & Image Gen" },
          { icon: Globe, label: "Real-time Data" },
          { icon: Search, label: "Web & Deep Search" },
        ].map((cap) => (
          <div key={cap.label} className="flex items-center gap-1">
            <cap.icon className="w-3 h-3" />
            <span>{cap.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-[11px] text-muted-foreground/40 mt-8 md:mt-12"
      >
        Created by Soham from India 🇮🇳
      </motion.p>
    </div>
  );
};
