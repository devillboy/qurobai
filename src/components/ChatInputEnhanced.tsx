import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Loader2, 
  Paperclip, 
  Image, 
  FileText, 
  X,
  Mic,
  Code,
  Smile
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Attachment {
  id: string;
  file: File;
  type: "image" | "document" | "code";
  preview?: string;
}

interface ChatInputEnhancedProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInputEnhanced = ({ onSend, isLoading, disabled }: ChatInputEnhancedProps) => {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading && !disabled) {
      onSend(input.trim(), attachments);
      setInput("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "document") => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    
    Array.from(files).forEach((file) => {
      const attachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type,
      };

      if (type === "image" && file.type.startsWith("image/")) {
        attachment.preview = URL.createObjectURL(file);
      }

      newAttachments.push(attachment);
    });

    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "code":
        return <Code className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onSubmit={handleSubmit}
      className="relative"
    >
      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex flex-wrap gap-2"
          >
            {attachments.map((attachment) => (
              <motion.div
                key={attachment.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
              >
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-16 w-16 object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg border border-border bg-muted flex flex-col items-center justify-center p-1">
                    {getFileIcon(attachment.type)}
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center mt-1">
                      {attachment.file.name.slice(0, 8)}...
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input */}
      <div className="glass-strong rounded-2xl p-1 transition-shadow duration-300 focus-within:shadow-[0_0_60px_hsl(262_83%_58%_/_0.15)]">
        <div className="flex items-end gap-2 p-2">
          {/* Attachment Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 flex-shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                <Image className="w-4 h-4 mr-2" />
                Upload Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <FileText className="w-4 h-4 mr-2" />
                Upload Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Code className="w-4 h-4 mr-2" />
                Upload Code File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e, "image")}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,.js,.ts,.py,.json,.csv,.xml,.html,.css"
            multiple
            onChange={(e) => handleFileSelect(e, "document")}
            className="hidden"
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message QurobAi..."
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              "flex-1 bg-transparent border-none outline-none resize-none",
              "text-foreground placeholder:text-muted-foreground/50",
              "text-sm leading-relaxed max-h-[200px] py-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              disabled
            >
              <Smile className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              disabled
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || isLoading || disabled}
              size="icon"
              className={cn(
                "h-9 w-9 flex-shrink-0 rounded-xl",
                (input.trim() || attachments.length > 0) && !isLoading && !disabled
                  ? "bg-primary text-primary-foreground"
                  : ""
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground/50 mt-3">
        QurobAi • Created by Soham from India • Press Enter to send
      </p>
    </motion.form>
  );
};