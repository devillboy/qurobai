import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, 
  LogOut, Sparkles, Settings, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export const ChatSidebar = ({
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onOpenSettings,
}: ChatSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchConversations();
      checkAdmin();
    }
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
    } else {
      setConversations(data || []);
    }
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    } else {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        onNewChat();
      }
      toast({
        title: "Deleted",
        description: "Conversation deleted successfully",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.2 }}
      className="h-full bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                QurobAi
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-9 w-9 rounded-xl hover:bg-secondary"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-2">
        <Button
          onClick={onNewChat}
          className={`w-full justify-start gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl ${
            collapsed ? "px-3" : ""
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group relative flex items-center rounded-xl transition-all duration-200 ${
              currentConversationId === conv.id
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-secondary/50"
            }`}
          >
            <button
              onClick={() => onSelectConversation(conv.id)}
              className={`flex-1 flex items-center gap-3 py-3 text-left ${
                collapsed ? "justify-center px-3" : "px-3"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
              {!collapsed && (
                <span className="truncate text-sm">{conv.title}</span>
              )}
            </button>

            {!collapsed && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      this conversation and all its messages.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteConversation(conv.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 space-y-1">
        <Button
          variant="ghost"
          onClick={() => navigate("/subscribe")}
          className={`w-full justify-start gap-2 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 ${
            collapsed ? "px-3" : ""
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0 text-primary" />
          {!collapsed && <span className="text-primary font-semibold">Upgrade</span>}
        </Button>

        {isAdmin && (
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className={`w-full justify-start gap-2 rounded-xl ${
              collapsed ? "px-3" : ""
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Admin Panel</span>}
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={onOpenSettings}
          className={`w-full justify-start gap-2 rounded-xl ${
            collapsed ? "px-3" : ""
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Button>
        
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={`w-full justify-start gap-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
            collapsed ? "px-3" : ""
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </motion.aside>
  );
};
