import { memo, useState } from "react";
import { Bot, User, Copy, Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VoiceOutput } from "@/components/VoiceOutput";

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
    <div className="my-3 rounded-lg overflow-hidden border border-border bg-secondary">
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
      <pre className="p-3 overflow-x-auto text-sm bg-background">
        <code className="font-mono text-foreground">{code}</code>
      </pre>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";

// Render generated images
const GeneratedImage = memo(({ src, prompt }: { src: string; prompt?: string }) => {
  const handleDownload = async () => {
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
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="my-4 relative group">
      <img 
        src={src} 
        alt={prompt || "AI Generated Image"} 
        className="rounded-xl max-w-full md:max-w-lg border border-border shadow-lg"
        loading="lazy"
      />
      <Button
        variant="secondary"
        size="sm"
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDownload}
      >
        <Download className="w-4 h-4 mr-1" />
        Download
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
  let lastIndex = 0;
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
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-secondary rounded text-sm font-mono">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-foreground underline hover:no-underline">$1</a>')
    .replace(/\n/g, '<br />');
};

export const ChatMessage = memo(({ role, content, isStreaming }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    // Clean content for copying
    const cleanContent = content
      .replace(/\[ImageData:data:image\/[^;]+;base64,[^\]]+\]/g, "")
      .replace(/\[GeneratedImage:.*?\]/g, "[Image]");
    await navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === "user";

  return (
    <div className={cn("group py-5 px-4", isUser ? "bg-transparent" : "bg-secondary/30")}>
      <div className="max-w-3xl mx-auto flex gap-4">
        <div className={cn(
          "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          isUser ? "bg-secondary" : "bg-foreground"
        )}>
          {isUser ? (
            <User className="w-4 h-4 text-foreground" />
          ) : (
            <Bot className="w-4 h-4 text-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {isUser ? "You" : "QurobAi"}
          </div>
          
          <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
            {renderContent(content)}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-0.5" />
            )}
          </div>

          {!isUser && !isStreaming && (
            <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={copyMessage}
              >
                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <VoiceOutput text={content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";

export const TypingIndicator = memo(() => (
  <div className="py-5 px-4 bg-secondary/30">
    <div className="max-w-3xl mx-auto flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-foreground">
        <Bot className="w-4 h-4 text-background" />
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