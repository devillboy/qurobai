import { Code, Globe, Image, Zap, Brain, ArrowRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
}

const quickActions = [
  { icon: "✍️", label: "Write Code", prompt: "Help me write a React component for a responsive navigation menu", color: "hover:border-[hsl(220_14%_25%)]" },
  { icon: "💡", label: "Brainstorm", prompt: "Give me 5 creative startup ideas using AI technology", color: "hover:border-[hsl(220_14%_25%)]" },
  { icon: "🔍", label: "Web Search", prompt: "[Web Search] Latest AI developments and breakthroughs", color: "hover:border-[hsl(220_14%_25%)]" },
  { icon: "🎨", label: "Create Image", prompt: "Generate an image of a futuristic city with flying cars at sunset", color: "hover:border-[hsl(220_14%_25%)]" },
  { icon: "📚", label: "Explain", prompt: "Explain how machine learning neural networks work in simple terms", color: "hover:border-[hsl(220_14%_25%)]" },
  { icon: "🔬", label: "Deep Search", prompt: "[Deep Search] Compare React vs Next.js for building modern web apps", color: "hover:border-[hsl(220_14%_25%)]" },
];

export const WelcomeScreen = ({ onQuickAction }: WelcomeScreenProps) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [promptTemplates, setPromptTemplates] = useState<{ title: string; prompt: string; icon: string; category: string }[]>([]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("display_name").eq("user_id", user.id).single()
        .then(({ data }) => {
          setDisplayName(data?.display_name || user.email?.split("@")[0] || "");
        });
    }
    // Fetch prompt templates
    supabase.from("chat_templates").select("title, prompt, icon, category").eq("is_public", true).limit(8)
      .then(({ data }) => {
        if (data?.length) setPromptTemplates(data);
      });
  }, [user]);

  const firstName = displayName.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6 md:py-10 px-3 md:px-4">
      {/* Greeting with 3D text */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 md:mb-10"
      >
        <p className="text-sm text-muted-foreground mb-2 tracking-wide uppercase">{greeting},</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-3d">
          <span className="text-gradient">{firstName}</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-sm tracking-wide">
          How can I help you today?
        </p>
      </motion.div>

      {/* Quick Actions — clean minimal cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12 }}
        className="w-full max-w-xl mb-8"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              onClick={() => onQuickAction(action.prompt)}
              className={`flex flex-col items-start gap-2 p-3.5 rounded-xl border border-border bg-card/50 ${action.color} transition-all duration-200 text-left group touch-manipulation`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 + index * 0.04 }}
            >
              <span className="text-lg">{action.icon}</span>
              <div>
                <span className="text-sm font-medium block text-foreground/80">{action.label}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors mt-1" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Prompt Templates */}
      {promptTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="w-full max-w-xl mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wide">Prompt Templates</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {promptTemplates.map((t, i) => (
              <motion.button
                key={t.title}
                onClick={() => onQuickAction(t.prompt)}
                className="px-3 py-1.5 rounded-lg border border-border bg-card/40 hover:bg-card/80 text-xs text-foreground/70 transition-colors"
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.03 }}
              >
                {t.icon && <span className="mr-1">{t.icon === "sparkles" ? "✨" : t.icon}</span>}
                {t.title}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Capabilities — minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground/50"
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
