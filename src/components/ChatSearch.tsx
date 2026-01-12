import { useState, useEffect } from "react";
import { Search, X, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  conversation_id: string;
  conversation_title: string;
  message_content: string;
  message_role: string;
  created_at: string;
}

interface ChatSearchProps {
  onSelectConversation: (id: string) => void;
  onClose: () => void;
}

export const ChatSearch = ({ onSelectConversation, onClose }: ChatSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchMessages();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const searchMessages = async () => {
    if (!user || !query.trim()) return;
    setLoading(true);

    try {
      // Search in messages
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          role,
          created_at,
          conversation_id,
          conversations!inner(title, user_id)
        `)
        .eq("conversations.user_id", user.id)
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedResults: SearchResult[] = (messages || []).map((m: any) => ({
        conversation_id: m.conversation_id,
        conversation_title: m.conversations?.title || "Untitled",
        message_content: m.content,
        message_role: m.role,
        created_at: m.created_at,
      }));

      setResults(formattedResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    const start = content.toLowerCase().indexOf(query.toLowerCase());
    if (start === -1) return content.slice(0, maxLength) + "...";
    
    const contextStart = Math.max(0, start - 50);
    const contextEnd = Math.min(content.length, start + query.length + 100);
    let result = content.slice(contextStart, contextEnd);
    
    if (contextStart > 0) result = "..." + result;
    if (contextEnd < content.length) result = result + "...";
    
    return result;
  };

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in all conversations..."
              className="pl-10 pr-10"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {results.length === 0 && query.trim().length >= 2 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            No results found for "{query}"
          </div>
        )}

        {results.length === 0 && query.trim().length < 2 && (
          <div className="text-center py-8 text-muted-foreground">
            Type at least 2 characters to search
          </div>
        )}

        <div className="space-y-2">
          {results.map((result, index) => (
            <button
              key={`${result.conversation_id}-${index}`}
              onClick={() => {
                onSelectConversation(result.conversation_id);
                onClose();
              }}
              className="w-full text-left p-3 rounded-lg bg-card hover:bg-muted transition-colors border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm truncate">
                  {result.conversation_title}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                <span className="text-xs px-1 py-0.5 rounded bg-muted mr-1">
                  {result.message_role === "user" ? "You" : "AI"}
                </span>
                {highlightMatch(truncateContent(result.message_content))}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};