import { useState, useEffect } from "react";
import { Code, Lightbulb, FileText, Mail, Book, Bug, Languages, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Template {
  id: string;
  title: string;
  description: string | null;
  prompt: string;
  category: string;
  icon: string;
}

interface TemplatesPickerProps {
  onSelect: (prompt: string) => void;
  onClose: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code,
  lightbulb: Lightbulb,
  "file-text": FileText,
  mail: Mail,
  book: Book,
  bug: Bug,
  languages: Languages,
  image: Image,
};

const defaultTemplates: Template[] = [
  { id: "1", title: "Code Review", description: "Get expert feedback", prompt: "Please review this code and suggest improvements:\n\n", category: "coding", icon: "code" },
  { id: "2", title: "Explain Simply", description: "ELI5 explanations", prompt: "Explain this in simple terms that anyone could understand:\n\n", category: "learning", icon: "lightbulb" },
  { id: "3", title: "Debug Helper", description: "Find and fix bugs", prompt: "Help me debug this code. The error is:\n\n", category: "coding", icon: "bug" },
  { id: "4", title: "Write Email", description: "Professional emails", prompt: "Write a professional email about:\n\n", category: "writing", icon: "mail" },
  { id: "5", title: "Study Plan", description: "Learning roadmap", prompt: "Create a study plan for learning:\n\n", category: "learning", icon: "book" },
  { id: "6", title: "Translate Hindi", description: "Hindi translation", prompt: "Translate this to Hindi:\n\n", category: "language", icon: "languages" },
  { id: "7", title: "Generate Image", description: "AI image creation", prompt: "Generate an image of ", category: "creative", icon: "image" },
  { id: "8", title: "Blog Post", description: "Content writing", prompt: "Write a detailed blog post about:\n\n", category: "writing", icon: "file-text" },
];

export function TemplatesPicker({ onSelect, onClose }: TemplatesPickerProps) {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_templates")
        .select("*")
        .eq("is_public", true)
        .limit(8);

      if (!error && data && data.length > 0) {
        setTemplates(data);
      }
    } catch (e) {
      console.log("Using default templates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="mb-3 p-3 bg-card border border-border rounded-xl"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">Quick Templates</h4>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {templates.map((template) => {
            const IconComponent = iconMap[template.icon] || Lightbulb;
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template.prompt)}
                className="flex flex-col items-start p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors text-left group"
              >
                <IconComponent className="w-4 h-4 text-primary mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-foreground">{template.title}</span>
                {template.description && (
                  <span className="text-xs text-muted-foreground truncate w-full">{template.description}</span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
