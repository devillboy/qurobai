import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, isLoading, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onSubmit={handleSubmit}
      className="relative"
    >
      <div className="glass-strong rounded-2xl p-1.5 glow-primary transition-shadow duration-300 focus-within:shadow-[0_0_80px_hsl(175_80%_50%_/_0.2)]">
        <div className="flex items-end gap-3 p-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nova anything..."
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              "flex-1 bg-transparent border-none outline-none resize-none",
              "text-foreground placeholder:text-muted-foreground/50",
              "text-base leading-relaxed max-h-[200px]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />

          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading || disabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
              "transition-all duration-200",
              input.trim() && !isLoading && !disabled
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground/50 mt-3">
        Nova AI • Free & Open Source • Press Enter to send
      </p>
    </motion.form>
  );
};
