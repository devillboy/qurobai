import { memo, useState, useCallback, useMemo } from "react";
import { Bot, User, Copy, Check, Download, RefreshCw, Pin, PinOff, MoreHorizontal, Share2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VoiceOutput } from "@/components/VoiceOutput";
import { CodePlayground } from "@/components/CodePlayground";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/sanitize";
 import { Skeleton } from "@/components/ui/skeleton";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isPinned?: boolean;
  onRegenerate?: () => void;
  onPin?: () => void;
  messageId?: string;
}

 // Loading skeleton component for messages
 export const ChatMessageSkeleton = memo(() => {
   return (
     <div className="py-5 px-4 md:px-6 rounded-2xl bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/20">
       <div className="max-w-3xl mx-auto flex gap-4">
         {/* Avatar skeleton */}
         <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary/50 to-accent/50 skeleton-pulse" />
         
         <div className="flex-1 min-w-0 space-y-3">
           {/* Header skeleton */}
           <Skeleton className="h-3 w-16 bg-primary/20" />
           
           {/* Content skeleton lines */}
           <div className="space-y-2">
             <Skeleton className="h-4 w-full bg-muted/50" />
             <Skeleton className="h-4 w-[90%] bg-muted/50" />
             <Skeleton className="h-4 w-[75%] bg-muted/50" />
           </div>
         </div>
       </div>
     </div>
   );
 });
 
 ChatMessageSkeleton.displayName = "ChatMessageSkeleton";
 
