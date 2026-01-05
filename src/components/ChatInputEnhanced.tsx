import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, MicOff, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { user } = useAuth();

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
          setMessage(prev => prev + transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          if (event.error === "not-allowed") {
            toast.error("Microphone access denied");
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
      toast.error("Speech recognition not supported");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      toast.success("Listening...");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large (max 10MB)");
        continue;
      }

      try {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            
            const fileName = `${user.id}/${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
              .from("chat-attachments")
              .upload(fileName, file);

            if (error) throw error;

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
          };
          reader.readAsDataURL(file);
        } else {
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from("chat-attachments")
            .upload(fileName, file);

          if (error) throw error;

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
        toast.error("Failed to upload file");
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

    const imageAttachments = attachments.filter(a => a.type.startsWith("image/") && a.base64);
    if (imageAttachments.length > 0) {
      const imageData = imageAttachments.map(a => `[ImageData:${a.base64}]`).join("");
      finalMessage = finalMessage + "\n" + imageData;
    }

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [message]);

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-3xl mx-auto">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {attachments.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-16 w-16 object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="h-16 px-3 flex items-center bg-secondary rounded-lg border border-border">
                    <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {isRecording && (
          <div className="flex items-center gap-2 mb-3 text-sm text-foreground">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Listening...
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-secondary rounded-xl border border-border p-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </Button>

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message QurobAi..."
            disabled={isLoading}
            className="flex-1 min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2 px-1"
            rows={1}
          />

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "shrink-0 h-9 w-9",
              isRecording ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={toggleRecording}
            disabled={isLoading}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          <Button
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={handleSubmit}
            disabled={isLoading || (!message.trim() && attachments.length === 0)}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          QurobAi may make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
