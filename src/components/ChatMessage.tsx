import { motion } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = ({ role, content, isStreaming }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex gap-4 p-4 rounded-2xl",
        isUser ? "bg-secondary/50" : "glass"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
          isUser
            ? "bg-muted"
            : "bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30"
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Sparkles className="w-5 h-5 text-primary" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">
          {isUser ? "You" : "Nova AI"}
        </p>
        <div className="text-foreground leading-relaxed whitespace-pre-wrap">
          {content}
          {isStreaming && (
            <span className="inline-flex ml-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 p-4 rounded-2xl glass"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <div className="flex items-center gap-1.5 pt-3">
        <span className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
        <span className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
        <span className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
      </div>
    </motion.div>
  );
};