// Claude-style code block with enhanced design
const CodeBlock = memo(({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-border/60 bg-[hsl(225_15%_8%)] shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/30 group">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider ml-2">{language || "code"}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity"
          onClick={copyCode}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed scrollbar-thin">
        <code className="font-mono text-foreground/90">{code}</code>
      </pre>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";

// Generated image with enhanced design
const GeneratedImage = memo(({ src, prompt }: { src: string; prompt?: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

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
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Download failed");
    } finally {
      setIsDownloading(false);
    }
  }, [src]);

  if (error) {
    return (
      <div className="my-4 p-8 rounded-xl border border-border/50 bg-muted/20 text-center">
        <p className="text-muted-foreground text-sm">Failed to load image</p>
      </div>
    );
  }

  return (
    <div className="my-4 relative group rounded-xl overflow-hidden shadow-lg">
      {!loaded && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse rounded-xl flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img 
        src={src} 
        alt={prompt || "AI Generated Image"} 
        className={cn(
          "rounded-xl max-w-full md:max-w-lg border border-border/50 transition-all duration-500",
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
          "group-hover:shadow-xl group-hover:border-primary/30"
        )}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl" />
      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <Button
          variant="secondary"
          size="sm"
          className="shadow-lg backdrop-blur-sm bg-background/80"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download className={cn("w-4 h-4 mr-1.5", isDownloading && "animate-bounce")} />
          {isDownloading ? "..." : "Save"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="shadow-lg backdrop-blur-sm bg-background/80"
          onClick={() => window.open(src, "_blank")}
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

GeneratedImage.displayName = "GeneratedImage";

// Secure text formatting with XSS protection
const formatText = (text: string): string => {
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-primary/10 text-primary rounded-md text-sm font-mono">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:no-underline transition-all">$1</a>')
    .replace(/\n/g, '<br />');
  
  // Sanitize HTML to prevent XSS attacks
  return sanitizeHtml(formatted);
};

const renderContent = (content: string) => {
  // Remove image data from display
  let cleanContent = content.replace(/\[ImageData:data:image\/[^;]+;base64,[^\]]+\]/g, "");
  
  // Check for generated images with improved regex
  const generatedImageRegex = /\[GeneratedImage:((?:https?:\/\/[^\]]+|data:image\/[^\]]+))\]/g;
  const parts: React.ReactNode[] = [];
  let match;
  
  const imageMatches: { index: number; url: string; fullMatch: string }[] = [];
  while ((match = generatedImageRegex.exec(cleanContent)) !== null) {
    imageMatches.push({
      index: match.index,
      url: match[1],
      fullMatch: match[0]
    });
  }
  
  if (imageMatches.length > 0) {
    let lastIndex = 0;
    
    for (const img of imageMatches) {
      const beforeImg = cleanContent.slice(lastIndex, img.index);
      
      if (beforeImg.trim()) {
        parts.push(...renderTextWithCode(beforeImg, parts.length));
      }
      
      parts.push(<GeneratedImage key={`img-${parts.length}`} src={img.url} />);
      lastIndex = img.index + img.fullMatch.length;
    }
    
    const remaining = cleanContent.slice(lastIndex);
    if (remaining.trim()) {
      parts.push(...renderTextWithCode(remaining, parts.length));
    }
    
    return parts;
  }
  
  return renderTextWithCode(cleanContent, 0);
};

const renderTextWithCode = (content: string, keyOffset: number): React.ReactNode[] => {
  const playgroundRegex = /```\[Playground\](\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let match;

  const playgroundMatches: { index: number; lang: string; code: string; fullMatch: string }[] = [];
  
  while ((match = playgroundRegex.exec(content)) !== null) {
    playgroundMatches.push({
      index: match.index,
      lang: match[1] || "html",
      code: match[2].trim(),
      fullMatch: match[0]
    });
  }

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

// Action button with Claude-inspired design
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
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleShare = useCallback(async () => {
    const cleanContent = content
      .replace(/\[ImageData:data:image\/[^;]+;base64,[^\]]+\]/g, "")
      .replace(/\[GeneratedImage:.*?\]/g, "[Image]");
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "QurobAi Response", text: cleanContent });
      } catch { /* User cancelled */ }
    } else {
      await navigator.clipboard.writeText(cleanContent);
      toast.success("Copied for sharing!");
    }
  }, [content]);

  const handleRegenerate = useCallback(() => {
    if (onRegenerate) {
      onRegenerate();
      toast.info("Regenerating...");
    }
  }, [onRegenerate]);

  const handlePin = useCallback(() => {
    if (onPin) {
      onPin();
      toast.success(isPinned ? "Unpinned" : "Pinned!");
    }
  }, [onPin, isPinned]);

  const isUser = role === "user";

  // Memoize rendered content
  const renderedContent = useMemo(() => renderContent(content), [content]);

  return (
    <div 
      className={cn(
        "group py-5 px-4 md:px-6 rounded-2xl transition-all duration-300",
        isUser 
          ? "bg-transparent" 
          : "bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/20 hover:border-border/40 shadow-sm hover:shadow-md",
        isPinned && "ring-2 ring-primary/30 bg-primary/5"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar - Claude style */}
        <div className={cn(
          "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all duration-300",
          isUser 
            ? "bg-gradient-to-br from-muted to-muted/80 border border-border/50" 
            : "bg-gradient-to-br from-primary via-primary to-accent shadow-primary/20"
        )}>
          {isUser ? (
            <User className="w-4 h-4 text-foreground/80" />
          ) : (
            <Bot className="w-4 h-4 text-primary-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              isUser ? "text-muted-foreground" : "text-primary"
            )}>
              {isUser ? "You" : "QurobAi"}
            </span>
            {isPinned && (
              <Pin className="w-3 h-3 text-amber-500 animate-fade-in" />
            )}
          </div>
          
          {/* Content */}
          <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed">
            {renderedContent}
            {isStreaming && (
              <span className="inline-flex items-center gap-1 ml-1.5 align-middle">
                <span className="w-2 h-5 bg-primary rounded-sm animate-pulse" />
              </span>
            )}
          </div>

          {/* Action bar - Claude style */}
          {!isUser && !isStreaming && (
            <div className={cn(
              "mt-4 flex items-center gap-1 transition-all duration-300",
              showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-hover:translate-y-0"
            )}>
              <ActionButton
                icon={copied ? Check : Copy}
                label={copied ? "Copied!" : "Copy"}
                onClick={copyMessage}
                variant={copied ? "success" : "default"}
              />

              {onRegenerate && (
                <ActionButton
                  icon={RefreshCw}
                  label="Regenerate"
                  onClick={handleRegenerate}
                />
              )}

              {onPin && (
                <ActionButton
                  icon={isPinned ? PinOff : Pin}
                  label={isPinned ? "Unpin" : "Pin"}
                  onClick={handlePin}
                  variant={isPinned ? "warning" : "default"}
                />
              )}

              <VoiceOutput text={content} />

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

          {/* User message actions */}
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
  <div className="py-5 px-4 md:px-6 rounded-2xl bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/20 animate-fade-in">
    <div className="max-w-3xl mx-auto flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
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
