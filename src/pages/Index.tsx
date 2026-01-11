import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatMessage } from "@/components/ChatMessage";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { ChatInputEnhanced } from "@/components/ChatInputEnhanced";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SettingsDialog } from "@/components/SettingsDialog";
import ModelIndicator from "@/components/ModelIndicator";
import { SubscriptionExpiryBanner } from "@/components/SubscriptionExpiryBanner";
import { ChatHeader } from "@/components/ChatHeader";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const messageTransition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1] as const
};

const Index = () => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Check if we should show the thinking indicator
  const showThinking = isLoading && (
    messages.length === 0 || 
    messages[messages.length - 1]?.role === "user" || 
    messages[messages.length - 1]?.content === ""
  );

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
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar - Hidden on mobile by default */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50 
        transform transition-transform duration-300 ease-[0.22,1,0.36,1]
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <ChatSidebar
          currentConversationId={currentConversationId}
          onSelectConversation={(id) => {
            handleSelectConversation(id);
            setSidebarOpen(false);
          }}
          onNewChat={() => {
            handleNewChat();
            setSidebarOpen(false);
          }}
          onOpenSettings={() => {
            setSettingsOpen(true);
            setSidebarOpen(false);
          }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        {/* Mobile Header with back arrow */}
        <ChatHeader 
          onMenuToggle={() => setSidebarOpen(true)}
          showBackButton={false}
          title={messages.length > 0 ? "Chat" : "QurobAi"}
        />
        
        <SubscriptionExpiryBanner />
        <div className="p-3 md:p-4 border-b border-border max-w-3xl w-full mx-auto">
          <ModelIndicator currentModel={currentModel} />
        </div>
        
        <div className="flex-1 max-w-3xl w-full mx-auto px-3 md:px-4 py-4 md:py-6 flex flex-col overflow-hidden">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 overflow-y-auto"
            >
              <WelcomeScreen onQuickAction={handleQuickAction} />
            </motion.div>
          ) : (
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-4 md:space-y-6 pb-4 scroll-smooth"
            >
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={messageTransition}
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
              
              {/* ChatGPT-style Thinking Indicator */}
              <AnimatePresence>
                {showThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ThinkingIndicator isThinking={showThinking} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Input area */}
          <div className="mt-auto pt-3 md:pt-4 safe-area-bottom">
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