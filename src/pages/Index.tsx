import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { ChatInputEnhanced } from "@/components/ChatInputEnhanced";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SettingsDialog } from "@/components/SettingsDialog";
import ModelIndicator from "@/components/ModelIndicator";
import { SubscriptionExpiryBanner } from "@/components/SubscriptionExpiryBanner";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { messages, isLoading, sendMessage, clearMessages, currentModel } = useChat(currentConversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Smooth auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleNewChat = async () => {
    if (!user) return;

    // Create new conversation
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New Chat" })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return;
    }

    setCurrentConversationId(data.id);
    clearMessages();
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const handleSendMessage = async (message: string) => {
    if (!user) return;

    let convId = currentConversationId;

    // Create conversation if none exists
    if (!convId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: "New Chat" })
        .select()
        .single();

      if (error) {
        console.error("Error creating conversation:", error);
        return;
      }

      convId = data.id;
      setCurrentConversationId(convId);
    }

    sendMessage(message, convId);
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <ChatSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <SubscriptionExpiryBanner />
        <div className="p-4 border-b max-w-3xl w-full mx-auto">
          <ModelIndicator currentModel={currentModel} />
        </div>
        
        <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <WelcomeScreen onQuickAction={handleQuickAction} />
            </motion.div>
          ) : (
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-6 pb-4 scroll-smooth"
            >
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <ChatMessage
                      role={message.role}
                      content={message.content}
                      isStreaming={
                        isLoading &&
                        message.role === "assistant" &&
                        message.id === messages[messages.length - 1]?.id
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <TypingIndicator />
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Input area */}
          <div className="mt-auto pt-4">
            <ChatInputEnhanced onSend={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </main>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;