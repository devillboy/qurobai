import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Loader2, Image, FileText, Code, Globe, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatInputEnhancedProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

interface AttachmentFile {
  name: string;
  type: string;
  url: string;
  size: number;
}

export const ChatInputEnhanced = ({ onSend, isLoading }: ChatInputEnhancedProps) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [webSearchMode, setWebSearchMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [message]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    const newAttachments: AttachmentFile[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        continue;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, file);

      if (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(data.path);

      newAttachments.push({
        name: file.name,
        type: file.type,
        url: urlData.publicUrl,
        size: file.size,
      });

      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully`,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if ((!message.trim() && attachments.length === 0) || isLoading) return;
    
    let fullMessage = message;
    
    // Prepend web search instruction if mode is enabled
    if (webSearchMode && message.trim()) {
      fullMessage = `[Web Search] Search the web for: ${message}`;
    }
    
    if (attachments.length > 0) {
      const attachmentText = attachments
        .map((a) => `[Attached: ${a.name}](${a.url})`)
        .join("\n");
      fullMessage = attachments.length > 0 && fullMessage 
        ? `${fullMessage}\n\n${attachmentText}` 
        : attachmentText;
    }
    
    onSend(fullMessage);
    setMessage("");
    setAttachments([]);
    setWebSearchMode(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (type.includes("code") || type.includes("javascript") || type.includes("python")) 
      return <Code className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <TooltipProvider>
      <div className="relative">
        {/* Web Search Mode Indicator */}
        {webSearchMode && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg">
            <Globe className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">Web Search Mode Active</span>
            <button
              onClick={() => setWebSearchMode(false)}
              className="ml-auto text-primary hover:text-primary/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="group relative bg-secondary/50 rounded-xl p-2 pr-8 flex items-center gap-2 border border-border/50"
              >
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {getFileIcon(file.type)}
                  </div>
                )}
                <span className="text-sm text-foreground/80 max-w-[100px] truncate">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute right-1 top-1 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Container */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-purple-500/30 to-pink-500/30 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative bg-card/90 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
            <div className="flex items-end gap-2 p-3">
              {/* File Upload */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.js,.ts,.py,.json,.csv,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>

              {/* Web Search Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setWebSearchMode(!webSearchMode)}
                    className={`h-10 w-10 rounded-xl transition-colors shrink-0 ${
                      webSearchMode 
                        ? "bg-primary/20 text-primary" 
                        : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {webSearchMode ? "Disable Web Search" : "Enable Web Search"}
                </TooltipContent>
              </Tooltip>

              {/* Text Input */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={webSearchMode ? "Search the web..." : "Ask QurobAi anything..."}
                rows={1}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none min-h-[40px] max-h-[200px] py-2 px-1"
              />

              {/* Send Button */}
              <Button
                onClick={handleSubmit}
                disabled={(!message.trim() && attachments.length === 0) || isLoading}
                className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-lg shadow-primary/25"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Bottom hint */}
            <div className="px-4 pb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </span>
              <span className="text-xs text-muted-foreground">
                Powered by QurobAi
              </span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
