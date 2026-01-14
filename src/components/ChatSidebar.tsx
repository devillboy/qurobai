import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, 
  LogOut, Sparkles, Settings, Shield, Search, Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ProjectsSection } from "./ProjectsSection";
import { ChatSearch } from "./ChatSearch";
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
  project_id: string | null;
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
  const [showSearch, setShowSearch] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Filter conversations by project
  const filteredConversations = selectedProject
    ? conversations.filter(c => c.project_id === selectedProject)
    : conversations;

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
      .select("id, title, updated_at, project_id")
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
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="h-full bg-sidebar border-r border-sidebar-border flex flex-col shrink-0"
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
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">QurobAi</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-9 w-9 rounded-lg hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Search Button */}
      {!collapsed && (
        <div className="px-3 mb-2">
          <Button
            variant="outline"
            onClick={() => setShowSearch(true)}
            className="w-full justify-start gap-2 rounded-lg"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>Search chats...</span>
          </Button>
        </div>
      )}

      {/* New Chat Button */}
      <div className="px-3 mb-2">
        <Button
          onClick={onNewChat}
          className={`w-full justify-start gap-2 bg-primary hover:bg-primary/90 rounded-lg ${
            collapsed ? "px-3" : ""
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </Button>
      </div>

      {/* Projects Section */}
      <ProjectsSection
        collapsed={collapsed}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
      />

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {filteredConversations.map((conv) => (
          <div
            key={conv.id}
            className={`group relative flex items-center rounded-lg transition-all duration-200 ${
              currentConversationId === conv.id
                ? "bg-sidebar-accent border border-primary/20"
                : "hover:bg-sidebar-accent/50"
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
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <Button
          variant="ghost"
          onClick={() => navigate("/subscribe")}
          className={`w-full justify-start gap-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary ${
            collapsed ? "px-3" : ""
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="font-medium">Upgrade</span>}
        </Button>

        {isAdmin && (
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className={`w-full justify-start gap-2 rounded-lg ${
              collapsed ? "px-3" : ""
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Admin Panel</span>}
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={() => navigate("/api-access")}
          className={`w-full justify-start gap-2 rounded-lg ${
            collapsed ? "px-3" : ""
          }`}
        >
          <Code className="w-4 h-4 shrink-0" />
          {!collapsed && <span>API Access</span>}
        </Button>

        <Button
          variant="ghost"
          onClick={onOpenSettings}
          className={`w-full justify-start gap-2 rounded-lg ${
            collapsed ? "px-3" : ""
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Button>
        
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={`w-full justify-start gap-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
            collapsed ? "px-3" : ""
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>

      {/* Search Overlay */}
      {showSearch && (
        <ChatSearch
          onSelectConversation={onSelectConversation}
          onClose={() => setShowSearch(false)}
        />
      )}
    </motion.aside>
  );
};
