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
  latencyMs?: number;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages, userId, model, conversationId, memoryEnabled, onDelta, onDone, onError, signal,
}: {
  messages: Array<{ role: string; content: string }>;
  userId?: string; model?: string; conversationId?: string; memoryEnabled?: boolean;
  onDelta: (deltaText: string) => void; onDone: () => void; onError: (error: Error) => void; signal?: AbortSignal;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ messages, userId, model, conversationId, memoryEnabled }), signal,
    });
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed with status ${resp.status}`;
      if (resp.status === 429) throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      if (resp.status === 402) throw new Error("Usage limit reached. Please add credits to your account.");
      if (resp.status === 403) throw new Error(errorData.error || "This model requires a premium subscription.");
      throw new Error(errorMessage);
    }
    if (!resp.body) throw new Error("No response body");
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
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { textBuffer = line + "\n" + textBuffer; break; }
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
    if (error instanceof DOMException && error.name === "AbortError") { onDone(); return; }
    onError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

export const useChat = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>("Qurob 3.2");
  const [selectedModel, setSelectedModel] = useState<string>("Qurob 3.2");
  const [memoryEnabled, setMemoryEnabled] = useState<boolean | undefined>(undefined);
  const { user } = useAuth();
  
  const messagesRef = useRef<Message[]>([]);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const selectedModelRef = useRef(selectedModel);
  const memoryEnabledRef = useRef<boolean | undefined>(undefined);
  
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);
  useEffect(() => { memoryEnabledRef.current = memoryEnabled; }, [memoryEnabled]);
  useEffect(() => { if (user) loadUserModel(); }, [user]);

  const loadUserModel = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.rpc("get_user_model", { user_id: user.id });
    if (data) {
      const model = data === "Qurob 2" ? "Qurob 3.2" : data;
      setCurrentModel(model);
      if (selectedModelRef.current === "Qurob 3.2" || selectedModelRef.current === "Qurob 2") {
        setSelectedModel(model);
      }
    }
  }, [user]);

  useEffect(() => {
    if (conversationId && user) { loadMessages(conversationId); loadConversationMemory(conversationId); }
    else { setMessages([]); setMemoryEnabled(undefined); }
  }, [conversationId, user]);

  const loadConversationMemory = useCallback(async (convId: string) => {
    const { data } = await supabase.from("conversations").select("memory_enabled").eq("id", convId).single();
    setMemoryEnabled(data?.memory_enabled ?? undefined);
  }, []);

  const toggleMemory = useCallback(async (next: boolean) => {
    setMemoryEnabled(next);
    if (conversationId) {
      await supabase.from("conversations").update({ memory_enabled: next }).eq("id", conversationId);
    }
  }, [conversationId]);

  const loadMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true });
    if (error) console.error("Error loading messages:", error);
    else {
      setMessages(data.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content, timestamp: new Date(m.created_at), isPinned: false })));
    }
  }, []);

  const saveMessage = useCallback(async (convId: string, role: "user" | "assistant", content: string) => {
    const { error } = await supabase.from("messages").insert({ conversation_id: convId, role, content });
    if (error) console.error("Error saving message:", error);
    if (role === "user") {
      const { data: conv } = await supabase.from("conversations").select("title").eq("id", convId).single();
      if (conv?.title === "New Chat") {
        let cleanContent = content.replace(/^\[Web Search\]\s*/i, "").replace(/^\[Deep Search\]\s*/i, "").replace(/^\[Qurob:.*?\]\s*/i, "").replace(/\[ImageData:.*?\]/g, "").replace(/\[Attachment:.*?\]\(.*?\)/g, "").trim();
        const title = cleanContent.slice(0, 50) + (cleanContent.length > 50 ? "..." : "");
        await supabase.from("conversations").update({ title: title || "Chat", updated_at: new Date().toISOString() }).eq("id", convId);
      } else {
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      }
    } else {
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    }
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; setIsLoading(false); }
  }, []);

  const changeModel = useCallback((model: string) => { setSelectedModel(model); }, []);

  const doStream = useCallback(async (messageHistory: Array<{ role: string; content: string }>, convId: string) => {
    const assistantMessageId = crypto.randomUUID();
    let assistantContent = "";
    let hasAddedAssistantMessage = true;
    let firstTokenLatencyMs: number | undefined;
    const streamStartedAt = performance.now();
    setIsLoading(true);
    setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "", timestamp: new Date() }]);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let pendingUpdate = false;
    let lastUpdateTime = 0;
    const MIN_UPDATE_INTERVAL = 50;

    // Short, snappy delay so first token arrives in ~2s window total
    // (real AI response time is 2–5s; no artificial wait needed)

    await streamChat({
      messages: messageHistory, userId: user?.id, model: selectedModelRef.current, conversationId: convId, memoryEnabled: memoryEnabledRef.current, signal: abortController.signal,
      onDelta: (delta) => {
        assistantContent += delta;
        if (firstTokenLatencyMs === undefined) firstTokenLatencyMs = Math.max(1, Math.round(performance.now() - streamStartedAt));
        const now = Date.now();
        if (!pendingUpdate && (now - lastUpdateTime) >= MIN_UPDATE_INTERVAL) {
          pendingUpdate = true; lastUpdateTime = now;
          requestAnimationFrame(() => {
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.id === assistantMessageId) return prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: assistantContent, latencyMs: firstTokenLatencyMs } : msg);
              else if (!hasAddedAssistantMessage) { hasAddedAssistantMessage = true; return [...prev, { id: assistantMessageId, role: "assistant" as const, content: assistantContent, timestamp: new Date(), latencyMs: firstTokenLatencyMs }]; }
              return prev;
            });
            pendingUpdate = false;
          });
        }
      },
      onDone: async () => {
        const finalLatency = firstTokenLatencyMs ?? Math.max(1, Math.round(performance.now() - streamStartedAt));
        setMessages((prev) => {
          if (!assistantContent.trim()) return prev.filter((msg) => msg.id !== assistantMessageId);
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.id === assistantMessageId) return prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: assistantContent, latencyMs: finalLatency } : msg);
          else if (!hasAddedAssistantMessage && assistantContent) return [...prev, { id: assistantMessageId, role: "assistant" as const, content: assistantContent, timestamp: new Date(), latencyMs: finalLatency }];
          return prev;
        });
        setIsLoading(false); abortControllerRef.current = null;
        if (assistantContent) await saveMessage(convId, "assistant", assistantContent);
        loadUserModel();
      },
      onError: (error) => {
        console.error("Chat error:", error); setIsLoading(false); abortControllerRef.current = null;
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  }, [user, saveMessage, loadUserModel]);

  const sendMessage = useCallback(async (content: string, convId: string) => {
    if (!content.trim() || isLoadingRef.current || !user || !convId) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(convId, "user", content);
    const currentMessages = messagesRef.current;
    const recentMessages = [...currentMessages, userMessage].slice(-20);
    const messageHistory = recentMessages.map((m) => ({ role: m.role, content: m.content }));
    await doStream(messageHistory, convId);
  }, [user, saveMessage, doStream]);

  const editMessage = useCallback(async (messageId: string, newContent: string, convId: string) => {
    if (!newContent.trim() || isLoadingRef.current || !user || !convId) return;
    const currentMessages = messagesRef.current;
    const editIndex = currentMessages.findIndex(m => m.id === messageId);
    if (editIndex === -1) return;

    // Update message in DB
    await supabase.from("messages").update({ content: newContent }).eq("id", messageId);

    // Delete all messages after the edited one from DB
    const messagesAfter = currentMessages.slice(editIndex + 1);
    for (const msg of messagesAfter) {
      await supabase.from("messages").delete().eq("id", msg.id);
    }

    // Truncate local messages and update edited one
    const truncated = currentMessages.slice(0, editIndex + 1).map(m => m.id === messageId ? { ...m, content: newContent } : m);
    setMessages(truncated);

    // Re-send to AI
    const messageHistory = truncated.slice(-20).map(m => ({ role: m.role, content: m.content }));
    await doStream(messageHistory, convId);
  }, [user, doStream]);

  const regenerateLastMessage = useCallback(async (convId: string) => {
    const currentMessages = messagesRef.current;
    if (currentMessages.length < 2 || isLoadingRef.current) return;
    const lastUserMsgIndex = currentMessages.map(m => m.role).lastIndexOf("user");
    if (lastUserMsgIndex === -1) return;
    setMessages(prev => prev.slice(0, -1));
    const messageHistory = currentMessages.slice(0, lastUserMsgIndex + 1).map((m) => ({ role: m.role, content: m.content }));
    await doStream(messageHistory, convId);
  }, [doStream]);

  const togglePinMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg));
  }, []);

  const clearMessages = useCallback(() => { setMessages([]); }, []);

  return useMemo(() => ({
    messages, isLoading, sendMessage, clearMessages, currentModel, selectedModel, changeModel, regenerateLastMessage, togglePinMessage, stopGeneration, editMessage, memoryEnabled, toggleMemory,
  }), [messages, isLoading, sendMessage, clearMessages, currentModel, selectedModel, changeModel, regenerateLastMessage, togglePinMessage, stopGeneration, editMessage, memoryEnabled, toggleMemory]);
};
