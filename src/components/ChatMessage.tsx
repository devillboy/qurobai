import { memo, useState, useCallback } from "react";
import { Bot, User, Copy, Check, Download, RefreshCw, Pin, PinOff, MoreHorizontal, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VoiceOutput } from "@/components/VoiceOutput";
import { CodePlayground } from "@/components/CodePlayground";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isPinned?: boolean;
  onRegenerate?: () => void;
  onPin?: () => void;
  messageId?: string;
}

const CodeBlock = memo(({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-border/50 bg-card/30 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-border">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border/50">
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wide">{language || "code"}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs gap-1.5 transition-all duration-200 hover:bg-primary/10"
          onClick={copyCode}
        >
          <span className={cn(
            "transition-all duration-200",
            copied ? "text-green-500" : "text-muted-foreground"
          )}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </span>
          <span className={cn(
            "transition-colors duration-200",
            copied ? "text-green-500" : ""
          )}>
            {copied ? "Copied!" : "Copy"}
          </span>
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="font-mono text-foreground/90">{code}</code>
      </pre>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";

// Render generated images
const GeneratedImage = memo(({ src, prompt }: { src: string; prompt?: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qurobai-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");
    } finally {
      setIsDownloading(false);
    }
  }, [src]);

  return (
    <div className="my-4 relative group rounded-xl overflow-hidden">
      <img 
        src={src} 
        alt={prompt || "AI Generated Image"} 
        className="rounded-xl max-w-full md:max-w-lg border border-border/50 transition-transform duration-300 group-hover:scale-[1.02]"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <Button
        variant="secondary"
        size="sm"
        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-lg"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        <Download className={cn("w-4 h-4 mr-1.5", isDownloading && "animate-bounce")} />
        {isDownloading ? "Downloading..." : "Download"}
      </Button>
    </div>
  );
});

GeneratedImage.displayName = "GeneratedImage";

const renderContent = (content: string) => {
  // First, remove image data from display
  let cleanContent = content.replace(/\[ImageData:data:image\/[^;]+;base64,[^\]]+\]/g, "");
  
  // Check for generated images
  const generatedImageRegex = /\[GeneratedImage:(.*?)\]/g;
  const parts: React.ReactNode[] = [];
  let match;
  
  // Find all generated images first
  const imageMatches: { index: number; url: string; fullMatch: string }[] = [];
  while ((match = generatedImageRegex.exec(cleanContent)) !== null) {
    imageMatches.push({
      index: match.index,
      url: match[1],
      fullMatch: match[0]
    });
  }
  
  // If we have generated images, process them
  if (imageMatches.length > 0) {
    let processedContent = cleanContent;
    
    for (const img of imageMatches) {
      const beforeImg = processedContent.slice(0, img.index - (cleanContent.length - processedContent.length));
      const afterImg = processedContent.slice(img.index - (cleanContent.length - processedContent.length) + img.fullMatch.length);
      
      // Add text before image
      if (beforeImg) {
        parts.push(...renderTextWithCode(beforeImg, parts.length));
      }
      
      // Add image
      parts.push(<GeneratedImage key={`img-${parts.length}`} src={img.url} />);
      
      processedContent = afterImg;
    }
    
    // Add remaining text
    if (processedContent) {
      parts.push(...renderTextWithCode(processedContent, parts.length));
    }
    
    return parts;
  }
  
  // No generated images, process normally with code blocks
  return renderTextWithCode(cleanContent, 0);
};

