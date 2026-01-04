import { memo, useState } from "react";
import { Bot, User, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const CodeBlock = memo(({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border bg-muted/50">
      <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">{language || "code"}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={copyCode}
        >
          {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="p-3 overflow-x-auto text-sm">
        <code className="font-mono text-foreground">{code}</code>
      </pre>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";

const renderContent = (content: string) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      parts.push(<span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: formatText(text) }} />);
    }
    parts.push(
      <CodeBlock key={`code-${match.index}`} language={match[1] || ""} code={match[2].trim()} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    const imageMatch = remaining.match(/\[GeneratedImage:(.*?)\]/);
    if (imageMatch) {
      const beforeImage = remaining.slice(0, imageMatch.index);
      const afterImage = remaining.slice(imageMatch.index! + imageMatch[0].length);
      
      parts.push(<span key={`text-before-img`} dangerouslySetInnerHTML={{ __html: formatText(beforeImage) }} />);
      parts.push(
        <img 
          key="generated-image" 
          src={imageMatch[1]} 
          alt="AI Generated" 
          className="my-3 rounded-lg max-w-full md:max-w-md border border-border"
        />
      );
      if (afterImage) {
        parts.push(<span key={`text-after-img`} dangerouslySetInnerHTML={{ __html: formatText(afterImage) }} />);
      }
    } else {
      parts.push(<span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: formatText(remaining) }} />);
    }
  }

  return parts;
};

const formatText = (text: string): string => {
  return text
    .replace(/\[ImageData:data:image\/[^;]+;base64,[^\]]+\]/g, "")
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-sm font-mono">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-primary hover:underline">$1</a>')
    .replace(/\n/g, '<br />');
};

export const ChatMessage = memo(({ role, content, isStreaming }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === "user";
  const cleanContent = content.replace(/\[ImageData:data:image\/[^;]+;base64,[^\]]+\]/g, "");

  return (
    <div className={cn("group py-4 px-4", isUser ? "bg-transparent" : "bg-muted/30")}>
      <div className="max-w-3xl mx-auto flex gap-4">
        <div className={cn(
          "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          isUser ? "bg-primary/10" : "bg-primary"
        )}>
          {isUser ? (
            <User className="w-4 h-4 text-primary" />
          ) : (
            <Bot className="w-4 h-4 text-primary-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {isUser ? "You" : "QurobAi"}
          </div>
          
          <div className="prose prose-sm prose-invert max-w-none text-foreground leading-relaxed">
            {renderContent(cleanContent)}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
            )}
          </div>

          {!isUser && !isStreaming && (
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={copyMessage}
              >
                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";

export const TypingIndicator = memo(() => (
  <div className="py-4 px-4 bg-muted/30">
    <div className="max-w-3xl mx-auto flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
        <Bot className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex items-center gap-1 pt-2">
        <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
      </div>
    </div>
  </div>
));

TypingIndicator.displayName = "TypingIndicator";
