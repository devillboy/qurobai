import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  ArrowLeft, Check, X, Plus, Trash2, Users, CreditCard, Bell, Shield, Activity, 
  Gift, RefreshCw, Search, Mail, Send, AlertCircle, Loader2, Bot, UserX, Download, 
  Key, Server, Database, MessageSquare, Eye, EyeOff, BarChart3, Settings, 
  LayoutDashboard, Megaphone, Ticket, Wrench, ChevronLeft, ChevronRight,
  TrendingUp, Clock, FileText, Crown, Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserData {
  id: string;
  user_id: string;
  display_name: string | null;
  qurob_id: string | null;
  created_at: string;
  subscription?: { plan_name: string; expires_at: string; status: string } | null;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "users", label: "Users", icon: Users },
  { id: "gift", label: "Gift Sub", icon: Gift },
  { id: "push", label: "Push Notify", icon: Bell },
  { id: "announcements", label: "Announce", icon: Megaphone },
  { id: "email", label: "Email", icon: Mail },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "bots", label: "Bots", icon: Bot },
  { id: "apikeys", label: "API Keys", icon: Key },
  { id: "system", label: "System", icon: Server },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "fraud", label: "Fraud", icon: AlertCircle },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: "", discount_percent: "", max_uses: "", valid_until: "" });
  const [users, setUsers] = useState<UserData[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", message: "", type: "info" });
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [maintenanceId, setMaintenanceId] = useState<string | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceDuration, setMaintenanceDuration] = useState("3.5");
  const [maintenanceEndsAt, setMaintenanceEndsAt] = useState<string | null>(null);
  const [giftUserSearch, setGiftUserSearch] = useState("");
  const [selectedGiftUser, setSelectedGiftUser] = useState<UserData | null>(null);
  const [giftPlan, setGiftPlan] = useState("");
  const [giftDays, setGiftDays] = useState("30");
  const [plans, setPlans] = useState<any[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushTarget, setPushTarget] = useState("all");
  const [sendingPush, setSendingPush] = useState(false);
  const [pushStats, setPushStats] = useState({ subscribed: 0, sent: 0 });
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteByIdInput, setDeleteByIdInput] = useState("");
  const [deleteByIdLoading, setDeleteByIdLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{ weeklyUsers: number[]; weeklyRevenue: number[] }>({ weeklyUsers: [], weeklyRevenue: [] });
  const [allBots, setAllBots] = useState<any[]>([]);
  const [allApiKeys, setAllApiKeys] = useState<any[]>([]);
  const [fraudData, setFraudData] = useState<{ rejectedPayments: any[]; duplicateAttempts: any[]; recentActivity: any[] }>({ rejectedPayments: [], duplicateAttempts: [], recentActivity: [] });
  const [fraudLoading, setFraudLoading] = useState(false);
  const [systemStats, setSystemStats] = useState({ totalBots: 0, totalApiKeys: 0, totalTemplates: 0, storageUsed: "N/A" });
  const [stats, setStats] = useState({ totalUsers: 0, activeSubscriptions: 0, pendingPayments: 0, totalRevenue: 0, todayRevenue: 0, monthlyRevenue: 0, totalConversations: 0, totalMessages: 0 });

  // Quick user lookup
  const [quickLookupId, setQuickLookupId] = useState("");
  const [quickLookupResult, setQuickLookupResult] = useState<any>(null);
  const [quickLookupLoading, setQuickLookupLoading] = useState(false);

  // Subscription management
  const [revokeSubUserId, setRevokeSubUserId] = useState("");
  const [revokeSubLoading, setRevokeSubLoading] = useState(false);

  useEffect(() => { checkAdminAccess(); }, [user]);

  const checkAdminAccess = async () => {
    if (!user) { navigate("/auth"); return; }
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (error || !data) { toast.error("Access denied. Admin only."); navigate("/"); return; }
    setIsAdmin(true);
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadPendingPayments(), loadCoupons(), loadStats(), loadUsers(), loadAnnouncements(),
      loadMaintenanceStatus(), loadPlans(), loadPushStats(), loadAnalytics(), loadBots(),
      loadApiKeys(), loadSystemStats(),
    ]);
    setLoading(false);
  };

  const loadBots = async () => { const { data } = await supabase.from("qurob_bots").select("*").order("created_at", { ascending: false }); if (data) setAllBots(data); };
  const loadApiKeys = async () => { const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false }); if (data) setAllApiKeys(data); };

  const loadSystemStats = async () => {
    const [botsRes, keysRes, templatesRes] = await Promise.all([
      supabase.from("qurob_bots").select("id", { count: "exact", head: true }),
      supabase.from("api_keys").select("id", { count: "exact", head: true }),
      supabase.from("chat_templates").select("id", { count: "exact", head: true }),
    ]);
    setSystemStats({ totalBots: botsRes.count || 0, totalApiKeys: keysRes.count || 0, totalTemplates: templatesRes.count || 0, storageUsed: "N/A" });
  };

  const loadAnalytics = async () => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: recentProfiles } = await supabase.from("profiles").select("created_at").gte("created_at", weekAgo.toISOString());
    const { data: recentPayments } = await supabase.from("payment_screenshots").select("created_at, amount_paid").eq("status", "approved").gte("created_at", weekAgo.toISOString());
    const usersByDay = new Array(7).fill(0); const revenueByDay = new Array(7).fill(0);
    recentProfiles?.forEach(p => { const d = 6 - Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000); if (d >= 0 && d < 7) usersByDay[d]++; });
    recentPayments?.forEach(p => { const d = 6 - Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000); if (d >= 0 && d < 7) revenueByDay[d] += p.amount_paid; });
    setAnalyticsData({ weeklyUsers: usersByDay, weeklyRevenue: revenueByDay });
  };

  const loadPushStats = async () => { const { count } = await supabase.from("push_subscriptions").select("id", { count: "exact", head: true }); setPushStats(prev => ({ ...prev, subscribed: count || 0 })); };

  const handleSendPush = async () => {
    if (!pushTitle || !pushMessage) { toast.error("Title and message required"); return; }
    setSendingPush(true);
    try { await supabase.functions.invoke("send-push", { body: { action: "send", title: pushTitle, message: pushMessage } }); toast.success("Push sent!"); setPushTitle(""); setPushMessage(""); setPushStats(prev => ({ ...prev, sent: prev.sent + 1 })); }
    catch { toast.error("Failed to send push"); } finally { setSendingPush(false); }
  };

  const handleAIVerifyPayment = async (paymentId: string) => {
    setVerifyingPayment(paymentId);
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", { body: { paymentId } });
      if (error) throw error;
      if (data?.action === "approved") toast.success("Payment auto-approved by AI!");
      else if (data?.action === "rejected") toast.error("Payment rejected by AI");
      else toast.info("Manual review required");
      loadData();
    } catch { toast.error("AI verification failed"); } finally { setVerifyingPayment(null); }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      const { data: convs } = await supabase.from("conversations").select("id").eq("user_id", userToDelete.user_id);
      if (convs?.length) await supabase.from("messages").delete().in("conversation_id", convs.map(c => c.id));
      for (const t of ["conversations", "user_settings", "user_subscriptions", "user_memory", "api_keys", "projects", "profiles"] as const) {
        await supabase.from(t).delete().eq("user_id", userToDelete.user_id);
      }
      toast.success("User data deleted"); setUserToDelete(null); loadUsers();
    } catch { toast.error("Failed to delete user"); } finally { setDeletingUser(false); }
  };

  const loadPlans = async () => { const { data } = await supabase.from("subscription_plans").select("*").order("price_inr"); if (data) setPlans(data); };

  const loadPendingPayments = async () => {
    const { data: payments } = await supabase.from("payment_screenshots").select(`*, subscription_plans(name, model_name, price_inr)`).eq("status", "pending").order("created_at", { ascending: false });
    if (payments?.length) {
      const userIds = payments.map(p => p.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, qurob_id").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const withUrls = await Promise.all(payments.map(async (payment) => {
        let signedUrl = payment.screenshot_url;
        if (payment.screenshot_url?.includes("/payment-screenshots/")) {
          const path = payment.screenshot_url.split("/payment-screenshots/")[1];
          if (path) { const { data: s } = await supabase.storage.from("payment-screenshots").createSignedUrl(path, 600); if (s?.signedUrl) signedUrl = s.signedUrl; }
        }
        const prof = profileMap.get(payment.user_id);
        return { ...payment, display_name: prof?.display_name || "Unknown", qurob_id: prof?.qurob_id || null, signed_screenshot_url: signedUrl };
      }));
      setPendingPayments(withUrls);
    } else setPendingPayments([]);
  };

  const loadCoupons = async () => { const { data } = await supabase.from("coupon_codes").select("*").order("created_at", { ascending: false }); if (data) setCoupons(data); };

  const loadFraudData = async () => {
    setFraudLoading(true);
    try {
      const { data: rejected } = await supabase.from("payment_screenshots").select("*, subscription_plans(name)").eq("status", "rejected").order("created_at", { ascending: false }).limit(50);
      const { data: allPayments } = await supabase.from("payment_screenshots").select("id, utr_number, user_id, status, amount_paid, admin_notes, created_at").not("utr_number", "is", null).order("created_at", { ascending: false }).limit(200);
      const utrMap = new Map<string, any[]>();
      (allPayments || []).forEach(p => { if (p.utr_number) { const e = utrMap.get(p.utr_number) || []; e.push(p); utrMap.set(p.utr_number, e); } });
      const duplicates = Array.from(utrMap.entries()).filter(([, p]) => p.length > 1).map(([utr, p]) => ({ utr, payments: p, count: p.length }));
      const { data: suspicious } = await supabase.from("payment_screenshots").select("id, user_id, status, admin_notes, amount_paid, utr_number, created_at").or("status.eq.rejected,admin_notes.ilike.%FRAUD%,admin_notes.ilike.%Duplicate%,admin_notes.ilike.%Invalid UTR%").order("created_at", { ascending: false }).limit(30);
      setFraudData({ rejectedPayments: rejected || [], duplicateAttempts: duplicates, recentActivity: suspicious || [] });
    } catch { } setFraudLoading(false);
  };

  const loadUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!profiles) return;
    const { data: subs } = await supabase.from("user_subscriptions").select("*, subscription_plans(name)").eq("status", "active");
    const subMap = new Map(subs?.map(s => [s.user_id, { plan_name: s.subscription_plans?.name || "Unknown", expires_at: s.expires_at, status: s.status }]) || []);
    setUsers(profiles.map(p => ({ id: p.id, user_id: p.user_id, display_name: p.display_name, qurob_id: (p as any).qurob_id || null, created_at: p.created_at, subscription: subMap.get(p.user_id) || null })));
  };

  const loadAnnouncements = async () => { const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }); if (data) setAnnouncements(data); };

  const loadMaintenanceStatus = async () => {
    const { data } = await supabase.from("maintenance_mode").select("*").limit(1).maybeSingle();
    if (data) { setMaintenanceMode(data.is_enabled); setMaintenanceMessage(data.message || ""); setMaintenanceId(data.id); setMaintenanceEndsAt((data as any).ends_at || null); }
    else { const { data: n } = await supabase.from("maintenance_mode").insert({ is_enabled: false, message: "QurobAi is under maintenance." }).select().single(); if (n) { setMaintenanceId(n.id); setMaintenanceMessage(n.message || ""); } }
  };

  const loadStats = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [usersRes, subsRes, paymentsRes, revenueRes, todayRes, monthRes, convsRes, msgsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("user_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("payment_screenshots").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("payment_screenshots").select("amount_paid").eq("status", "approved"),
      supabase.from("payment_screenshots").select("amount_paid").eq("status", "approved").gte("created_at", today.toISOString()),
      supabase.from("payment_screenshots").select("amount_paid").eq("status", "approved").gte("created_at", firstOfMonth.toISOString()),
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
    ]);
    setStats({
      totalUsers: usersRes.count || 0, activeSubscriptions: subsRes.count || 0, pendingPayments: paymentsRes.count || 0,
      totalRevenue: revenueRes.data?.reduce((s, p) => s + p.amount_paid, 0) || 0,
      todayRevenue: todayRes.data?.reduce((s, p) => s + p.amount_paid, 0) || 0,
      monthlyRevenue: monthRes.data?.reduce((s, p) => s + p.amount_paid, 0) || 0,
      totalConversations: convsRes.count || 0, totalMessages: msgsRes.count || 0,
    });
  };

  const handleDeleteUserById = async () => {
    if (!deleteByIdInput.trim()) { toast.error("Enter a user ID or Qurob ID"); return; }
    setDeleteByIdLoading(true);
    try {
      let userId = deleteByIdInput.trim();
      if (userId.toUpperCase().startsWith("QRB-")) {
        const { data: p } = await supabase.from("profiles").select("user_id").eq("qurob_id", userId.toUpperCase()).single();
        if (!p) { toast.error("No user found"); setDeleteByIdLoading(false); return; }
        userId = p.user_id;
      }
      const { data: convs } = await supabase.from("conversations").select("id").eq("user_id", userId);
      if (convs?.length) await supabase.from("messages").delete().in("conversation_id", convs.map(c => c.id));
      for (const t of ["conversations", "user_settings", "user_subscriptions", "user_memory", "api_keys", "projects", "push_subscriptions", "notifications", "profiles", "user_roles"] as const) {
        await supabase.from(t).delete().eq("user_id", userId);
      }
      toast.success("User deleted!"); setDeleteByIdInput(""); loadData();
    } catch { toast.error("Failed to delete"); } finally { setDeleteByIdLoading(false); }
  };

  const handleApprovePayment = async (payment: any) => {
    await supabase.from("payment_screenshots").update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", payment.id);
    const exp = new Date(); exp.setDate(exp.getDate() + 30);
    await supabase.from("user_subscriptions").insert({ user_id: payment.user_id, plan_id: payment.plan_id, status: "active", expires_at: exp.toISOString() });
    toast.success("Payment approved!"); loadData();
  };

  const handleRejectPayment = async (paymentId: string) => {
    await supabase.from("payment_screenshots").update({ status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", paymentId);
    toast.success("Payment rejected"); loadData();
  };

  const handleCreateCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount_percent) { toast.error("Code and discount required"); return; }
    await supabase.from("coupon_codes").insert({ code: newCoupon.code.toUpperCase(), discount_percent: parseInt(newCoupon.discount_percent), max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null, valid_until: newCoupon.valid_until || null, created_by: user?.id });
    toast.success("Coupon created!"); setNewCoupon({ code: "", discount_percent: "", max_uses: "", valid_until: "" }); loadCoupons();
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) { toast.error("Title and message required"); return; }
    await supabase.from("announcements").insert({ title: newAnnouncement.title, message: newAnnouncement.message, type: newAnnouncement.type, created_by: user?.id });
    toast.success("Announcement created!"); setNewAnnouncement({ title: "", message: "", type: "info" }); loadAnnouncements();
  };

  const handleToggleMaintenance = async () => {
    if (!maintenanceId) { await loadMaintenanceStatus(); return; }
    setMaintenanceLoading(true);
    const ns = !maintenanceMode;
    const endsAt = ns ? new Date(Date.now() + parseFloat(maintenanceDuration) * 3600000).toISOString() : null;
    await supabase.from("maintenance_mode").update({ is_enabled: ns, message: maintenanceMessage || "QurobAi is under maintenance.", enabled_by: ns ? user?.id : null, enabled_at: ns ? new Date().toISOString() : null, ends_at: endsAt } as any).eq("id", maintenanceId);
    setMaintenanceMode(ns); setMaintenanceEndsAt(endsAt); setMaintenanceLoading(false);
    toast.success(ns ? `Maintenance ON for ${maintenanceDuration}h` : "Maintenance OFF");
  };

  const handleGiftSubscription = async () => {
    if (!selectedGiftUser || !giftPlan) { toast.error("Select user and plan"); return; }
    const plan = plans.find(p => p.id === giftPlan);
    const exp = new Date(); exp.setDate(exp.getDate() + parseInt(giftDays));
    await supabase.from("user_subscriptions").insert({ user_id: selectedGiftUser.user_id, plan_id: giftPlan, status: "active", expires_at: exp.toISOString() });
    await supabase.from("notifications").insert({ user_id: selectedGiftUser.user_id, title: "🎁 Subscription Gifted!", message: `You've been gifted ${plan?.name} for ${giftDays} days!`, type: "success" });
    toast.success(`Gifted!`); setSelectedGiftUser(null); setGiftUserSearch(""); setGiftPlan(""); setGiftDays("30"); loadData();
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage) { toast.error("Subject and message required"); return; }
    setSendingEmail(true);
    try { await supabase.functions.invoke("send-email", { body: { type: "announcement", subject: emailSubject, message: emailMessage } }); toast.success("Email sent!"); setEmailSubject(""); setEmailMessage(""); }
    catch { toast.error("Failed to send email"); } finally { setSendingEmail(false); }
  };

  // Quick user lookup by Qurob ID
  const handleQuickLookup = async () => {
    if (!quickLookupId.trim()) return;
    setQuickLookupLoading(true);
    try {
      let userId = quickLookupId.trim();
      if (userId.toUpperCase().startsWith("QRB-")) {
        const { data: p } = await supabase.from("profiles").select("*").eq("qurob_id", userId.toUpperCase()).single();
        if (!p) { toast.error("Not found"); setQuickLookupLoading(false); return; }
        userId = p.user_id;
      }
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      const { data: settings } = await supabase.from("user_settings").select("*").eq("user_id", userId).single();
      const { data: sub } = await supabase.from("user_subscriptions").select("*, subscription_plans(name)").eq("user_id", userId).eq("status", "active").maybeSingle();
      const { count: convCount } = await supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", userId);
      const { count: msgCount } = await supabase.from("messages").select("id", { count: "exact", head: true });
      setQuickLookupResult({ profile, settings, subscription: sub, convCount, userId });
    } catch { toast.error("Lookup failed"); } finally { setQuickLookupLoading(false); }
  };

  // Revoke subscription
  const handleRevokeSubscription = async () => {
    if (!revokeSubUserId.trim()) { toast.error("Enter user ID or Qurob ID"); return; }
    setRevokeSubLoading(true);
    try {
      let userId = revokeSubUserId.trim();
      if (userId.toUpperCase().startsWith("QRB-")) {
        const { data: p } = await supabase.from("profiles").select("user_id").eq("qurob_id", userId.toUpperCase()).single();
        if (!p) { toast.error("Not found"); setRevokeSubLoading(false); return; }
        userId = p.user_id;
      }
      await supabase.from("user_subscriptions").update({ status: "revoked" }).eq("user_id", userId).eq("status", "active");
      toast.success("Subscription revoked!"); setRevokeSubUserId(""); loadData();
    } catch { toast.error("Failed"); } finally { setRevokeSubLoading(false); }
  };

  const filteredUsers = users.filter(u => !userSearch || u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.user_id.toLowerCase().includes(userSearch.toLowerCase()) || u.qurob_id?.toLowerCase().includes(userSearch.toLowerCase()));
  const giftUserResults = users.filter(u => giftUserSearch && (u.display_name?.toLowerCase().includes(giftUserSearch.toLowerCase()) || u.user_id.toLowerCase().includes(giftUserSearch.toLowerCase()) || u.qurob_id?.toLowerCase().includes(giftUserSearch.toLowerCase()))).slice(0, 5);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
              { label: "Active Subs", value: stats.activeSubscriptions, icon: Crown, color: "text-yellow-400" },
              { label: "Pending", value: stats.pendingPayments, icon: Clock, color: "text-orange-400" },
              { label: "Today ₹", value: `₹${stats.todayRevenue}`, icon: TrendingUp, color: "text-green-400" },
              { label: "Month ₹", value: `₹${stats.monthlyRevenue}`, icon: BarChart3, color: "text-emerald-400" },
              { label: "Total ₹", value: `₹${stats.totalRevenue}`, icon: CreditCard, color: "text-primary" },
              { label: "Conversations", value: stats.totalConversations.toLocaleString(), icon: MessageSquare, color: "text-purple-400" },
              { label: "Messages", value: stats.totalMessages.toLocaleString(), icon: Database, color: "text-cyan-400" },
            ].map((s, i) => (
              <Card key={i} className="p-3 border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <div className="text-xl font-bold">{s.value}</div>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("payments")} className="justify-start">
                <CreditCard className="w-4 h-4 mr-2" />Payments ({stats.pendingPayments})
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("push")} className="justify-start">
                <Bell className="w-4 h-4 mr-2" />Send Push
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("gift")} className="justify-start">
                <Gift className="w-4 h-4 mr-2" />Gift Sub
              </Button>
              <Button variant={maintenanceMode ? "destructive" : "outline"} size="sm" onClick={handleToggleMaintenance} disabled={maintenanceLoading} className="justify-start">
                <Wrench className="w-4 h-4 mr-2" />{maintenanceMode ? "Maintenance ON" : "Maintenance OFF"}
              </Button>
            </CardContent>
          </Card>

          {/* Quick User Lookup */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4" />Quick User Lookup</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input placeholder="Enter Qurob ID (QRB-XXXXXX) or UUID..." value={quickLookupId} onChange={e => setQuickLookupId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleQuickLookup()} className="font-mono text-sm" />
                <Button onClick={handleQuickLookup} disabled={quickLookupLoading} size="sm">
                  {quickLookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {quickLookupResult && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{quickLookupResult.profile?.display_name || "Unnamed"}</span>
                    <Badge variant="outline" className="font-mono">{quickLookupResult.profile?.qurob_id}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{quickLookupResult.userId}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Plan: <span className="font-medium">{quickLookupResult.subscription?.subscription_plans?.name || "Free"}</span></div>
                    <div>Conversations: <span className="font-medium">{quickLookupResult.convCount || 0}</span></div>
                    <div>Model: <span className="font-medium">{quickLookupResult.settings?.preferred_model || "Default"}</span></div>
                    <div>Joined: <span className="font-medium">{new Date(quickLookupResult.profile?.created_at).toLocaleDateString()}</span></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => { setGiftUserSearch(quickLookupResult.profile?.qurob_id || ""); setActiveTab("gift"); }}>
                      <Gift className="w-3 h-3 mr-1" />Gift
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setDeleteByIdInput(quickLookupResult.profile?.qurob_id || quickLookupResult.userId); setActiveTab("users"); }}>
                      <UserX className="w-3 h-3 mr-1" />Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Recent Pending Payments</CardTitle></CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? <p className="text-sm text-muted-foreground">No pending payments</p> : (
                <div className="space-y-2">
                  {pendingPayments.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div><div className="font-medium text-sm">{p.display_name} {p.qurob_id && <span className="text-xs text-primary">({p.qurob_id})</span>}</div><div className="text-xs text-muted-foreground">₹{p.amount_paid} • {p.subscription_plans?.name}</div></div>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab("payments")}>Review</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );

      case "payments": return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5" />Pending Payments ({pendingPayments.length})</h2>
          {pendingPayments.length === 0 ? <Card className="p-8 text-center text-muted-foreground">No pending payments</Card> : (
            <div className="grid md:grid-cols-2 gap-4">
              {pendingPayments.map(payment => (
                <Card key={payment.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{payment.display_name}</div>
                        <div className="text-xs text-muted-foreground">{payment.qurob_id && <span className="text-primary mr-1">{payment.qurob_id}</span>}{payment.subscription_plans?.name} • ₹{payment.amount_paid}</div>
                        <div className="text-xs text-muted-foreground">{new Date(payment.created_at).toLocaleString()}{payment.coupon_code && ` • Coupon: ${payment.coupon_code}`}</div>
                        {payment.utr_number && <div className="text-xs font-mono mt-1">UTR: {payment.utr_number}</div>}
                      </div>
                      <Badge>Pending</Badge>
                    </div>
                    {(payment.signed_screenshot_url || payment.screenshot_url) && (
                      <a href={payment.signed_screenshot_url || payment.screenshot_url} target="_blank" rel="noopener noreferrer">
                        <img src={payment.signed_screenshot_url || payment.screenshot_url} alt="Screenshot" className="w-full h-32 object-cover rounded border border-border" />
                      </a>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleAIVerifyPayment(payment.id)} disabled={verifyingPayment === payment.id}>
                        {verifyingPayment === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4 mr-1" />}AI
                      </Button>
                      <Button size="sm" onClick={() => handleApprovePayment(payment)}><Check className="w-4 h-4 mr-1" />Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectPayment(payment.id)}><X className="w-4 h-4 mr-1" />Reject</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      );

      case "users": return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5" />Users ({users.length})</h2>
          
          {/* Delete + Revoke */}
          <div className="grid md:grid-cols-2 gap-3">
            <Card className="border-destructive/30 p-4 space-y-2">
              <div className="font-medium text-sm flex items-center gap-2 text-destructive"><UserX className="w-4 h-4" />Delete User</div>
              <div className="flex gap-2">
                <Input placeholder="Qurob ID or UUID..." value={deleteByIdInput} onChange={e => setDeleteByIdInput(e.target.value)} className="font-mono text-sm" />
                <Button variant="destructive" size="sm" onClick={handleDeleteUserById} disabled={deleteByIdLoading}>{deleteByIdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</Button>
              </div>
            </Card>
            <Card className="border-orange-500/30 p-4 space-y-2">
              <div className="font-medium text-sm flex items-center gap-2 text-orange-500"><X className="w-4 h-4" />Revoke Subscription</div>
              <div className="flex gap-2">
                <Input placeholder="Qurob ID or UUID..." value={revokeSubUserId} onChange={e => setRevokeSubUserId(e.target.value)} className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={handleRevokeSubscription} disabled={revokeSubLoading} className="text-orange-500 border-orange-500/50">{revokeSubLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Revoke"}</Button>
              </div>
            </Card>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, ID, Qurob ID..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="text-xs text-muted-foreground">Showing {Math.min(filteredUsers.length, 50)} of {filteredUsers.length}</div>
          <div className="space-y-1.5">
            {filteredUsers.slice(0, 50).map(u => (
              <Card key={u.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{u.display_name || "Unnamed"}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">{u.qurob_id && <span className="text-primary mr-2">{u.qurob_id}</span>}{u.user_id}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {u.subscription ? <Badge className="text-[10px] px-1.5">{u.subscription.plan_name}</Badge> : <Badge variant="outline" className="text-[10px] px-1.5">Free</Badge>}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                      const [c, s, p, m] = await Promise.all([
                        supabase.from("conversations").select("*").eq("user_id", u.user_id),
                        supabase.from("user_settings").select("*").eq("user_id", u.user_id),
                        supabase.from("profiles").select("*").eq("user_id", u.user_id),
                        supabase.from("user_memory").select("*").eq("user_id", u.user_id),
                      ]);
                      const blob = new Blob([JSON.stringify({ user_id: u.user_id, display_name: u.display_name, profile: p.data?.[0], settings: s.data?.[0], conversations: c.data, memories: m.data }, null, 2)], { type: "application/json" });
                      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `user-${u.qurob_id || u.user_id.slice(0, 8)}.json`; a.click();
                    }}><Download className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setUserToDelete(u)}><UserX className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );

      case "gift": return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Gift className="w-5 h-5" />Gift Subscription</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-xs">Search User</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={giftUserSearch} onChange={e => { setGiftUserSearch(e.target.value); setSelectedGiftUser(null); }} placeholder="Name, ID, or Qurob ID..." className="pl-9" />
                </div>
                {giftUserResults.length > 0 && !selectedGiftUser && (
                  <div className="mt-2 border rounded-lg overflow-hidden">{giftUserResults.map(u => (
                    <button key={u.id} onClick={() => { setSelectedGiftUser(u); setGiftUserSearch(u.display_name || u.user_id); }} className="w-full p-2.5 text-left hover:bg-muted flex items-center justify-between text-sm">
                      <div><div className="font-medium">{u.display_name || "Unnamed"}</div><div className="text-xs text-muted-foreground font-mono">{u.qurob_id && <span className="text-primary mr-1">{u.qurob_id}</span>}</div></div>
                      {u.subscription && <Badge variant="outline" className="text-[10px]">{u.subscription.plan_name}</Badge>}
                    </button>
                  ))}</div>
                )}
                {selectedGiftUser && <div className="mt-2 p-2.5 bg-primary/10 border border-primary/20 rounded-lg text-sm"><span className="font-medium">{selectedGiftUser.display_name}</span> <span className="text-xs text-muted-foreground font-mono ml-2">{selectedGiftUser.qurob_id}</span></div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Plan</Label>
                  <Select value={giftPlan} onValueChange={setGiftPlan}>
                    <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent>{plans.filter(p => p.price_inr > 0).map(p => <SelectItem key={p.id} value={p.id}>{p.name} (₹{p.price_inr})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Days</Label>
                  <Input type="number" value={giftDays} onChange={e => setGiftDays(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleGiftSubscription} disabled={!selectedGiftUser || !giftPlan} className="w-full"><Gift className="w-4 h-4 mr-2" />Gift Subscription</Button>
            </CardContent>
          </Card>
        </div>
      );

      case "push": return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Bell className="w-5 h-5" />Push Notifications</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Select value={pushTarget} onValueChange={setPushTarget}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem><SelectItem value="premium">Premium Only</SelectItem></SelectContent></Select>
                <Input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder="Title" />
                <Textarea value={pushMessage} onChange={e => setPushMessage(e.target.value)} placeholder="Message" rows={3} />
                {(pushTitle || pushMessage) && <div className="p-2 bg-muted rounded text-sm"><div className="font-medium text-xs">{pushTitle || "Title"}</div><div className="text-xs text-muted-foreground">{pushMessage || "Message..."}</div></div>}
                <Button onClick={handleSendPush} disabled={sendingPush} className="w-full">{sendingPush ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}Send</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-muted rounded-lg text-center"><div className="text-2xl font-bold text-primary">{pushStats.subscribed}</div><div className="text-xs text-muted-foreground">Subscribed</div></div>
                  <div className="p-4 bg-muted rounded-lg text-center"><div className="text-2xl font-bold text-green-500">{pushStats.sent}</div><div className="text-xs text-muted-foreground">Sent</div></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );

      case "announcements": return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Megaphone className="w-5 h-5" />Announcements</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <Input value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} placeholder="Title" />
              <Textarea value={newAnnouncement.message} onChange={e => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })} placeholder="Message" rows={3} />
              <div className="flex gap-2">
                <Select value={newAnnouncement.type} onValueChange={v => setNewAnnouncement({ ...newAnnouncement, type: v })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="info">Info</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="success">Success</SelectItem></SelectContent></Select>
                <Button onClick={handleCreateAnnouncement} className="flex-1"><Plus className="w-4 h-4 mr-2" />Create</Button>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {announcements.map(a => (
              <Card key={a.id} className="p-3 flex items-center justify-between">
                <div><div className="font-medium text-sm">{a.title}</div><div className="text-xs text-muted-foreground">{a.message}</div></div>
                <div className="flex items-center gap-2"><Badge variant={a.is_active ? "default" : "secondary"} className="text-[10px]">{a.type}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => { await supabase.from("announcements").delete().eq("id", a.id); loadAnnouncements(); }}><Trash2 className="w-3.5 h-3.5" /></Button></div>
              </Card>
            ))}
          </div>
        </div>
      );

      case "email": return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Mail className="w-5 h-5" />Email All Users</h2>
          <Alert><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">Requires Resend configured with your domain.</AlertDescription></Alert>
          <Card>
            <CardContent className="p-4 space-y-3">
              <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject" />
              <Textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} placeholder="Message (HTML supported)" rows={6} />
              <Button onClick={handleSendEmail} disabled={sendingEmail} className="w-full">{sendingEmail ? "Sending..." : <><Send className="w-4 h-4 mr-2" />Send Email</>}</Button>
            </CardContent>
          </Card>
        </div>
      );

      case "coupons": return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Ticket className="w-5 h-5" />Coupons</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} placeholder="CODE" />
                <Input type="number" value={newCoupon.discount_percent} onChange={e => setNewCoupon({ ...newCoupon, discount_percent: e.target.value })} placeholder="Discount %" />
                <Input type="number" value={newCoupon.max_uses} onChange={e => setNewCoupon({ ...newCoupon, max_uses: e.target.value })} placeholder="Max uses" />
                <Input type="date" value={newCoupon.valid_until} onChange={e => setNewCoupon({ ...newCoupon, valid_until: e.target.value })} />
              </div>
              <Button onClick={handleCreateCoupon}><Plus className="w-4 h-4 mr-2" />Create</Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {coupons.map(c => (
              <Card key={c.id} className="p-3 flex items-center justify-between">
                <div><div className="font-mono font-bold text-sm">{c.code}</div><div className="text-xs text-muted-foreground">{c.discount_percent}% off • {c.current_uses}/{c.max_uses || "∞"}</div></div>
                <div className="flex items-center gap-2"><Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px]">{c.is_active ? "Active" : "Inactive"}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => { await supabase.from("coupon_codes").delete().eq("id", c.id); loadCoupons(); }}><Trash2 className="w-3.5 h-3.5" /></Button></div>
              </Card>
            ))}
          </div>
        </div>
      );

      case "bots": return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Bot className="w-5 h-5" />Qurobs ({allBots.length})</h2>
          <div className="space-y-2">
            {allBots.map(bot => (
              <Card key={bot.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${bot.icon_color}20`, color: bot.icon_color }}>🤖</div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate flex items-center gap-1">{bot.name}{bot.is_official && <Badge className="text-[8px] px-1">Official</Badge>}{bot.is_public && <Badge variant="outline" className="text-[8px] px-1">Public</Badge>}</div>
                      <div className="text-xs text-muted-foreground truncate">{bot.description?.slice(0, 60) || "No description"} • {bot.uses_count || 0} uses</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => { await supabase.from("qurob_bots").update({ is_official: !bot.is_official }).eq("id", bot.id); loadBots(); }}><Shield className={`w-3.5 h-3.5 ${bot.is_official ? "text-primary" : "text-muted-foreground"}`} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { await supabase.from("qurob_bots").delete().eq("id", bot.id); loadBots(); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );

      case "apikeys": return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Key className="w-5 h-5" />API Keys ({allApiKeys.length})</h2>
          <div className="space-y-2">
            {allApiKeys.map(key => (
              <Card key={key.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1">{key.name || "Unnamed"}<Badge variant={key.is_active ? "default" : "secondary"} className="text-[8px]">{key.is_active ? "Active" : "Off"}</Badge>{key.is_trial && <Badge variant="outline" className="text-[8px]">Trial</Badge>}</div>
                    <div className="text-xs text-muted-foreground font-mono">{key.key_preview}</div>
                    <div className="text-[10px] text-muted-foreground">Today: {key.requests_today || 0} • Month: {key.requests_month || 0} • Total: {key.total_requests || 0}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => { await supabase.from("api_keys").update({ is_active: !key.is_active }).eq("id", key.id); loadApiKeys(); }}>{key.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );

      case "system": return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Server className="w-5 h-5" />System</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Bots", value: systemStats.totalBots, icon: Bot },
              { label: "API Keys", value: systemStats.totalApiKeys, icon: Key },
              { label: "Templates", value: systemStats.totalTemplates, icon: FileText },
              { label: "Messages", value: stats.totalMessages.toLocaleString(), icon: MessageSquare },
            ].map((s, i) => (
              <Card key={i} className="p-3"><div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><s.icon className="w-3 h-3" />{s.label}</div><div className="text-xl font-bold">{s.value}</div></Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Weekly Analytics</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {[{ title: "New Users", data: analyticsData.weeklyUsers, color: "bg-primary/60" }, { title: "Revenue (₹)", data: analyticsData.weeklyRevenue, color: "bg-green-500/60" }].map((chart, ci) => (
                  <div key={ci}>
                    <h4 className="text-sm font-medium mb-2">{chart.title}</h4>
                    <div className="flex items-end gap-1 h-24">
                      {chart.data.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`w-full ${chart.color} rounded-t`} style={{ height: `${Math.max(4, (v / Math.max(...chart.data, 1)) * 100)}%` }} />
                          <span className="text-[9px] text-muted-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">System Health</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {["AI Gateway", "Database", "Storage"].map(s => (
                  <div key={s} className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-xs font-medium">{s}</span></div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Operational</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );

      case "maintenance": return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Wrench className="w-5 h-5" />Maintenance</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div><div className="font-medium text-sm">Maintenance Mode</div><div className="text-xs text-muted-foreground">{maintenanceMode ? "Users see maintenance page" : "App is accessible"}</div></div>
                <Switch checked={maintenanceMode} onCheckedChange={handleToggleMaintenance} disabled={maintenanceLoading} />
              </div>

              {maintenanceMode && maintenanceEndsAt && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="text-xs font-medium text-destructive flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Scheduled End</div>
                  <div className="text-sm font-mono mt-1 text-foreground">{new Date(maintenanceEndsAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</div>
                </div>
              )}

              <div>
                <Label className="text-xs">Duration (hours)</Label>
                <Select value={maintenanceDuration} onValueChange={setMaintenanceDuration}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">30 min</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="3">3 hours</SelectItem>
                    <SelectItem value="3.5">3.5 hours</SelectItem>
                    <SelectItem value="5">5 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Message</Label>
                <Textarea value={maintenanceMessage} onChange={e => setMaintenanceMessage(e.target.value)} rows={3} />
                <Button variant="outline" size="sm" className="mt-2" onClick={async () => { if (maintenanceId) { await supabase.from("maintenance_mode").update({ message: maintenanceMessage }).eq("id", maintenanceId); toast.success("Saved"); } }}>Save Message</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );

      case "fraud": return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-destructive"><AlertCircle className="w-5 h-5" />Fraud Detection</h2>
            <Button onClick={loadFraudData} disabled={fraudLoading} variant="outline" size="sm"><RefreshCw className={`w-4 h-4 mr-1 ${fraudLoading ? "animate-spin" : ""}`} />Refresh</Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-destructive/30 p-3"><div className="text-xs text-muted-foreground">Rejected</div><div className="text-xl font-bold text-destructive">{fraudData.rejectedPayments.length}</div></Card>
            <Card className="border-orange-500/30 p-3"><div className="text-xs text-muted-foreground">Duplicate UTR</div><div className="text-xl font-bold text-orange-500">{fraudData.duplicateAttempts.length}</div></Card>
            <Card className="border-yellow-500/30 p-3"><div className="text-xs text-muted-foreground">Suspicious</div><div className="text-xl font-bold text-yellow-500">{fraudData.recentActivity.length}</div></Card>
          </div>
          {fraudData.duplicateAttempts.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive">🚨 Duplicate UTR</CardTitle></CardHeader>
              <CardContent><ScrollArea className="h-[200px]"><div className="space-y-2">{fraudData.duplicateAttempts.map((d: any, i: number) => (
                <div key={i} className="p-2 bg-destructive/10 rounded border border-destructive/20"><div className="flex justify-between"><code className="text-xs font-mono text-destructive">{d.utr}</code><Badge variant="destructive" className="text-[10px]">{d.count}x</Badge></div>
                {d.payments.map((p: any) => <div key={p.id} className="text-[10px] text-muted-foreground">User: {p.user_id.slice(0, 8)}... | ₹{p.amount_paid}</div>)}</div>
              ))}</div></ScrollArea></CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Rejected Payments</CardTitle></CardHeader>
            <CardContent><ScrollArea className="h-[300px]"><div className="space-y-2">
              {fraudData.rejectedPayments.length === 0 ? <p className="text-center text-muted-foreground text-sm py-4">Click Refresh to load</p> :
              fraudData.rejectedPayments.map((p: any) => (
                <div key={p.id} className="p-2 border rounded text-sm"><div className="flex justify-between"><span>₹{p.amount_paid} — {p.subscription_plans?.name}</span><Badge variant="destructive" className="text-[10px]">Rejected</Badge></div>{p.utr_number && <div className="text-xs font-mono mt-1">UTR: {p.utr_number}</div>}{p.admin_notes && <div className="text-xs text-muted-foreground mt-1 bg-muted p-1.5 rounded">{p.admin_notes}</div>}</div>
              ))}
            </div></ScrollArea></CardContent>
          </Card>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Delete Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete User Data?</AlertDialogTitle><AlertDialogDescription>Permanently delete all data for {userToDelete?.display_name || "this user"}. Cannot be undone.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground" disabled={deletingUser}>{deletingUser ? "Deleting..." : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? "w-14" : "w-52"} shrink-0 border-r border-border bg-card/50 flex flex-col transition-all duration-200 sticky top-0 h-screen`}>
        <div className="p-3 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed && <h2 className="font-bold text-sm">Admin</h2>}
          <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-0.5 px-2">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); if (item.id === "fraud") loadFraudData(); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                  activeTab === item.id 
                    ? "bg-primary/15 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${item.id === "fraud" ? "text-destructive" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? "text-primary" : ""} ${item.id === "fraud" ? "text-destructive" : ""}`} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {!sidebarCollapsed && item.id === "payments" && stats.pendingPayments > 0 && (
                  <Badge variant="destructive" className="ml-auto text-[10px] px-1 h-4">{stats.pendingPayments}</Badge>
                )}
              </button>
            ))}
          </nav>
        </ScrollArea>
        <div className="p-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className={`w-full ${sidebarCollapsed ? "px-0 justify-center" : "justify-start"}`}>
            <ArrowLeft className="w-4 h-4" />{!sidebarCollapsed && <span className="ml-2">Back to Chat</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="border-b border-border bg-card/30 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">{NAV_ITEMS.find(n => n.id === activeTab)?.label || "Admin"}</h1>
            {maintenanceMode && <Badge variant="destructive" className="text-[10px]">Maintenance ON</Badge>}
          </div>
          <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
        </div>
        <div className="p-4 md:p-6 max-w-5xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
