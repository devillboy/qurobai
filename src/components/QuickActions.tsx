import { motion } from "framer-motion";
import { Code2, Lightbulb, PenTool, Calculator } from "lucide-react";

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
}

const quickActions = [
  {
    icon: Code2,
    label: "Write Code",
    prompt: "Help me write a function to sort an array in JavaScript",
  },
  {
    icon: Lightbulb,
    label: "Get Ideas",
    prompt: "Give me creative ideas for a mobile app",
  },
  {
    icon: PenTool,
    label: "Write Content",
    prompt: "Help me write a professional email",
  },
  {
    icon: Calculator,
    label: "Solve Problems",
    prompt: "Explain a complex topic in simple terms",
  },
];

export const QuickActions = ({ onSelect }: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {quickActions.map((action, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(action.prompt)}
          className="flex items-center gap-3 p-4 rounded-xl glass border border-border hover:border-primary/30 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <action.icon className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};