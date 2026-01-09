import { Sparkles, Code, FileText, Lightbulb, MessageSquare } from "lucide-react";

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
}

const quickActions = [
  {
    icon: Code,
    label: "Write Code",
    prompt: "Help me write a React component",
  },
  {
    icon: FileText,
    label: "Explain Something",
    prompt: "Explain how AI works in simple terms",
  },
  {
    icon: Lightbulb,
    label: "Brainstorm Ideas",
    prompt: "Give me creative ideas for a startup",
  },
  {
    icon: MessageSquare,
    label: "Just Chat",
    prompt: "Tell me something interesting!",
  },
];

export const WelcomeScreen = ({ onQuickAction }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
      {/* Logo */}
      <div className="mb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold mb-2">
        Qurob<span className="text-primary">Ai</span>
      </h1>
      <p className="text-muted-foreground mb-2">How can I help you today?</p>
      <p className="text-sm text-muted-foreground/60 mb-8">
        Created by Soham from India 🇮🇳
      </p>

      {/* Quick Actions */}
      <div className="w-full max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => onQuickAction(action.prompt)}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary hover:border-primary/30 transition-all text-left group"
            >
              <action.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