const renderTextWithCode = (content: string, keyOffset: number): React.ReactNode[] => {
  // Check for playground code blocks first
  const playgroundRegex = /```\[Playground\](\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let match;

  // First handle playground blocks
  const playgroundMatches: { index: number; lang: string; code: string; fullMatch: string }[] = [];
  
  while ((match = playgroundRegex.exec(content)) !== null) {
    playgroundMatches.push({
      index: match.index,
      lang: match[1] || "html",
      code: match[2].trim(),
      fullMatch: match[0]
    });
  }

  // Replace playground blocks with placeholders and render
  if (playgroundMatches.length > 0) {
    let offset = 0;
    for (const pm of playgroundMatches) {
      const before = content.slice(offset, pm.index);
      if (before) {
        parts.push(<span key={`text-${keyOffset}-${offset}`} dangerouslySetInnerHTML={{ __html: formatText(before) }} />);
      }
      parts.push(<CodePlayground key={`playground-${keyOffset}-${pm.index}`} code={pm.code} language={pm.lang} />);
      offset = pm.index + pm.fullMatch.length;
    }
    const remaining = content.slice(offset);
    if (remaining) {
      // Process remaining for normal code blocks
      return [...parts, ...renderNormalCode(remaining, keyOffset + 1000)];
    }
    return parts;
  }

  return renderNormalCode(content, keyOffset);
};

const renderNormalCode = (content: string, keyOffset: number): React.ReactNode[] => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      parts.push(<span key={`text-${keyOffset}-${lastIndex}`} dangerouslySetInnerHTML={{ __html: formatText(text) }} />);
    }
    parts.push(
      <CodeBlock key={`code-${keyOffset}-${match.index}`} language={match[1] || ""} code={match[2].trim()} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    parts.push(<span key={`text-${keyOffset}-${lastIndex}`} dangerouslySetInnerHTML={{ __html: formatText(remaining) }} />);
  }

  return parts;
};

const formatText = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-primary/10 text-primary rounded-md text-sm font-mono">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-primary underline underline-offset-2 hover:no-underline transition-all">$1</a>')
    .replace(/\n/g, '<br />');
};

// Action button component for consistency
const ActionButton = memo(({ 
  icon: Icon, 
  label, 
  onClick, 
  active = false,
  variant = "default"
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick: () => void; 
  active?: boolean;
  variant?: "default" | "success" | "warning";
}) => {
  const variantClasses = {
    default: "text-muted-foreground hover:text-foreground hover:bg-muted/80",
    success: "text-green-500 hover:text-green-600 hover:bg-green-500/10",
    warning: "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2.5 text-xs gap-1.5 rounded-lg transition-all duration-200",
            variantClasses[variant],
            active && "bg-muted"
          )}
          onClick={onClick}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
});

ActionButton.displayName = "ActionButton";

export const ChatMessage = memo(({ 
  role, 
  content, 
  isStreaming,
  isPinned = false,
  onRegenerate,
  onPin,
  messageId
}: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const copyMessage = useCallback(async () => {
    const cleanContent = content
      .replace(/\[ImageData:data:image\/[^;]+;base64,[^\]]+\]/g, "")
      .replace(/\[GeneratedImage:.*?\]/g, "[Image]");
    await navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleShare = useCallback(async () => {
    const cleanContent = content
      .replace(/\[ImageData:data:image\/[^;]+;base64,[^\]]+\]/g, "")
      .replace(/\[GeneratedImage:.*?\]/g, "[Image]");
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "QurobAi Response",
          text: cleanContent
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(cleanContent);
      toast.success("Copied for sharing!");
    }
  }, [content]);

  const handleRegenerate = useCallback(() => {
    if (onRegenerate) {
      onRegenerate();
      toast.info("Regenerating response...");
    }
  }, [onRegenerate]);

  const handlePin = useCallback(() => {
    if (onPin) {
      onPin();
      toast.success(isPinned ? "Message unpinned" : "Message pinned!");
    }
  }, [onPin, isPinned]);

  const isUser = role === "user";

  return (
    <div 
      className={cn(
        "group py-5 px-4 rounded-2xl transition-all duration-300",
        isUser ? "bg-transparent" : "bg-card/50 backdrop-blur-sm border border-transparent hover:border-border/30",
        isPinned && "ring-2 ring-primary/20 bg-primary/5"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className={cn(
          "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300",
          isUser 
            ? "bg-gradient-to-br from-secondary to-muted" 
            : "bg-gradient-to-br from-primary to-primary/80"
        )}>
          {isUser ? (
            <User className="w-4 h-4 text-foreground" />
          ) : (
            <Bot className="w-4 h-4 text-primary-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isUser ? "You" : "QurobAi"}
            </span>
            {isPinned && (
              <Pin className="w-3 h-3 text-primary animate-fade-in" />
            )}
          </div>
          
          {/* Content */}
          <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
            {renderContent(content)}
            {isStreaming && (
              <span className="inline-flex items-center gap-0.5 ml-1">
                <span className="w-1.5 h-4 bg-primary rounded-full animate-pulse" />
                <span className="w-1.5 h-4 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-4 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
              </span>
            )}
          </div>

          {/* Action bar for assistant messages */}
          {!isUser && !isStreaming && (
            <div className={cn(
              "mt-4 flex items-center gap-1 transition-all duration-300",
              showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none sm:pointer-events-auto sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:translate-y-0"
            )}>
              {/* Copy */}
              <ActionButton
                icon={copied ? Check : Copy}
                label={copied ? "Copied!" : "Copy"}
                onClick={copyMessage}
                variant={copied ? "success" : "default"}
              />

              {/* Regenerate */}
              {onRegenerate && (
                <ActionButton
                  icon={RefreshCw}
                  label="Regenerate"
                  onClick={handleRegenerate}
                />
              )}

              {/* Pin */}
              {onPin && (
                <ActionButton
                  icon={isPinned ? PinOff : Pin}
                  label={isPinned ? "Unpin" : "Pin"}
                  onClick={handlePin}
                  variant={isPinned ? "warning" : "default"}
                />
              )}

              {/* Voice */}
              <VoiceOutput text={content} />

              {/* More options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[140px]">
                  <DropdownMenuItem onClick={handleShare} className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Action bar for user messages */}
          {isUser && !isStreaming && (
            <div className={cn(
              "mt-3 flex items-center gap-1 transition-all duration-300",
              showActions ? "opacity-100" : "opacity-0 sm:group-hover:opacity-100"
            )}>
              <ActionButton
                icon={copied ? Check : Copy}
                label={copied ? "Copied!" : "Copy"}
                onClick={copyMessage}
                variant={copied ? "success" : "default"}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render when necessary
  return (
    prevProps.content === nextProps.content &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.isPinned === nextProps.isPinned &&
    prevProps.role === nextProps.role &&
    prevProps.messageId === nextProps.messageId
  );
});

ChatMessage.displayName = "ChatMessage";

export const TypingIndicator = memo(() => (
  <div className="py-5 px-4 rounded-2xl bg-card/50 backdrop-blur-sm animate-fade-in">
    <div className="max-w-3xl mx-auto flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 shadow-sm">
        <Bot className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex items-center gap-1.5 pt-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  </div>
));

TypingIndicator.displayName = "TypingIndicator";
