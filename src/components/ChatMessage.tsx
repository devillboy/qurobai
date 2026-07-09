import { memo, useState, useCallback, useMemo } from "react";
import { BadgeCheck, User, Copy, Check, Download, RefreshCw, Pin, PinOff, MoreHorizontal, Share2, Maximize2, Pencil, ThumbsUp, ThumbsDown, Heart, X, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  timestamp?: Date;
  latencyMs?: number;
  onRegenerate?: () => void;
  onPin?: () => void;
  onEdit?: (newContent: string) => void;
  messageId?: string;
  sources?: { title: string; url: string; favicon: string }[];
}

// Loading skeleton component for messages
export const ChatMessageSkeleton = memo(() => {
  return (
    <div className="py-5 px-4 md:px-6 rounded-xl bg-card/40 border border-border/10">
      <div className="max-w-3xl mx-auto flex gap-4">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary/50 to-accent/50 skeleton-pulse" />
        <div className="flex-1 min-w-0 space-y-3">
          <Skeleton className="h-3 w-16 bg-primary/20" />
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

const TokenStreamingSkeleton = memo(() => (
  <div className="space-y-3 animate-fade-in" aria-label="QurobAi is streaming a response">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <span className="font-medium">Streaming tokens</span>
    </div>
    <div className="space-y-2.5">
      <Skeleton className="h-4 w-[96%] bg-primary/10" />
      <Skeleton className="h-4 w-[88%] bg-muted/70" />
      <Skeleton className="h-4 w-[72%] bg-muted/60" />
    </div>
  </div>
));

TokenStreamingSkeleton.displayName = "TokenStreamingSkeleton";

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
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed scrollbar-thin">
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
        <Button variant="secondary" size="sm" className="shadow-lg backdrop-blur-sm bg-background/80" onClick={handleDownload} disabled={isDownloading}>
          <Download className={cn("w-4 h-4 mr-1.5", isDownloading && "animate-bounce")} />
          {isDownloading ? "..." : "Save"}
        </Button>
        <Button variant="secondary" size="sm" className="shadow-lg backdrop-blur-sm bg-background/80" onClick={() => window.open(src, "_blank")}>
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

GeneratedImage.displayName = "GeneratedImage";

// Strip [Web Search] and [Deep Search] prefixes from user messages
function stripSearchPrefixes(text: string): string {
  return text
    .replace(/^\[Web Search\]\s*/i, "")
    .replace(/^\[Deep Search\]\s*/i, "")
    .replace(/^\[Qurob:.*?\]\s*/i, "");
}

// Secure text formatting with XSS protection
const formatText = (text: string): string => {
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-foreground/80">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-primary/10 text-primary rounded-md text-[13px] font-mono">$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:text-primary/80 transition-all inline-flex items-center gap-1">$1 ↗</a>')
    .replace(/(^|[^"(])(https?:\/\/[^\s<")\]]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:text-primary/80 transition-all break-all">$2 ↗</a>')
    .replace(/\n/g, '<br />');
  
  return sanitizeHtml(formatted);
};

// Render inline attached images
const InlineAttachedImage = memo(({ src, name }: { src: string; name?: string }) => (
  <div className="my-2 inline-block">
    <img 
      src={src} 
      alt={name || "Attached image"} 
      className="rounded-lg max-w-[200px] max-h-[200px] object-cover border border-border/50 cursor-pointer hover:opacity-90 transition-opacity"
      loading="lazy"
      onClick={() => window.open(src, "_blank")}
    />
  </div>
));
InlineAttachedImage.displayName = "InlineAttachedImage";

// Render attached files
const InlineAttachedFile = memo(({ name, url }: { name: string; url: string }) => (
  <a 
    href={url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="my-1 inline-flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border/40 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
  >
    📎 <span className="truncate max-w-[200px]">{name}</span>
  </a>
));
InlineAttachedFile.displayName = "InlineAttachedFile";

const renderContent = (content: string, isUser: boolean) => {
  // Extract and render inline images from base64 data
  const imageDataRegex = /\[ImageData:(data:image\/[^;]+;base64,[^\]]+)\]/g;
  const inlineImages: { url: string }[] = [];
  let imgMatch;
  while ((imgMatch = imageDataRegex.exec(content)) !== null) {
    inlineImages.push({ url: imgMatch[1] });
  }
  
  let cleanContent = content.replace(/\[ImageData:data:image\/[^;]+;base64,[^\]]+\]/g, "");
  
  // Extract attachment links
  const attachmentRegex = /\[Attachment:\s*([^\]]+)\]\(([^)]+)\)/g;
  const attachments: { name: string; url: string }[] = [];
  let attMatch;
  while ((attMatch = attachmentRegex.exec(cleanContent)) !== null) {
    attachments.push({ name: attMatch[1], url: attMatch[2] });
  }
  cleanContent = cleanContent.replace(/\[Attachment:\s*[^\]]+\]\([^)]+\)/g, "");
  
  if (isUser) cleanContent = stripSearchPrefixes(cleanContent);
  
  const generatedImageRegex = /\[GeneratedImage:((?:https?:\/\/[^\]]+|data:image\/[^\]]+))\]/g;
  const parts: React.ReactNode[] = [];
  let match;
  
  const imageMatches: { index: number; url: string; fullMatch: string }[] = [];
  while ((match = generatedImageRegex.exec(cleanContent)) !== null) {
    imageMatches.push({ index: match.index, url: match[1], fullMatch: match[0] });
  }
  
  // Add inline uploaded images first
  if (inlineImages.length > 0) {
    parts.push(
      <div key="inline-images" className="flex flex-wrap gap-2 mb-2">
        {inlineImages.map((img, i) => <InlineAttachedImage key={`att-img-${i}`} src={img.url} />)}
      </div>
    );
  }
  
  if (imageMatches.length > 0) {
    let lastIndex = 0;
    for (const img of imageMatches) {
      const beforeImg = cleanContent.slice(lastIndex, img.index);
      if (beforeImg.trim()) parts.push(...renderTextWithCode(beforeImg, parts.length));
      parts.push(<GeneratedImage key={`img-${parts.length}`} src={img.url} />);
      lastIndex = img.index + img.fullMatch.length;
    }
    const remaining = cleanContent.slice(lastIndex);
    if (remaining.trim()) parts.push(...renderTextWithCode(remaining, parts.length));
  } else {
    parts.push(...renderTextWithCode(cleanContent, parts.length));
  }
  
  // Add attachment files at the end
  if (attachments.length > 0) {
    parts.push(
      <div key="attachments" className="flex flex-wrap gap-2 mt-2">
        {attachments.map((att, i) => <InlineAttachedFile key={`att-file-${i}`} name={att.name} url={att.url} />)}
      </div>
    );
  }
  
  return parts;
};

