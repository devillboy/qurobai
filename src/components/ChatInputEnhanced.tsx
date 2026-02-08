import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, MicOff, X, Loader2, Sparkles, Globe, Search } from "lucide-react";
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
  const [webSearchOn, setWebSearchOn] = useState(false);
  const [deepSearchOn, setDeepSearchOn] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.onresult = (event: any) => {
          setMessage(prev => prev + (prev ? " " : "") + event.results[0][0].transcript);
          toast.success("Voice captured!");
        };
        recognitionRef.current.onerror = (event: any) => {
          setIsRecording(false);
          if (event.error === "not-allowed") toast.error("Microphone access denied");
          else if (event.error === "no-speech") toast.info("No speech detected.");
        };
        recognitionRef.current.onend = () => setIsRecording(false);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) { toast.error("Speech recognition not supported"); return; }
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); }
    else { try { recognitionRef.current.start(); setIsRecording(true); toast.info("Listening..."); } catch (e) { toast.error("Failed to start voice input"); } }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); continue; }
      try {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            reader.onload = async (event) => {
              try {
                const base64 = event.target?.result as string;
                const fileName = `${user.id}/${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage.from("chat-attachments").upload(fileName, file);
                if (error) { toast.error(`Failed to upload ${file.name}`); resolve(); return; }
                const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(data.path);
                setAttachments(prev => [...prev, { name: file.name, type: file.type, url: urlData.publicUrl, size: file.size, base64 }]);
                resolve();
              } catch (err) { reject(err); }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
        } else {
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage.from("chat-attachments").upload(fileName, file);
          if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
          const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(data.path);
          setAttachments(prev => [...prev, { name: file.name, type: file.type, url: urlData.publicUrl, size: file.size }]);
        }
      } catch (error) { toast.error(`Failed to upload ${file.name}`); }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;

    let finalMessage = trimmedMessage;

    // Add search prefix
    if (deepSearchOn) finalMessage = `[Deep Search] ${finalMessage}`;
    else if (webSearchOn) finalMessage = `[Web Search] ${finalMessage}`;

    // Add image data for vision
    const imageAttachments = attachments.filter(a => a.type.startsWith("image/") && a.base64);
    if (imageAttachments.length > 0) {
      finalMessage = finalMessage + "\n" + imageAttachments.map(a => `[ImageData:${a.base64}]`).join("");
    }

    const otherAttachments = attachments.filter(a => !a.type.startsWith("image/"));
    if (otherAttachments.length > 0) {
      finalMessage = finalMessage + "\n" + otherAttachments.map(a => `[Attachment: ${a.name}](${a.url})`).join("\n");
    }

    onSend(finalMessage);
    setMessage("");
    setAttachments([]);
    // Keep search toggles active for convenience
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
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
    <div className="bg-background/95 backdrop-blur-sm p-2 md:p-4 safe-area-bottom">
      <div className="max-w-3xl mx-auto">
        {showTemplates && <TemplatesPicker onSelect={handleTemplateSelect} onClose={() => setShowTemplates(false)} />}

        {/* Search Toggle Buttons */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => { setWebSearchOn(!webSearchOn); if (deepSearchOn) setDeepSearchOn(false); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all touch-manipulation border",
              webSearchOn
                ? "bg-primary/15 text-primary border-primary/40"
                : "bg-secondary/50 text-muted-foreground border-border/50 hover:border-primary/30"
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            Web Search
          </button>
          <button
            onClick={() => { setDeepSearchOn(!deepSearchOn); if (webSearchOn) setWebSearchOn(false); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all touch-manipulation border",
              deepSearchOn
                ? "bg-accent/15 text-accent-foreground border-accent/40"
                : "bg-secondary/50 text-muted-foreground border-border/50 hover:border-accent/30"
            )}
          >
            <Search className="w-3.5 h-3.5" />
            Deep Search
          </button>
        </div>

        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {attachments.map((file, index) => (
              <div key={index} className="relative group animate-fade-in">
                {file.type.startsWith("image/") ? (
                  <img src={file.url} alt={file.name} className="h-12 w-12 md:h-14 md:w-14 object-cover rounded-lg border border-border" />
                ) : (
                  <div className="h-12 md:h-14 px-3 flex items-center bg-secondary rounded-lg border border-border">
                    <span className="text-xs truncate max-w-[80px]">{file.name}</span>
                  </div>
                )}
                <button onClick={() => removeAttachment(index)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ minHeight: '20px', minWidth: '20px' }}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {isRecording && (
          <div className="flex items-center gap-2 mb-2 text-sm text-foreground animate-pulse bg-red-500/10 p-2 rounded-lg">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span>Listening... Speak now</span>
          </div>
        )}

        <div className="relative flex items-end gap-1.5 md:gap-2 bg-secondary/80 backdrop-blur-sm rounded-2xl border border-border/50 p-1.5 md:p-2 shadow-lg">
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt,.doc,.docx" onChange={handleFileUpload} className="hidden" />

          <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-xl touch-manipulation" onClick={() => setShowTemplates(!showTemplates)} title="Templates">
            <Sparkles className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-xl touch-manipulation" onClick={() => fileInputRef.current?.click()} disabled={isLoading || uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </Button>

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={deepSearchOn ? "Deep search anything..." : webSearchOn ? "Search the web..." : "Message QurobAi..."}
            disabled={isLoading}
            className="flex-1 min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 px-2 text-base placeholder:text-muted-foreground/60"
            rows={1}
          />

          <Button variant="ghost" size="icon"
            className={cn("shrink-0 h-10 w-10 rounded-xl transition-all touch-manipulation", isRecording ? "text-red-500 bg-red-500/20 animate-pulse" : "text-muted-foreground hover:text-foreground hover:bg-primary/10")}
            onClick={toggleRecording} disabled={isLoading}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          <Button size="icon"
            className={cn("shrink-0 h-10 w-10 rounded-xl touch-manipulation transition-all", message.trim() || attachments.length > 0 ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground")}
            onClick={handleSubmit}
            disabled={isLoading || uploading || (!message.trim() && attachments.length === 0)}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
          QurobAi can see images, generate images, search the web & deep search
        </p>
      </div>
    </div>
  );
}
