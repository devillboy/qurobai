import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, User, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// Simple code block renderer
const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative my-4 rounded-xl overflow-hidden bg-[#1e1e2e] border border-border/30 shadow-lg"
    >
      <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-border/20">
        <span className="text-xs font-medium text-purple-400">{language || "code"}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" /> Copy
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-[#cdd6f4] leading-relaxed">{code}</code>
      </pre>
    </motion.div>
  );
};

// Animated text component for smooth character reveal
const AnimatedText = ({ text }: { text: string }) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {text}
    </motion.span>
  );
};

// Parse and render content with code blocks
const renderContent = (content: string, isStreaming?: boolean) => {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {renderInlineFormatting(textBefore)}
        </span>
      );
    }

    // Add code block
    parts.push(
      <CodeBlock key={key++} language={match[1]} code={match[2].trim()} />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(
      <span key={key++} className="whitespace-pre-wrap">
        {renderInlineFormatting(content.slice(lastIndex))}
      </span>
    );
  }

  return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{content}</span>;
};

// Render inline formatting (bold, italic, inline code)
const renderInlineFormatting = (text: string) => {
  // Handle bold (**text**)
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Handle italic (*text*)
  formatted = formatted.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // Handle inline code (`code`)
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-sm font-mono">$1</code>');
  // Handle links [text](url)
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
  
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
};

export const ChatMessage = ({ role, content, isStreaming }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [displayedContent, setDisplayedContent] = useState(content);
  const isUser = role === "user";
  const prevContentRef = useRef(content);

  // Smooth content update for streaming
  useEffect(() => {
    if (isStreaming && content !== prevContentRef.current) {
      setDisplayedContent(content);
      prevContentRef.current = content;
    } else if (!isStreaming) {
      setDisplayedContent(content);
    }
  }, [content, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94],
        opacity: { duration: 0.3 }
      }}
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary/25"
        >
          <Sparkles className="w-5 h-5 text-white" />
        </motion.div>
      )}

      <motion.div
        layout
        className={`group relative max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            : "bg-card/80 backdrop-blur-sm border border-border/50 shadow-xl"
        }`}
        style={{ willChange: isStreaming ? "height" : "auto" }}
      >
        <motion.div 
          className={`text-sm leading-relaxed ${isUser ? "" : "text-foreground"}`}
          layout={isStreaming ? "position" : false}
        >
          {isUser ? displayedContent : renderContent(displayedContent, isStreaming)}
          <AnimatePresence>
            {isStreaming && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center ml-1"
              >
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block w-2 h-4 bg-primary rounded-sm"
                />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Copy button for assistant messages */}
        {!isUser && !isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 px-2 text-xs bg-background/80 backdrop-blur-sm border border-border/50"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </>
              )}
            </Button>
          </motion.div>
        )}
      </motion.div>

      {isUser && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 border border-border/50"
        >
          <User className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      )}
    </motion.div>
  );
};

export const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    className="flex gap-4"
  >
    <motion.div 
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary/25"
    >
      <Sparkles className="w-5 h-5 text-white" />
    </motion.div>
    <motion.div 
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className="bg-card/80 backdrop-blur-sm rounded-2xl px-5 py-4 border border-border/50 shadow-xl"
    >
      <div className="flex gap-1.5 items-center">
        <motion.span 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          className="w-2.5 h-2.5 rounded-full bg-primary" 
        />
        <motion.span 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          className="w-2.5 h-2.5 rounded-full bg-primary" 
        />
        <motion.span 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          className="w-2.5 h-2.5 rounded-full bg-primary" 
        />
      </div>
    </motion.div>
  </motion.div>
);