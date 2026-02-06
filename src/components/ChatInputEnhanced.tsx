import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, MicOff, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TemplatesPicker } from "@/components/TemplatesPicker";

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

export function ChatInputEnhanced({ onSend, isLoading }: ChatInputEnhancedProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        // Use single result mode for cleaner transcription
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setMessage(prev => prev + (prev ? " " : "") + transcript);
          toast.success("Voice captured!");
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          if (event.error === "not-allowed") {
            toast.error("Microphone access denied");
          } else if (event.error === "no-speech") {
            toast.info("No speech detected. Try again.");
          }
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.info("Listening... Speak now");
      } catch (e) {
        console.error("Failed to start recording:", e);
        toast.error("Failed to start voice input");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    const fileArray = Array.from(files);
    setUploading(true);

    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }

      try {
        if (file.type.startsWith("image/")) {
          // For images, read as base64 for vision AND upload to storage
          const reader = new FileReader();
          
          await new Promise<void>((resolve, reject) => {
            reader.onload = async (event) => {
              try {
                const base64 = event.target?.result as string;
                
                const fileName = `${user.id}/${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage
                  .from("chat-attachments")
                  .upload(fileName, file);

                if (error) {
                  console.error("Upload error:", error);
                  toast.error(`Failed to upload ${file.name}`);
                  resolve();
                  return;
                }

                const { data: urlData } = supabase.storage
                  .from("chat-attachments")
                  .getPublicUrl(data.path);

                setAttachments(prev => [...prev, {
                  name: file.name,
                  type: file.type,
                  url: urlData.publicUrl,
                  size: file.size,
                  base64,
                }]);
                resolve();
              } catch (err) {
                console.error("Processing error:", err);
                reject(err);
              }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
        } else {
          // Non-image files - just upload to storage
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from("chat-attachments")
            .upload(fileName, file);

          if (error) {
            console.error("Upload error:", error);
            toast.error(`Failed to upload ${file.name}`);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from("chat-attachments")
            .getPublicUrl(data.path);

          setAttachments(prev => [...prev, {
            name: file.name,
            type: file.type,
            url: urlData.publicUrl,
            size: file.size,
          }]);
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;

    let finalMessage = trimmedMessage;

    // Add image data for vision analysis
    const imageAttachments = attachments.filter(a => a.type.startsWith("image/") && a.base64);
    if (imageAttachments.length > 0) {
      const imageData = imageAttachments.map(a => `[ImageData:${a.base64}]`).join("");
      finalMessage = finalMessage + "\n" + imageData;
    }

    // Add other attachments as links
    const otherAttachments = attachments.filter(a => !a.type.startsWith("image/"));
    if (otherAttachments.length > 0) {
      const attachmentLinks = otherAttachments.map(a => `[Attachment: ${a.name}](${a.url})`).join("\n");
      finalMessage = finalMessage + "\n" + attachmentLinks;
    }

    onSend(finalMessage);
    setMessage("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTemplateSelect = (prompt: string) => {
    setMessage(prompt);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [message]);

  return (
    <div className="bg-background/95 backdrop-blur-sm p-3 md:p-4 safe-area-bottom border-t border-border/50">
      <div className="max-w-3xl mx-auto">
        {/* Templates Picker */}
        {showTemplates && (
          <TemplatesPicker 
            onSelect={handleTemplateSelect} 
            onClose={() => setShowTemplates(false)} 
          />
        )}

        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {attachments.map((file, index) => (
              <div key={index} className="relative group animate-fade-in">
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-14 w-14 md:h-16 md:w-16 object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="h-14 md:h-16 px-3 flex items-center bg-secondary rounded-lg border border-border">
                    <span className="text-xs truncate max-w-[80px] md:max-w-[100px]">{file.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                  style={{ minHeight: '24px', minWidth: '24px' }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {isRecording && (
          <div className="flex items-center gap-2 mb-3 text-sm text-foreground animate-pulse bg-red-500/10 p-2 rounded-lg">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span>Listening... Speak now</span>
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-secondary/80 backdrop-blur-sm rounded-2xl border border-border/50 p-2 shadow-lg">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Templates Button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-11 w-11 md:h-10 md:w-10 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-xl touch-manipulation"
            onClick={() => setShowTemplates(!showTemplates)}
            title="Quick Templates"
          >
            <Sparkles className="w-5 h-5 md:w-4 md:h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-11 w-11 md:h-10 md:w-10 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-xl touch-manipulation"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || uploading}
          >
            {uploading ? <Loader2 className="w-5 h-5 md:w-4 md:h-4 animate-spin" /> : <Paperclip className="w-5 h-5 md:w-4 md:h-4" />}
          </Button>

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message QurobAi..."
            disabled={isLoading}
            className="flex-1 min-h-[48px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3 px-2 text-base placeholder:text-muted-foreground/60"
            rows={1}
          />

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "shrink-0 h-11 w-11 md:h-10 md:w-10 rounded-xl transition-all touch-manipulation",
              isRecording 
                ? "text-red-500 bg-red-500/20 hover:bg-red-500/30 animate-pulse" 
                : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
            )}
            onClick={toggleRecording}
            disabled={isLoading}
          >
            {isRecording ? <MicOff className="w-5 h-5 md:w-4 md:h-4" /> : <Mic className="w-5 h-5 md:w-4 md:h-4" />}
          </Button>

          <Button
            size="icon"
            className={cn(
              "shrink-0 h-11 w-11 md:h-10 md:w-10 rounded-xl touch-manipulation transition-all",
              message.trim() || attachments.length > 0 
                ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" 
                : "bg-muted text-muted-foreground"
            )}
            onClick={handleSubmit}
            disabled={isLoading || uploading || (!message.trim() && attachments.length === 0)}
          >
            <Send className="w-5 h-5 md:w-4 md:h-4" />
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground/60 text-center mt-2">
          QurobAi can see images & generate images • Try "generate an image of..."
        </p>
      </div>
    </div>
  );
}