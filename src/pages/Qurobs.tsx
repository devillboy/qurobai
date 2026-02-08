import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Sparkles, Code, BookOpen, Lightbulb, GraduationCap, Pen, Briefcase, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { QurobBotBuilder } from "@/components/QurobBotBuilder";
import { SEOHead } from "@/components/SEOHead";

interface QurobBot {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  icon_color: string;
  system_prompt: string;
  is_public: boolean;
  is_official: boolean;
  category: string;
  uses_count: number;
  user_id: string;
}

const iconMap: Record<string, any> = {
  sparkles: Sparkles, code: Code, "book-open": BookOpen, lightbulb: Lightbulb,
  "graduation-cap": GraduationCap, pen: Pen, briefcase: Briefcase,
};

export default function Qurobs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bots, setBots] = useState<QurobBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editBot, setEditBot] = useState<QurobBot | null>(null);
  const [search, setSearch] = useState("");

  const fetchBots = async () => {
    setLoading(true);
    const { data } = await supabase.from("qurob_bots").select("*").order("uses_count", { ascending: false });
    setBots((data as QurobBot[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBots(); }, []);

  const handleUseBot = (bot: QurobBot) => {
    // Store selected bot in sessionStorage and navigate to chat
    sessionStorage.setItem("active_qurob", JSON.stringify({ id: bot.id, name: bot.name, system_prompt: bot.system_prompt, icon: bot.icon, icon_color: bot.icon_color }));
    // Increment uses_count
    supabase.from("qurob_bots").update({ uses_count: bot.uses_count + 1 }).eq("id", bot.id).then(() => {});
    navigate("/chat");
  };

  const filteredBots = bots.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.description?.toLowerCase().includes(search.toLowerCase()));
  const officialBots = filteredBots.filter(b => b.is_official);
  const myBots = filteredBots.filter(b => b.user_id === user?.id);
  const allPublic = filteredBots.filter(b => b.is_public || b.user_id === user?.id);

  const BotCard = ({ bot }: { bot: QurobBot }) => {
    const IconComponent = iconMap[bot.icon] || Sparkles;
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="p-4 rounded-xl border border-border/60 bg-card hover:border-primary/40 transition-all cursor-pointer"
        onClick={() => handleUseBot(bot)}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${bot.icon_color}20` }}>
            <IconComponent className="w-5 h-5" style={{ color: bot.icon_color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{bot.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{bot.description || "Custom AI assistant"}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-muted-foreground/60">{bot.uses_count} uses</span>
              {bot.is_official && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Official</span>}
              {bot.user_id === user?.id && !bot.is_official && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent-foreground">Yours</span>}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <SEOHead title="Qurobs - Custom AI Assistants" />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">Qurobs</h1>
                <p className="text-xs text-muted-foreground">Custom AI Assistants</p>
              </div>
            </div>
            <Button size="sm" onClick={() => { setEditBot(null); setShowBuilder(true); }} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search Qurobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          <Tabs defaultValue="all">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="official">By QurobAi</TabsTrigger>
              <TabsTrigger value="mine">Your Qurobs</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : allPublic.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No Qurobs yet. Create your first one!</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">{allPublic.map(b => <BotCard key={b.id} bot={b} />)}</div>
              )}
            </TabsContent>

            <TabsContent value="official" className="mt-4">
              {officialBots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No official Qurobs yet.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">{officialBots.map(b => <BotCard key={b.id} bot={b} />)}</div>
              )}
            </TabsContent>

            <TabsContent value="mine" className="mt-4">
              {myBots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>You haven't created any Qurobs yet.</p>
                  <Button size="sm" className="mt-3" onClick={() => { setEditBot(null); setShowBuilder(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Create Your First Qurob
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">{myBots.map(b => <BotCard key={b.id} bot={b} />)}</div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Bot Builder Dialog */}
        <QurobBotBuilder
          open={showBuilder}
          onOpenChange={setShowBuilder}
          editBot={editBot}
          onSaved={() => { setShowBuilder(false); fetchBots(); }}
        />
      </div>
    </>
  );
}
