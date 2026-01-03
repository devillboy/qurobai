import { memo, useState, useEffect, useRef } from "react";
import { Copy, Check, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// Code block component - clean professional style
const CodeBlock = memo(({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-lg overflow-hidden bg-[#1e1e1e] border border-border/30">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161616] border-b border-border/20">
        <span className="text-xs font-mono text-muted-foreground">{language || "code"}</span>
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
        <code className="text-sm font-mono text-[#d4d4d4] leading-relaxed">{code}</code>
      </pre>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";

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
  // Handle generated images
  if (text.includes("[GeneratedImage:")) {
    const imageMatch = text.match(/\[GeneratedImage:(.*?)\]/);
    if (imageMatch) {
      const imageUrl = imageMatch[1];
      const beforeImage = text.slice(0, text.indexOf("[GeneratedImage:"));
      const afterImage = text.slice(text.indexOf("]", text.indexOf("[GeneratedImage:")) + 1);
      
      return (
        <>
          {beforeImage && <span dangerouslySetInnerHTML={{ __html: formatText(beforeImage) }} />}
          <div className="my-3">
            <img 
              src={imageUrl} 
              alt="AI Generated Image" 
              className="max-w-full rounded-lg border border-border"
              loading="lazy"
            />
          </div>
          {afterImage && <span dangerouslySetInnerHTML={{ __html: formatText(afterImage) }} />}
        </>
      );
    }
  }
  
  return <span dangerouslySetInnerHTML={{ __html: formatText(text) }} />;
};

const formatText = (text: string): string => {
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
  formatted = formatted.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-foreground">$1</code>');
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
  return formatted;
};

export const ChatMessage = memo(({ role, content, isStreaming }: ChatMessageProps) => {
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

  // Filter out image data from display
  const cleanContent = displayedContent.replace(/\[ImageData:data:image\/[^;]+;base64,[^\]]+\]/g, "");

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div 
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-foreground" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`group relative rounded-2xl px-4 py-2.5 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border"
          }`}
        >
          <div className={`text-sm leading-relaxed ${isUser ? "" : "text-foreground"}`}>
            {isUser ? cleanContent : renderContent(cleanContent)}
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse" />
            )}
          </div>

          {/* Copy button for assistant messages */}
          {!isUser && !isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="absolute -bottom-7 left-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
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
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";

// Enhanced Thinking Indicator
export const TypingIndicator = memo(() => {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
        <Bot className="w-3.5 h-3.5 text-foreground" />
      </div>
      <div className="bg-card border border-border rounded-2xl px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
});

TypingIndicator.displayName = "TypingIndicator";
