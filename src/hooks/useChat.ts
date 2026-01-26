import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isPinned?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  userId,
  onDelta,
  onDone,
  onError,
}: {
  messages: Array<{ role: string; content: string }>;
  userId?: string;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, userId }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed with status ${resp.status}`;
      
      if (resp.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      }
      if (resp.status === 402) {
        throw new Error("Usage limit reached. Please add credits to your account.");
      }
      throw new Error(errorMessage);
    }

    if (!resp.body) {
      throw new Error("No response body");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {}
      }
    }

    onDone();
  } catch (error) {
    onError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

export const useChat = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>("Qurob 2");
  const { user } = useAuth();
  
  // Refs for stable callbacks
  const messagesRef = useRef<Message[]>([]);
  const isLoadingRef = useRef(false);
  
  // Keep refs in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Load user's model on mount
  useEffect(() => {
    if (user) {
      loadUserModel();
    }
  }, [user]);

  const loadUserModel = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.rpc("get_user_model", { user_id: user.id });
    if (data) setCurrentModel(data);
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId && user) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId, user]);

  const loadMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      setMessages(
        data.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.created_at),
          isPinned: false, // TODO: add pinned column to messages table
        }))
      );
    }
  }, []);

  const saveMessage = useCallback(async (
    convId: string,
    role: "user" | "assistant",
    content: string
  ) => {
    const { error } = await supabase.from("messages").insert({
      conversation_id: convId,
      role,
      content,
    });

    if (error) {
      console.error("Error saving message:", error);
    }

    // Update conversation title if first user message
    const currentMessages = messagesRef.current;
    if (role === "user" && currentMessages.length === 0) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      await supabase
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", convId);
    } else {
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
    }
  }, []);

  const sendMessage = useCallback(async (content: string, convId: string) => {
    // Prevent duplicate calls
    if (!content.trim() || isLoadingRef.current || !user || !convId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to database
    await saveMessage(convId, "user", content);

    const assistantMessageId = crypto.randomUUID();
    let assistantContent = "";
    let hasAddedAssistantMessage = false;

    // Send more message history for better context (up to 20 messages)
    const currentMessages = messagesRef.current;
    const recentMessages = [...currentMessages, userMessage].slice(-20);
    const messageHistory = recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Throttle updates for smooth rendering
    let pendingUpdate = false;
    let lastUpdateTime = 0;
    const MIN_UPDATE_INTERVAL = 50; // ms
    
    await streamChat({
      messages: messageHistory,
      userId: user?.id,
      onDelta: (delta) => {
        assistantContent += delta;
        
        const now = Date.now();
        if (!pendingUpdate && (now - lastUpdateTime) >= MIN_UPDATE_INTERVAL) {
          pendingUpdate = true;
          lastUpdateTime = now;
          
          requestAnimationFrame(() => {
            setMessages((prev) => {
              // Check if assistant message already exists
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.id === assistantMessageId) {
                // Update existing message
                return prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                );
              } else if (!hasAddedAssistantMessage) {
                // Add new assistant message only once
                hasAddedAssistantMessage = true;
                return [
                  ...prev,
                  {
                    id: assistantMessageId,
                    role: "assistant" as const,
                    content: assistantContent,
                    timestamp: new Date(),
                  },
                ];
              }
              return prev;
            });
            pendingUpdate = false;
          });
        }
      },
      onDone: async () => {
        // Final update to ensure all content is displayed
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.id === assistantMessageId) {
            return prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent }
                : msg
            );
          } else if (!hasAddedAssistantMessage && assistantContent) {
            return [
              ...prev,
              {
                id: assistantMessageId,
                role: "assistant" as const,
                content: assistantContent,
                timestamp: new Date(),
              },
            ];
          }
          return prev;
        });
        
        setIsLoading(false);
        if (assistantContent) {
          await saveMessage(convId, "assistant", assistantContent);
        }
        loadUserModel();
      },
      onError: (error) => {
        console.error("Chat error:", error);
        setIsLoading(false);
        // Remove assistant message if it was added
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }, [user, saveMessage, loadUserModel]);

  const regenerateLastMessage = useCallback(async (convId: string) => {
    const currentMessages = messagesRef.current;
    if (currentMessages.length < 2 || isLoadingRef.current) return;
    
    // Find the last user message
    const lastUserMsgIndex = currentMessages.map(m => m.role).lastIndexOf("user");
    if (lastUserMsgIndex === -1) return;
    
    const lastUserMessage = currentMessages[lastUserMsgIndex];
    
    // Remove the last assistant message
    setMessages(prev => prev.slice(0, -1));
    
    // Regenerate
    const assistantMessageId = crypto.randomUUID();
    let assistantContent = "";
    let hasAddedAssistantMessage = false;
    
    setIsLoading(true);
    
    const messageHistory = currentMessages.slice(0, lastUserMsgIndex + 1).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    
    let pendingUpdate = false;
    let lastUpdateTime = 0;
    const MIN_UPDATE_INTERVAL = 50;
    
    await streamChat({
      messages: messageHistory,
      userId: user?.id,
      onDelta: (delta) => {
        assistantContent += delta;
        
        const now = Date.now();
        if (!pendingUpdate && (now - lastUpdateTime) >= MIN_UPDATE_INTERVAL) {
          pendingUpdate = true;
          lastUpdateTime = now;
          
          requestAnimationFrame(() => {
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.id === assistantMessageId) {
                return prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                );
              } else if (!hasAddedAssistantMessage) {
                hasAddedAssistantMessage = true;
                return [
                  ...prev,
                  {
                    id: assistantMessageId,
                    role: "assistant" as const,
                    content: assistantContent,
                    timestamp: new Date(),
                  },
                ];
              }
              return prev;
            });
            pendingUpdate = false;
          });
        }
      },
      onDone: async () => {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.id === assistantMessageId) {
            return prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent }
                : msg
            );
          } else if (!hasAddedAssistantMessage && assistantContent) {
            return [
              ...prev,
              {
                id: assistantMessageId,
                role: "assistant" as const,
                content: assistantContent,
                timestamp: new Date(),
              },
            ];
          }
          return prev;
        });
        
        setIsLoading(false);
        if (assistantContent) {
          await saveMessage(convId, "assistant", assistantContent);
        }
      },
      onError: (error) => {
        console.error("Regenerate error:", error);
        setIsLoading(false);
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }, [user, saveMessage]);

  const togglePinMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
    ));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    currentModel,
    regenerateLastMessage,
    togglePinMessage,
  }), [messages, isLoading, sendMessage, clearMessages, currentModel, regenerateLastMessage, togglePinMessage]);
};
