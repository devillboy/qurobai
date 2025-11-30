import { motion } from "framer-motion";
import { Code, FileText, Lightbulb, Wand2 } from "lucide-react";

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
}

const actions = [
  {
    icon: Code,
    label: "Write code",
    prompt: "Help me write clean, efficient code for",
    color: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30",
  },
  {
    icon: FileText,
    label: "Explain concept",
    prompt: "Explain in simple terms how",
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    icon: Lightbulb,
    label: "Brainstorm ideas",
    prompt: "Generate creative ideas for",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
  },
  {
    icon: Wand2,
    label: "Debug & fix",
    prompt: "Help me debug and fix this issue:",
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const QuickActions = ({ onSelect }: QuickActionsProps) => {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3"
    >
      {actions.map((action, index) => (
        <motion.button
          key={index}
          variants={item}
          onClick={() => onSelect(action.prompt)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`
            group relative p-4 rounded-xl text-left
            glass border ${action.borderColor}
            hover:border-primary/50 transition-all duration-300
            hover:shadow-lg hover:shadow-primary/10
          `}
        >
          <div
            className={`
              w-10 h-10 rounded-lg mb-3 flex items-center justify-center
              bg-gradient-to-br ${action.color}
              group-hover:scale-110 transition-transform duration-300
            `}
          >
            <action.icon className="w-5 h-5 text-foreground" />
          </div>
          <p className="font-medium text-foreground text-sm">{action.label}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {action.prompt}...
          </p>
        </motion.button>
      ))}
    </motion.div>
  );
};
