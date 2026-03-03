import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, Mail, Calendar, Shield, CreditCard, History, ChevronRight, Crown, LogOut,
  Sliders, Download, FileText, Scale, Lock, MessageCircle, HardDrive, Palette, Search,
  Mic, Key, Sun, Moon, Monitor, User, Volume2, Languages, Keyboard, Bot, Settings2, Database, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonalizationDialog } from "./PersonalizationDialog";
import { SupportChatbot } from "./SupportChatbot";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name: string | null; created_at: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [downloadingData, setDownloadingData] = useState(false);
  const [settings, setSettings] = useState({
    voice_output_enabled: false,
    theme_preference: "dark",
    language_preference: "en",
  });

  useEffect(() => {
    if (user && open) {
      fetchProfile();
      checkAdminStatus();
      fetchSubscription();
      fetchSettings();
    }
  }, [user, open]);

  const fetchSettings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_settings")
      .select("voice_output_enabled, theme_preference, language_preference")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setSettings({
        voice_output_enabled: data.voice_output_enabled || false,
        theme_preference: data.theme_preference || "dark",
        language_preference: data.language_preference || "en",
      });
    }
  };

  const updateSetting = async (key: string, value: any) => {
    if (!user) return;
    const { error } = await supabase.from("user_settings").update({ [key]: value }).eq("user_id", user.id);
    if (!error) {
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success("Setting updated!");
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("profiles").select("display_name, created_at").eq("user_id", user.id).single();
    if (!error && data) setProfile(data);
  };

  const checkAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchSubscription = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_subscriptions")
      .select(`*, subscription_plans(name, model_name)`)
      .eq("user_id", user.id)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();
    setSubscription(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
    navigate("/auth");
  };

  const handleExportConversations = async () => {
    if (!user) return;
    try {
      const { data: conversations } = await supabase.from("conversations").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (!conversations?.length) { toast.error("No conversations to export"); return; }
      const allData: any[] = [];
      for (const conv of conversations) {
        const { data: messages } = await supabase.from("messages").select("role, content, created_at").eq("conversation_id", conv.id).order("created_at", { ascending: true });
        allData.push({ title: conv.title, created_at: conv.created_at, messages: messages || [] });
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qurobai-conversations-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Conversations exported!");
    } catch (error) {
      toast.error("Failed to export conversations");
    }
  };

  const handleDownloadAllData = async () => {
    if (!user) return;
    setDownloadingData(true);
    try {
      const [conversationsRes, settingsRes, profileRes, memoriesRes] = await Promise.all([
        supabase.from("conversations").select("*").eq("user_id", user.id),
        supabase.from("user_settings").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("user_memory").select("*").eq("user_id", user.id),
      ]);
      const allData = {
        exported_at: new Date().toISOString(),
        user_email: user.email,
        profile: profileRes.data?.[0] || null,
        settings: settingsRes.data?.[0] || null,
        conversations: conversationsRes.data || [],
        memories: memoriesRes.data || [],
      };
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qurobai-data-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("All data exported!");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setDownloadingData(false);
    }
  };

  const MenuItem = ({ icon: Icon, label, description, onClick, highlight, badge }: { 
    icon: any; label: string; description?: string; onClick: () => void; highlight?: boolean; badge?: string;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors touch-manipulation ${
        highlight ? "bg-primary/5 border border-primary/10 hover:bg-primary/10" : "bg-secondary/50 hover:bg-secondary"
      }`}
      style={{ minHeight: '48px' }}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${highlight ? "bg-primary/10" : "bg-muted"}`}>
        <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="text-sm font-medium flex items-center gap-2">
          <span className="truncate">{label}</span>
          {badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{badge}</Badge>}
        </div>
        {description && <div className="text-xs text-muted-foreground truncate">{description}</div>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );

  const SettingRow = ({ icon: Icon, label, description, action, highlight }: { 
    icon: any; label: string; description?: string; action: React.ReactNode; highlight?: boolean;
  }) => (
    <div className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
      highlight ? "bg-primary/5 border border-primary/10" : "bg-secondary/50"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlight ? "bg-primary/10" : "bg-muted"}`}>
          <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
      </div>
      {action}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <div className="px-5">
            <TabsList className="w-full h-9 bg-muted/50 grid grid-cols-5 gap-0.5">
              <TabsTrigger value="general" className="text-xs data-[state=active]:bg-background px-1">General</TabsTrigger>
              <TabsTrigger value="ai" className="text-xs data-[state=active]:bg-background px-1">AI</TabsTrigger>
              <TabsTrigger value="features" className="text-xs data-[state=active]:bg-background px-1">Features</TabsTrigger>
              <TabsTrigger value="data" className="text-xs data-[state=active]:bg-background px-1">Data</TabsTrigger>
              <TabsTrigger value="about" className="text-xs data-[state=active]:bg-background px-1">About</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="max-h-[calc(90vh-130px)]">
            {/* ===== GENERAL TAB ===== */}
            <TabsContent value="general" className="p-5 pt-3 space-y-3 mt-0">
              {/* Profile Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-lg font-bold shrink-0 shadow-lg">
                    {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{profile?.display_name || "User"}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                  </div>
                  <Badge variant={subscription ? "default" : "secondary"} className="shrink-0 text-xs">
                    {subscription ? "Premium" : "Free"}
                  </Badge>
                </div>
                {profile?.created_at && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3 pt-2.5 border-t border-border/50">
                    <Calendar className="w-3 h-3" />
                    Member since {formatDate(profile.created_at)}
                  </div>
                )}
              </div>

              {/* Subscription */}
              <div className={`p-3.5 rounded-xl border ${subscription ? "bg-primary/5 border-primary/20" : "bg-secondary/50 border-border"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{subscription ? subscription.subscription_plans?.name : "Free Plan"}</div>
                    <div className="text-xs text-muted-foreground">
                      {subscription ? `Expires ${formatDate(subscription.expires_at)}` : "50 messages/day"}
                    </div>
                  </div>
                  {subscription ? (
                    <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleNavigate("/subscription-history")}>Manage</Button>
                  ) : (
                    <Button size="sm" className="text-xs h-8 gap-1" onClick={() => handleNavigate("/subscribe")}>
                      <Sparkles className="w-3 h-3" /> Upgrade
                    </Button>
                  )}
                </div>
              </div>

              {/* Theme */}
              <SettingRow
                icon={settings.theme_preference === "dark" ? Moon : settings.theme_preference === "light" ? Sun : Monitor}
                label="Theme"
                description="App appearance"
                action={
                  <select 
                    value={settings.theme_preference}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateSetting("theme_preference", val);
                      if (val === "light") document.documentElement.classList.remove("dark");
                      else if (val === "dark") document.documentElement.classList.add("dark");
                      else {
                        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                        document.documentElement.classList.toggle("dark", prefersDark);
                      }
                    }}
                    className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                }
              />

              {/* Language */}
              <SettingRow
                icon={Languages}
                label="Language"
                description="AI response language"
                action={
                  <select 
                    value={settings.language_preference}
                    onChange={(e) => updateSetting("language_preference", e.target.value)}
                    className="h-8 px-2 rounded-md border border-input bg-background text-xs max-w-[120px]"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="pt">Português</option>
                    <option value="ar">العربية</option>
                    <option value="ru">Русский</option>
                    <option value="bn">বাংলা</option>
                    <option value="ta">தமிழ்</option>
                    <option value="te">తెలుగు</option>
                    <option value="mr">मराठी</option>
                    <option value="gu">ગુજરાતી</option>
                    <option value="ur">اردو</option>
                  </select>
                }
              />
            </TabsContent>

            {/* ===== AI TAB ===== */}
            <TabsContent value="ai" className="p-5 pt-3 space-y-3 mt-0">
              <MenuItem 
                icon={Sliders} 
                label="Personalization" 
                description="Customize AI tone, persona & instructions"
                onClick={() => setPersonalizationOpen(true)}
                highlight
              />
              <SettingRow
                icon={Volume2}
                label="Voice Output"
                description="AI speaks responses aloud"
                action={
                  <Switch
                    checked={settings.voice_output_enabled}
                    onCheckedChange={(v) => updateSetting("voice_output_enabled", v)}
                  />
                }
              />
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border">
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p className="font-medium text-foreground text-sm">Current Model</p>
                  <p>{subscription ? subscription.subscription_plans?.name || "Qurob 4" : "Qurob 2 (Free)"}</p>
                  <p className="text-[11px]">
                    {subscription ? "Advanced reasoning & deep analysis" : "Fast & reliable for everyday use"}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ===== FEATURES TAB ===== */}
            <TabsContent value="features" className="p-5 pt-3 space-y-2 mt-0">
              <MenuItem icon={Bot} label="Qurobs" description="Custom AI assistants" onClick={() => handleNavigate("/qurobs")} highlight />
              <MenuItem icon={Key} label="API Access" description="Integrate via API" onClick={() => handleNavigate("/api-access")} />
              <MenuItem icon={Search} label="Chat Search" description="Search conversations" onClick={() => { onOpenChange(false); toast.success("Use the search bar in the sidebar!"); }} />
              <MenuItem icon={Mic} label="Voice Mode" description="Talk with voice input" onClick={() => { onOpenChange(false); toast.success("Click the mic button in chat!"); }} />
              <MenuItem icon={Keyboard} label="Keyboard Shortcuts" description="⌘K commands, ⌘N new chat" onClick={() => toast.info("⌘K: Commands, ⌘N: New Chat, ⌘/: Sidebar")} />
            </TabsContent>

            {/* ===== DATA TAB ===== */}
            <TabsContent value="data" className="p-5 pt-3 space-y-2 mt-0">
              <MenuItem icon={Download} label="Export Conversations" description="Download as JSON" onClick={handleExportConversations} />
              <MenuItem icon={HardDrive} label="Download All Data" description={downloadingData ? "Downloading..." : "Full data export"} onClick={handleDownloadAllData} />
              <MenuItem icon={History} label="Subscription History" description="Past payments & plans" onClick={() => handleNavigate("/subscription-history")} />

              <Separator className="my-3" />

              <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3.5 h-3.5" />
                  <span>All data is encrypted in transit (TLS). Your conversations are private and secure.</span>
                </div>
              </div>
            </TabsContent>

            {/* ===== ABOUT TAB ===== */}
            <TabsContent value="about" className="p-5 pt-3 space-y-2 mt-0">
              {/* App Info */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">QurobAi</span>
                  <Badge variant="outline" className="text-[10px]">v3.0</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  India's AI companion by Soham 🇮🇳<br/>
                  Coding, Writing, Brainstorming & more!
                </p>
              </div>

              <MenuItem icon={MessageCircle} label="Support Chat" description="Get help from support" onClick={() => setSupportOpen(true)} />
              <MenuItem icon={FileText} label="What's New" description="Latest updates & features" onClick={() => handleNavigate("/patch-updates")} />

              {isAdmin && (
                <MenuItem icon={Shield} label="Admin Panel" description="Manage users, payments" onClick={() => handleNavigate("/admin")} highlight />
              )}

              {/* Legal */}
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" className="flex-1 text-xs h-8" onClick={() => handleNavigate("/privacy")}>
                  <FileText className="w-3 h-3 mr-1" /> Privacy
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-xs h-8" onClick={() => handleNavigate("/terms")}>
                  <Scale className="w-3 h-3 mr-1" /> Terms
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-xs h-8" onClick={() => handleNavigate("/security")}>
                  <Lock className="w-3 h-3 mr-1" /> Security
                </Button>
              </div>

              <Separator className="my-2" />

              <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 h-10" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <PersonalizationDialog open={personalizationOpen} onOpenChange={setPersonalizationOpen} />
        <SupportChatbot open={supportOpen} onOpenChange={setSupportOpen} />
      </DialogContent>
    </Dialog>
  );
};