const renderTextWithCode = (content: string, keyOffset: number): React.ReactNode[] => {
  const playgroundRegex = /```\[Playground\](\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let match;

  const playgroundMatches: { index: number; lang: string; code: string; fullMatch: string }[] = [];
  while ((match = playgroundRegex.exec(content)) !== null) {
    playgroundMatches.push({ index: match.index, lang: match[1] || "html", code: match[2].trim(), fullMatch: match[0] });
  }

  if (playgroundMatches.length > 0) {
    let offset = 0;
    for (const pm of playgroundMatches) {
      const before = content.slice(offset, pm.index);
      if (before) parts.push(<span key={`text-${keyOffset}-${offset}`} dangerouslySetInnerHTML={{ __html: formatText(before) }} />);
      parts.push(<CodePlayground key={`playground-${keyOffset}-${pm.index}`} code={pm.code} language={pm.lang} />);
      offset = pm.index + pm.fullMatch.length;
    }
    const remaining = content.slice(offset);
    if (remaining) return [...parts, ...renderNormalCode(remaining, keyOffset + 1000)];
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
    parts.push(<CodeBlock key={`code-${keyOffset}-${match.index}`} language={match[1] || ""} code={match[2].trim()} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    parts.push(<span key={`text-${keyOffset}-${lastIndex}`} dangerouslySetInnerHTML={{ __html: formatText(remaining) }} />);
  }

  return parts;
};

// Action button
const ActionButton = memo(({ icon: Icon, label, onClick, active = false, variant = "default" }: { 
  icon: React.ElementType; label: string; onClick: () => void; active?: boolean; variant?: "default" | "success" | "warning";
}) => {
  const variantClasses = {
    default: "text-muted-foreground hover:text-foreground hover:bg-muted/80",
    success: "text-green-500 hover:text-green-600 hover:bg-green-500/10",
    warning: "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-8 px-2.5 text-xs gap-1.5 rounded-lg transition-all duration-200", variantClasses[variant], active && "bg-muted")} onClick={onClick}>
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
});

ActionButton.displayName = "ActionButton";

// Emoji reaction button
const ReactionButton = memo(({ emoji, count, active, onClick }: { emoji: string; count: number; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all border",
      active 
        ? "bg-primary/15 border-primary/30 text-primary" 
        : "bg-muted/40 border-border/30 text-muted-foreground hover:bg-muted/60"
    )}
  >
    <span>{emoji}</span>
    {count > 0 && <span className="text-[10px]">{count}</span>}
  </button>
));
ReactionButton.displayName = "ReactionButton";

export const ChatMessage = memo(({ role, content, isStreaming, isPinned = false, timestamp, latencyMs, onRegenerate, onPin, onEdit, messageId, sources }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [reactions, setReactions] = useState<Record<string, boolean>>({});

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
      try { await navigator.share({ title: "QurobAi Response", text: cleanContent }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(cleanContent);
      toast.success("Copied for sharing!");
    }
  }, [content]);

  const handleRegenerate = useCallback(() => {
    if (onRegenerate) { onRegenerate(); toast.info("Regenerating..."); }
  }, [onRegenerate]);

  const handlePin = useCallback(() => {
    if (onPin) { onPin(); toast.success(isPinned ? "Unpinned" : "Pinned!"); }
  }, [onPin, isPinned]);

  const handleEditSave = useCallback(() => {
    if (onEdit && editContent.trim() && editContent !== content) {
      onEdit(editContent.trim());
      toast.success("Message edited, regenerating...");
    }
    setIsEditing(false);
  }, [onEdit, editContent, content]);

  const handleEditCancel = useCallback(() => {
    setEditContent(content);
    setIsEditing(false);
  }, [content]);

  const toggleReaction = useCallback((emoji: string) => {
    setReactions(prev => ({ ...prev, [emoji]: !prev[emoji] }));
  }, []);

  const isUser = role === "user";

  const renderedContent = useMemo(() => renderContent(content, isUser), [content, isUser]);
  const showStreamingSkeleton = !isUser && isStreaming && !content.trim();
  const latencyLabel = latencyMs ? `${(latencyMs / 1000).toFixed(latencyMs < 10000 ? 1 : 0)}s` : null;

  return (
    <div 
      className={cn(
        "group py-5 px-4 md:px-6 rounded-xl transition-all duration-200 animate-fade-in",
        isUser 
          ? "bg-transparent" 
          : "bg-card/40 border-l-2 border-l-primary/20 border border-border/10 hover:border-border/20",
        isPinned && "ring-1 ring-primary/20 bg-primary/5"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className={cn(
          "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
          isUser 
            ? "bg-muted border border-border/40" 
            : "bg-primary/10 border border-primary/15"
        )}>
          {isUser ? <User className="w-4 h-4 text-foreground/80" /> : <BadgeCheck className="w-4 h-4 text-primary" />}
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
            {timestamp && (
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </span>
            )}
            {isPinned && <Pin className="w-3 h-3 text-amber-500 animate-fade-in" />}
            {!isUser && latencyLabel && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Timer className="w-3 h-3" /> {latencyLabel}
              </span>
            )}
          </div>
          
          {/* Content or Edit mode */}
          {isUser && isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] text-[14.5px] bg-muted/30 border-border/50"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-7 text-xs btn-3d" onClick={handleEditSave}>Save & Resend</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleEditCancel}>
                  <X className="w-3 h-3 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className={cn(
              "max-w-none",
              isUser 
                ? "text-foreground/85 text-[14.5px] leading-relaxed" 
                : "text-foreground/80 text-[14.5px] leading-[1.8] tracking-[0.01em]"
            )}>
              {showStreamingSkeleton ? <TokenStreamingSkeleton /> : renderedContent}
              {isStreaming && (
                <span className="inline-flex items-center gap-1 ml-1.5 align-middle">
                  <span className="w-[3px] h-5 bg-primary rounded-sm animate-pulse" />
                </span>
              )}
            </div>
          )}

          {/* Source citation chips */}
          {!isUser && sources && sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sources.slice(0, 8).map((s, i) => (
                <a
                  key={`${s.url}-${i}`}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/40 border border-border/40 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors max-w-[220px]"
                  title={s.title}
                >
                  {s.favicon ? (
                    <img src={s.favicon} alt="" className="w-3.5 h-3.5 rounded-sm" loading="lazy" />
                  ) : null}
                  <span className="truncate">{s.title || new URL(s.url).hostname}</span>
                </a>
              ))}
            </div>
          )}

          {/* Action bar — assistant */}
          {!isUser && !isStreaming && (
            <div className={cn(
              "mt-4 flex items-center gap-1 transition-all duration-300 flex-wrap",
              showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-hover:translate-y-0"
            )}>
              <ActionButton icon={copied ? Check : Copy} label={copied ? "Copied!" : "Copy"} onClick={copyMessage} variant={copied ? "success" : "default"} />
              {onRegenerate && <ActionButton icon={RefreshCw} label="Regenerate" onClick={handleRegenerate} />}
              {onPin && <ActionButton icon={isPinned ? PinOff : Pin} label={isPinned ? "Unpin" : "Pin"} onClick={handlePin} variant={isPinned ? "warning" : "default"} />}
              <VoiceOutput text={content} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
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
              {/* Emoji reactions */}
              <div className="flex items-center gap-1 ml-2">
                <ReactionButton emoji="👍" count={reactions["👍"] ? 1 : 0} active={!!reactions["👍"]} onClick={() => toggleReaction("👍")} />
                <ReactionButton emoji="👎" count={reactions["👎"] ? 1 : 0} active={!!reactions["👎"]} onClick={() => toggleReaction("👎")} />
                <ReactionButton emoji="❤️" count={reactions["❤️"] ? 1 : 0} active={!!reactions["❤️"]} onClick={() => toggleReaction("❤️")} />
              </div>
            </div>
          )}

          {/* User message actions — with Edit */}
          {isUser && !isStreaming && !isEditing && (
            <div className={cn(
              "mt-3 flex items-center gap-1 transition-all duration-300",
              showActions ? "opacity-100" : "opacity-0 sm:group-hover:opacity-100"
            )}>
              <ActionButton icon={copied ? Check : Copy} label={copied ? "Copied!" : "Copy"} onClick={copyMessage} variant={copied ? "success" : "default"} />
              {onEdit && (
                <ActionButton icon={Pencil} label="Edit" onClick={() => { setEditContent(content); setIsEditing(true); }} />
              )}
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
    prevProps.messageId === nextProps.messageId &&
    prevProps.latencyMs === nextProps.latencyMs &&
    prevProps.onEdit === nextProps.onEdit &&
    (prevProps.sources?.length ?? 0) === (nextProps.sources?.length ?? 0) &&
    prevProps.timestamp?.getTime() === nextProps.timestamp?.getTime()
  );
});

ChatMessage.displayName = "ChatMessage";

export const TypingIndicator = memo(() => (
  <div className="py-5 px-4 md:px-6 rounded-2xl bg-card/40 border border-border/10 animate-fade-in">
    <div className="max-w-3xl mx-auto flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/15">
        <BadgeCheck className="w-4 h-4 text-primary" />
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
