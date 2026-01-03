import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Loader2, Image, FileText, Code, Search, Mic, MicOff } from "lucide-react";
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
  base64?: string;
}

export const ChatInputEnhanced = ({ onSend, isLoading }: ChatInputEnhancedProps) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [webSearchMode, setWebSearchMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { user } = useAuth();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setMessage((prev) => {
            const words = prev.split(" ");
            // Replace last partial word with new transcript
            if (words.length > 0 && !prev.endsWith(" ")) {
              words.pop();
            }
            return (words.join(" ") + " " + transcript).trim();
          });
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          if (event.error === "not-allowed") {
            toast({
              title: "Microphone access denied",
              description: "Please allow microphone access to use voice input",
              variant: "destructive",
            });
          }
        };

        recognitionRef.current.onend = () => {
          if (isRecording) {
            // Restart if still supposed to be recording
            try {
              recognitionRef.current.start();
            } catch (e) {
              setIsRecording(false);
            }
          }
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setMessage("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

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

      // Convert image to base64 for vision
      let base64Data: string | undefined;
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        base64Data = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
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
        base64: base64Data,
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
    
    // Stop recording if active
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    
    let fullMessage = message;
    
    // Prepend web search instruction if mode is enabled
    if (webSearchMode && message.trim()) {
      fullMessage = `[Web Search] Search the web for: ${message}`;
    }
    
    // Handle image attachments for vision
    if (attachments.length > 0) {
      const imageAttachments = attachments.filter(a => a.type.startsWith("image/") && a.base64);
      const otherAttachments = attachments.filter(a => !a.type.startsWith("image/") || !a.base64);
      
      // For images with base64, send as vision request
      if (imageAttachments.length > 0) {
        const imageInfo = imageAttachments.map(a => `[Image: ${a.name}](${a.url})\n[ImageData:${a.base64}]`).join("\n");
        fullMessage = fullMessage 
          ? `${fullMessage}\n\n${imageInfo}` 
          : `Analyze this image:\n${imageInfo}`;
      }
      
      // For other files
      if (otherAttachments.length > 0) {
        const attachmentText = otherAttachments
          .map((a) => `[Attached: ${a.name}](${a.url})`)
          .join("\n");
        fullMessage = fullMessage 
          ? `${fullMessage}\n\n${attachmentText}` 
          : attachmentText;
      }
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
            <Search className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Web Search Mode</span>
            <button
              onClick={() => setWebSearchMode(false)}
              className="ml-auto text-primary hover:text-primary/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-500 font-medium">Listening...</span>
            <button
              onClick={toggleRecording}
              className="ml-auto text-red-500 hover:text-red-400"
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
                className="group relative bg-secondary rounded-lg p-2 pr-8 flex items-center gap-2 border border-border"
              >
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                    {getFileIcon(file.type)}
                  </div>
                )}
                <span className="text-sm text-foreground max-w-[100px] truncate">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute right-1 top-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Container - Clean design */}
        <div className="bg-secondary/50 rounded-xl border border-border overflow-hidden focus-within:border-primary/50 transition-colors">
          <div className="flex items-end gap-1 p-2">
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
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
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

            {/* Voice Input Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleRecording}
                  className={`h-9 w-9 rounded-lg shrink-0 transition-colors ${
                    isRecording 
                      ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRecording ? "Stop recording" : "Voice input"}
              </TooltipContent>
            </Tooltip>

            {/* Web Search Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setWebSearchMode(!webSearchMode)}
                  className={`h-9 w-9 rounded-lg shrink-0 transition-colors ${
                    webSearchMode 
                      ? "bg-primary/20 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
              placeholder={
                isRecording 
                  ? "Speak now..." 
                  : webSearchMode 
                    ? "Search the web..." 
                    : "Message QurobAi..."
              }
              rows={1}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none min-h-[36px] max-h-[200px] py-2 px-2 text-sm"
            />

            {/* Send Button */}
            <Button
              onClick={handleSubmit}
              disabled={(!message.trim() && attachments.length === 0) || isLoading}
              size="icon"
              className="h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Bottom hint */}
        <div className="mt-2 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">
            Enter to send · Shift+Enter for new line
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
};
