import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VoiceOutputProps {
  text: string;
  autoPlay?: boolean;
}

export function VoiceOutput({ text, autoPlay = false }: VoiceOutputProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.speechSynthesis) {
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanTextForSpeech = (text: string): string => {
    // Remove markdown formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
      .replace(/\*(.*?)\*/g, "$1") // Italic
      .replace(/`([^`]+)`/g, "$1") // Inline code
      .replace(/```[\s\S]*?```/g, "Code block omitted") // Code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
      .replace(/\[GeneratedImage:[^\]]+\]/g, "Image generated") // Generated images
      .replace(/\[ImageData:[^\]]+\]/g, "") // Image data
      .replace(/#{1,6}\s+/g, "") // Headers
      .replace(/\n+/g, ". ") // Newlines
      .trim();
  };

  const speak = () => {
    if (!isSupported) {
      toast.error("Voice output not supported in this browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utteranceRef.current = utterance;

    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    // Prefer an English voice
    const englishVoice = voices.find(v => v.lang.startsWith("en-") && v.name.includes("Google")) ||
                         voices.find(v => v.lang.startsWith("en-"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech error:", event);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const togglePause = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  if (!isSupported) return null;

  return (
    <div className="inline-flex items-center gap-1">
      {isSpeaking ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={togglePause}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive"
            onClick={stop}
          >
            <VolumeX className="w-3 h-3" />
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={speak}
          title="Read aloud"
        >
          <Volume2 className="w-3 h-3 mr-1" />
          Listen
        </Button>
      )}
    </div>
  );
}
