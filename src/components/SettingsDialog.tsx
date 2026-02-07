import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Mail, 
  Calendar, 
  Shield, 
  CreditCard, 
  History, 
  ChevronRight,
  Crown,
  LogOut,
  Sliders,
  Download,
  FileText,
  Scale,
  Lock,
  MessageCircle,
  HardDrive,
  Palette,
  Search,
  Mic,
  Key,
  Sun,
  Moon,
  Monitor,
  User,
  Volume2,
  Languages,
  Keyboard,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonalizationDialog } from "./PersonalizationDialog";
import { SupportChatbot } from "./SupportChatbot";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
    const { error } = await supabase
      .from("user_settings")
      .update({ [key]: value })
      .eq("user_id", user.id);
    if (!error) {
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success("Setting updated!");
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, created_at")
      .eq("user_id", user.id)
      .single();
    if (!error && data) setProfile(data);
  };

  const checkAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (!conversations?.length) {
        toast.error("No conversations to export");
        return;
      }

      const allData: any[] = [];
      for (const conv of conversations) {
        const { data: messages } = await supabase
          .from("messages")
          .select("role, content, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });
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
      console.error("Export error:", error);
      toast.error("Failed to export conversations");
    }
  };

  const handleDownloadAllData = async () => {
    if (!user) return;
    setDownloadingData(true);
    try {
      const [conversationsRes, messagesRes, settingsRes, profileRes, memoriesRes] = await Promise.all([
        supabase.from("conversations").select("*").eq("user_id", user.id),
        supabase.from("messages").select("*, conversations!inner(user_id)").eq("conversations.user_id", user.id),
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
        messages: messagesRes.data || [],
        memories: memoriesRes.data || [],
      };

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qurobai-data-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("All data exported successfully!");
    } catch (error) {
      console.error("Data export error:", error);
      toast.error("Failed to export data");
    } finally {
      setDownloadingData(false);
    }
  };

  const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode; icon: any }) => (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mt-4 mb-2">
      <Icon className="w-3.5 h-3.5" />
      {children}
    </div>
  );

  const SettingRow = ({ 
    icon: Icon, 
    label, 
    description, 
    action,
    highlight,
    badge
  }: { 
    icon: any; 
    label: string; 
    description?: string; 
    action: React.ReactNode;
    highlight?: boolean;
    badge?: string;
  }) => (
    <div className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
      highlight ? "bg-primary/5 border border-primary/10" : "bg-secondary/50 hover:bg-secondary"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          highlight ? "bg-primary/10" : "bg-muted"
        }`}>
          <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div>
          <div className="text-sm font-medium flex items-center gap-2">
            {label}
            {badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{badge}</Badge>}
          </div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
      </div>
      {action}
    </div>
  );

  const MenuItem = ({ 
    icon: Icon, 
    label, 
    description, 
    onClick, 
    highlight,
    badge
  }: { 
    icon: any; 
    label: string; 
    description?: string; 
    onClick: () => void;
    highlight?: boolean;
    badge?: string;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors touch-manipulation ${
        highlight 
          ? "bg-primary/5 border border-primary/10 hover:bg-primary/10" 
          : "bg-secondary/50 hover:bg-secondary"
      }`}
      style={{ minHeight: '52px' }}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        highlight ? "bg-primary/10" : "bg-muted"
      }`}>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-70px)]">
          <div className="p-5 space-y-1">
            {/* User Profile Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg">
                  {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {profile?.display_name || "User"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                </div>
                <Badge variant={subscription ? "default" : "secondary"} className="shrink-0">
                  {subscription ? "Premium" : "Free"}
                </Badge>
              </div>
              {profile?.created_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {formatDate(profile.created_at)}
                </div>
              )}
            </div>

            {/* Subscription */}
            <SectionTitle icon={Crown}>Subscription</SectionTitle>
            <div className={`p-4 rounded-xl border ${
              subscription ? "bg-primary/5 border-primary/20" : "bg-secondary/50 border-border"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {subscription ? subscription.subscription_plans?.name : "Free Plan"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {subscription ? `Expires ${formatDate(subscription.expires_at)}` : "Using Qurob 2 model"}
                  </div>
                </div>
                {subscription ? (
                  <Button size="sm" variant="outline" onClick={() => handleNavigate("/subscription-history")}>
                    Manage
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleNavigate("/subscribe")} className="gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Upgrade
                  </Button>
                )}
              </div>
            </div>

            {/* Appearance */}
            <SectionTitle icon={Palette}>Appearance</SectionTitle>
            <SettingRow
              icon={settings.theme_preference === "dark" ? Moon : settings.theme_preference === "light" ? Sun : Monitor}
              label="Theme"
              description="Choose your preferred theme"
              action={
              <select 
                  value={settings.theme_preference}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateSetting("theme_preference", val);
                    // Apply theme immediately
                    if (val === "light") {
                      document.documentElement.classList.remove("dark");
                    } else if (val === "dark") {
                      document.documentElement.classList.add("dark");
                    } else {
                      // System preference
                      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                      document.documentElement.classList.toggle("dark", prefersDark);
                    }
                  }}
                  className="h-8 px-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              }
            />

            {/* AI Preferences */}
            <SectionTitle icon={Sparkles}>AI Preferences</SectionTitle>
            <MenuItem 
              icon={Sliders} 
              label="Personalization" 
              description="Customize AI tone & instructions"
              onClick={() => setPersonalizationOpen(true)}
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
            <SettingRow
              icon={Languages}
              label="Language"
              description="AI response language"
              action={
                <select 
                  value={settings.language_preference}
                  onChange={(e) => updateSetting("language_preference", e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-background text-sm max-w-[140px]"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文 (Chinese)</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="pt">Português</option>
                  <option value="ar">العربية</option>
                  <option value="ru">Русский</option>
                  <option value="it">Italiano</option>
                  <option value="nl">Nederlands</option>
                  <option value="tr">Türkçe</option>
                  <option value="pl">Polski</option>
                  <option value="vi">Tiếng Việt</option>
                  <option value="th">ไทย</option>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="ms">Bahasa Melayu</option>
                  <option value="tl">Filipino</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="ml">മലയാളം (Malayalam)</option>
                  <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="ur">اردو (Urdu)</option>
                  <option value="fa">فارسی (Persian)</option>
                  <option value="he">עברית (Hebrew)</option>
                  <option value="el">Ελληνικά</option>
                  <option value="sv">Svenska</option>
                  <option value="no">Norsk</option>
                  <option value="da">Dansk</option>
                  <option value="fi">Suomi</option>
                  <option value="cs">Čeština</option>
                  <option value="hu">Magyar</option>
                  <option value="ro">Română</option>
                  <option value="uk">Українська</option>
                </select>
              }
            />

            {/* Developer Tools */}
            <SectionTitle icon={Key}>Developer & Features</SectionTitle>
            <MenuItem 
              icon={Key} 
              label="API Access" 
              description="Integrate QurobAi via API"
              onClick={() => handleNavigate("/api-access")}
            />
            <MenuItem 
              icon={Search} 
              label="Chat Search" 
              description="Search through your conversations"
              onClick={() => {
                onOpenChange(false);
                toast.success("Use the search bar in the sidebar!");
              }}
            />
            <MenuItem 
              icon={Mic} 
              label="Voice Mode" 
              description="Talk to AI with voice"
              onClick={() => {
                onOpenChange(false);
                toast.success("Voice input available in chat! Click the mic button.");
              }}
            />
            <MenuItem 
              icon={Keyboard} 
              label="Keyboard Shortcuts" 
              description="⌘K for commands, ⌘N for new chat"
              onClick={() => toast.info("⌘K: Commands, ⌘N: New Chat, ⌘/: Sidebar")}
            />

            {/* Data & Privacy */}
            <SectionTitle icon={HardDrive}>Data & Privacy</SectionTitle>
            <MenuItem 
              icon={Download} 
              label="Export Conversations" 
              description="Download chat history as JSON"
              onClick={handleExportConversations}
            />
            <MenuItem 
              icon={HardDrive} 
              label="Download All Data" 
              description={downloadingData ? "Downloading..." : "Export all your QurobAi data"}
              onClick={handleDownloadAllData}
            />
            <MenuItem 
              icon={History} 
              label="Subscription History" 
              description="View past payments"
              onClick={() => handleNavigate("/subscription-history")}
            />

            {/* Support */}
            <SectionTitle icon={MessageCircle}>Support</SectionTitle>
            <MenuItem 
              icon={MessageCircle} 
              label="Support Chat" 
              description="Get help from support"
              onClick={() => setSupportOpen(true)}
            />

            {/* Admin */}
            {isAdmin && (
              <>
                <SectionTitle icon={Shield}>Admin</SectionTitle>
                <MenuItem 
                  icon={Shield} 
                  label="Admin Panel" 
                  description="Manage users, payments, settings"
                  onClick={() => handleNavigate("/admin")}
                  highlight
                />
              </>
            )}

            {/* Legal */}
            <SectionTitle icon={FileText}>Legal</SectionTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => handleNavigate("/privacy")}>
                <FileText className="w-3.5 h-3.5 mr-1" />
                Privacy
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => handleNavigate("/terms")}>
                <Scale className="w-3.5 h-3.5 mr-1" />
                Terms
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => handleNavigate("/security")}>
                <Lock className="w-3.5 h-3.5 mr-1" />
                Security
              </Button>
            </div>

            {/* About */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">QurobAi</span>
                <Badge variant="outline" className="text-[10px]">v3.0</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                India's AI companion by Soham 🇮🇳 • Coding, Writing, Brainstorming & more!
              </p>
            </div>

            <Separator className="my-4" />

            {/* Sign Out */}
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:bg-destructive/10" 
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </ScrollArea>

        <PersonalizationDialog open={personalizationOpen} onOpenChange={setPersonalizationOpen} />
        <SupportChatbot open={supportOpen} onOpenChange={setSupportOpen} />
      </DialogContent>
    </Dialog>
  );
};
