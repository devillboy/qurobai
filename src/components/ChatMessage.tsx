import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, User, Bot } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// Code block component - clean professional style
const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-lg overflow-hidden bg-[#1a1a1a] border border-border/40">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d0d] border-b border-border/30">
        <span className="text-xs font-mono text-muted-foreground">{language || "plaintext"}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
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
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-[#e4e4e7] leading-relaxed">{code}</code>
      </pre>
    </div>
  );
};

// Parse and render content with code blocks
const renderContent = (content: string) => {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {renderInlineFormatting(textBefore)}
        </span>
      );
    }

    parts.push(
      <CodeBlock key={key++} language={match[1]} code={match[2].trim()} />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={key++} className="whitespace-pre-wrap">
        {renderInlineFormatting(content.slice(lastIndex))}
      </span>
    );
  }

  return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{content}</span>;
};

// Render inline formatting
const renderInlineFormatting = (text: string) => {
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  formatted = formatted.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">$1</code>');
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
  
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
};

export const ChatMessage = ({ role, content, isStreaming }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [displayedContent, setDisplayedContent] = useState(content);
  const isUser = role === "user";
  const prevContentRef = useRef(content);

  useEffect(() => {
    if (content !== prevContentRef.current) {
      setDisplayedContent(content);
      prevContentRef.current = content;
    }
  }, [content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div 
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted border border-border"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4 text-foreground" />
        )}
      </div>

      <div className={`flex flex-col max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`group relative rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted/50 border border-border/50 rounded-tl-sm"
          }`}
        >
          <div className="text-sm leading-relaxed">
            {isUser ? displayedContent : renderContent(displayedContent)}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground/70 animate-pulse" />
            )}
          </div>

          {!isUser && !isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs text-muted-foreground"
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
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="flex gap-3"
  >
    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
      <Bot className="w-4 h-4 text-foreground" />
    </div>
    <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex gap-1 items-center">
        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  </motion.div>
);