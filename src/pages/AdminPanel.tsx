import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Plus, Trash2, Users, CreditCard, Bell, Shield, Activity, Gift, RefreshCw, Search, Mail, Send, AlertCircle, Loader2, Bot, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserData {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  subscription?: {
    plan_name: string;
    expires_at: string;
    status: string;
  } | null;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Payment screenshots state
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  
  // Coupon state
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_percent: "",
    max_uses: "",
    valid_until: "",
  });

  // Users state
  const [users, setUsers] = useState<UserData[]>([]);
  const [userSearch, setUserSearch] = useState("");
  
  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    type: "info",
  });
  
  // Maintenance state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [maintenanceId, setMaintenanceId] = useState<string | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  
  // Gift subscription state
  const [giftUserSearch, setGiftUserSearch] = useState("");
  const [selectedGiftUser, setSelectedGiftUser] = useState<UserData | null>(null);
  const [giftPlan, setGiftPlan] = useState("");
  const [giftDays, setGiftDays] = useState("30");
  const [plans, setPlans] = useState<any[]>([]);

  // Email state
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Push notification state
  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushTarget, setPushTarget] = useState("all");
  const [sendingPush, setSendingPush] = useState(false);
  const [pushStats, setPushStats] = useState({ subscribed: 0, sent: 0 });

  // AI Verification state
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);

  // User delete state
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !data) {
      toast.error("Access denied. Admin only.");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadPendingPayments(),
      loadCoupons(),
      loadStats(),
      loadUsers(),
      loadAnnouncements(),
      loadMaintenanceStatus(),
      loadPlans(),
      loadPushStats(),
    ]);
    setLoading(false);
  };

  const loadPushStats = async () => {
    const { count } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true });
    setPushStats(prev => ({ ...prev, subscribed: count || 0 }));
  };

  const handleSendPush = async () => {
    if (!pushTitle || !pushMessage) {
      toast.error("Title and message are required");
      return;
    }
    setSendingPush(true);
    try {
      const { error } = await supabase.functions.invoke("send-push", {
        body: { action: "send", title: pushTitle, message: pushMessage },
      });
      if (error) throw error;
      toast.success("Push notification sent!");
      setPushTitle("");
      setPushMessage("");
      setPushStats(prev => ({ ...prev, sent: prev.sent + 1 }));
    } catch (e) {
      toast.error("Failed to send push notification");
    } finally {
      setSendingPush(false);
    }
  };

  const handleAIVerifyPayment = async (paymentId: string) => {
    setVerifyingPayment(paymentId);
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { paymentId },
      });
      if (error) throw error;
      if (data?.action === "approved") {
        toast.success("Payment auto-approved by AI!");
      } else if (data?.action === "rejected") {
        toast.error("Payment rejected by AI");
      } else {
        toast.info("Manual review required - AI confidence was low");
      }
      loadData();
    } catch (e) {
      console.error("AI verification error:", e);
      toast.error("AI verification failed - please verify manually");
    } finally {
      setVerifyingPayment(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      // First get all conversation IDs for this user
      const { data: userConversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userToDelete.user_id);
      
      // Delete messages for those conversations
      if (userConversations && userConversations.length > 0) {
        const convIds = userConversations.map(c => c.id);
        await supabase.from("messages").delete().in("conversation_id", convIds);
      }
      
      // Delete other user data
      await supabase.from("conversations").delete().eq("user_id", userToDelete.user_id);
      await supabase.from("user_settings").delete().eq("user_id", userToDelete.user_id);
      await supabase.from("user_subscriptions").delete().eq("user_id", userToDelete.user_id);
      await supabase.from("user_memory").delete().eq("user_id", userToDelete.user_id);
      await supabase.from("api_keys").delete().eq("user_id", userToDelete.user_id);
      await supabase.from("projects").delete().eq("user_id", userToDelete.user_id);
      await supabase.from("profiles").delete().eq("user_id", userToDelete.user_id);
      toast.success("User data deleted successfully");
      setUserToDelete(null);
      loadUsers();
    } catch (e) {
      console.error("Delete user error:", e);
      toast.error("Failed to delete user data");
    } finally {
      setDeletingUser(false);
    }
  };

  const loadPlans = async () => {
    const { data } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price_inr");
    if (data) setPlans(data);
  };

  const loadPendingPayments = async () => {
    const { data: payments, error } = await supabase
      .from("payment_screenshots")
      .select(`*, subscription_plans(name, model_name, price_inr)`)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading payments:", error);
      return;
    }

    if (payments && payments.length > 0) {
      const userIds = payments.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
      
      // Generate signed URLs for each payment screenshot
      const paymentsWithSignedUrls = await Promise.all(payments.map(async (payment) => {
        let signedUrl = payment.screenshot_url;
        
        // Extract storage path and generate signed URL
        if (payment.screenshot_url?.includes("/payment-screenshots/")) {
          const parts = payment.screenshot_url.split("/payment-screenshots/");
          const storagePath = parts[1];
          if (storagePath) {
            const { data: signedData } = await supabase
              .storage
              .from("payment-screenshots")
              .createSignedUrl(storagePath, 600); // 10 min expiry
            if (signedData?.signedUrl) {
              signedUrl = signedData.signedUrl;
            }
          }
        }
        
        return {
          ...payment,
          display_name: profileMap.get(payment.user_id) || "Unknown User",
          signed_screenshot_url: signedUrl
        };
      }));

      setPendingPayments(paymentsWithSignedUrls);
    } else {
      setPendingPayments([]);
    }
  };

  const loadCoupons = async () => {
    const { data, error } = await supabase
      .from("coupon_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCoupons(data);
    }
  };

  const loadUsers = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !profiles) return;

    const { data: subscriptions } = await supabase
      .from("user_subscriptions")
      .select("*, subscription_plans(name)")
      .eq("status", "active");

    const subMap = new Map(
      subscriptions?.map(s => [s.user_id, {
        plan_name: s.subscription_plans?.name || "Unknown",
        expires_at: s.expires_at,
        status: s.status,
      }]) || []
    );

    const usersWithSubs: UserData[] = profiles.map(p => ({
      id: p.id,
      user_id: p.user_id,
      display_name: p.display_name,
      created_at: p.created_at,
      subscription: subMap.get(p.user_id) || null,
    }));

    setUsers(usersWithSubs);
  };

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
  };

  const loadMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("maintenance_mode")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Maintenance load error:", error);
        return;
      }
      
      if (data) {
        setMaintenanceMode(data.is_enabled);
        setMaintenanceMessage(data.message || "");
        setMaintenanceId(data.id);
      } else {
        // Create initial maintenance record if none exists
        const { data: newRecord, error: insertError } = await supabase
          .from("maintenance_mode")
          .insert({ is_enabled: false, message: "QurobAi is under maintenance. Please check back soon." })
          .select()
          .single();
        
        if (!insertError && newRecord) {
          setMaintenanceId(newRecord.id);
          setMaintenanceMessage(newRecord.message || "");
        }
      }
    } catch (e) {
      console.error("Maintenance status error:", e);
    }
  };

  const loadStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [usersRes, subsRes, paymentsRes, revenueRes, todayRes, monthRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("user_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("payment_screenshots").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("payment_screenshots").select("amount_paid").eq("status", "approved"),
      supabase.from("payment_screenshots").select("amount_paid").eq("status", "approved").gte("created_at", today.toISOString()),
      supabase.from("payment_screenshots").select("amount_paid").eq("status", "approved").gte("created_at", firstOfMonth.toISOString()),
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      activeSubscriptions: subsRes.count || 0,
      pendingPayments: paymentsRes.count || 0,
      totalRevenue: revenueRes.data?.reduce((sum, p) => sum + p.amount_paid, 0) || 0,
      todayRevenue: todayRes.data?.reduce((sum, p) => sum + p.amount_paid, 0) || 0,
      monthlyRevenue: monthRes.data?.reduce((sum, p) => sum + p.amount_paid, 0) || 0,
    });
  };

  const handleApprovePayment = async (payment: any) => {
    const { error: updateError } = await supabase
      .from("payment_screenshots")
      .update({
        status: "approved",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      toast.error("Failed to approve payment");
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: subError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: payment.user_id,
        plan_id: payment.plan_id,
        status: "active",
        expires_at: expiresAt.toISOString(),
      });

    if (subError) {
      toast.error("Failed to create subscription");
      return;
    }

    toast.success("Payment approved and subscription activated!");
    loadData();
  };

  const handleRejectPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from("payment_screenshots")
      .update({
        status: "rejected",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) {
      toast.error("Failed to reject payment");
      return;
    }

    toast.success("Payment rejected");
    loadData();
  };

  const handleCreateCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount_percent) {
      toast.error("Code and discount are required");
      return;
    }

    const { error } = await supabase.from("coupon_codes").insert({
      code: newCoupon.code.toUpperCase(),
      discount_percent: parseInt(newCoupon.discount_percent),
      max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
      valid_until: newCoupon.valid_until || null,
      created_by: user?.id,
    });

    if (error) {
      toast.error("Failed to create coupon");
      return;
    }

    toast.success("Coupon created!");
    setNewCoupon({ code: "", discount_percent: "", max_uses: "", valid_until: "" });
    loadCoupons();
  };

  const handleDeleteCoupon = async (couponId: string) => {
    const { error } = await supabase
      .from("coupon_codes")
      .delete()
      .eq("id", couponId);

    if (error) {
      toast.error("Failed to delete coupon");
      return;
    }

    toast.success("Coupon deleted");
    loadCoupons();
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast.error("Title and message are required");
      return;
    }

    const { error } = await supabase.from("announcements").insert({
      title: newAnnouncement.title,
      message: newAnnouncement.message,
      type: newAnnouncement.type,
      created_by: user?.id,
    });

    if (error) {
      toast.error("Failed to create announcement");
      return;
    }

    toast.success("Announcement created!");
    setNewAnnouncement({ title: "", message: "", type: "info" });
    loadAnnouncements();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (!error) {
      toast.success("Announcement deleted");
      loadAnnouncements();
    }
  };

  const handleToggleMaintenance = async () => {
    if (!maintenanceId) {
      toast.error("Maintenance mode not configured. Please refresh.");
      await loadMaintenanceStatus();
      return;
    }

    setMaintenanceLoading(true);
    const newStatus = !maintenanceMode;
    
    const { error } = await supabase
      .from("maintenance_mode")
      .update({
        is_enabled: newStatus,
        message: maintenanceMessage || "QurobAi is under maintenance. Please check back soon.",
        enabled_by: newStatus ? user?.id : null,
        enabled_at: newStatus ? new Date().toISOString() : null,
      })
      .eq("id", maintenanceId);

    setMaintenanceLoading(false);

    if (error) {
      console.error("Maintenance toggle error:", error);
      toast.error("Failed to update maintenance mode: " + error.message);
      return;
    }

    setMaintenanceMode(newStatus);
    toast.success(newStatus ? "Maintenance mode enabled" : "Maintenance mode disabled");
  };

  const handleSaveMaintenanceMessage = async () => {
    if (!maintenanceId) return;
    
    const { error } = await supabase
      .from("maintenance_mode")
      .update({ message: maintenanceMessage })
      .eq("id", maintenanceId);
    
    if (error) {
      toast.error("Failed to save message");
    } else {
      toast.success("Message saved");
    }
  };

  const handleGiftSubscription = async () => {
    if (!selectedGiftUser || !giftPlan) {
      toast.error("Please select a user and plan");
      return;
    }

    const selectedPlan = plans.find(p => p.id === giftPlan);
    if (!selectedPlan) {
      toast.error("Invalid plan selected");
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(giftDays));

    const { error } = await supabase.from("user_subscriptions").insert({
      user_id: selectedGiftUser.user_id,
      plan_id: giftPlan,
      status: "active",
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      toast.error("Failed to gift subscription: " + error.message);
      return;
    }

    // Create notification for user
    await supabase.from("notifications").insert({
      user_id: selectedGiftUser.user_id,
      title: "🎁 Subscription Gifted!",
      message: `You've been gifted ${selectedPlan.name} for ${giftDays} days!`,
      type: "success",
    });

    toast.success(`Gifted ${selectedPlan.name} to ${selectedGiftUser.display_name || "User"} for ${giftDays} days!`);
    setSelectedGiftUser(null);
    setGiftUserSearch("");
    setGiftPlan("");
    setGiftDays("30");
    loadData();
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage) {
      toast.error("Subject and message are required");
      return;
    }

    setSendingEmail(true);
    
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          type: "announcement",
          subject: emailSubject,
          message: emailMessage,
        },
      });

      if (error) throw error;

      toast.success("Email sent to all users!");
      setEmailSubject("");
      setEmailMessage("");
    } catch (error) {
      console.error("Email error:", error);
      toast.error("Failed to send email. Check that Resend is configured with your domain.");
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredUsers = users.filter(u => 
    !userSearch || 
    u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.user_id.toLowerCase().includes(userSearch.toLowerCase())
  );

  const giftUserResults = users.filter(u =>
    giftUserSearch && (
      u.display_name?.toLowerCase().includes(giftUserSearch.toLowerCase()) ||
      u.user_id.toLowerCase().includes(giftUserSearch.toLowerCase())
    )
  ).slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Delete User Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all data for {userToDelete?.display_name || "this user"} including conversations, messages, settings, and subscriptions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingUser}
            >
              {deletingUser ? "Deleting..." : "Delete User Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            {maintenanceMode && (
              <Badge variant="destructive">Maintenance Active</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3 h-3" />
              Users
            </div>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CreditCard className="w-3 h-3" />
              Active Subs
            </div>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="w-3 h-3" />
              Pending
            </div>
            <div className="text-2xl font-bold text-warning">{stats.pendingPayments}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="w-3 h-3" />
              Today
            </div>
            <div className="text-2xl font-bold">₹{stats.todayRevenue}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="w-3 h-3" />
              This Month
            </div>
            <div className="text-2xl font-bold">₹{stats.monthlyRevenue}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CreditCard className="w-3 h-3" />
              Total Revenue
            </div>
            <div className="text-2xl font-bold text-success">₹{stats.totalRevenue}</div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="payments">
                Payments
                {stats.pendingPayments > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5">{stats.pendingPayments}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="push">
                <Bell className="w-4 h-4 mr-1" />
                Push
              </TabsTrigger>
              <TabsTrigger value="coupons">Coupons</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="gift">Gift Sub</TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingPayments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No pending payments</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingPayments.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <div className="font-medium text-sm">{p.display_name}</div>
                            <div className="text-xs text-muted-foreground">₹{p.amount_paid}</div>
                          </div>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("payments")}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Review Payments ({stats.pendingPayments})
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("push")}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Send Push Notification
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("announcements")}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Create Announcement
                  </Button>
                  <Button 
                    variant={maintenanceMode ? "destructive" : "outline"}
                    className="w-full justify-start"
                    onClick={handleToggleMaintenance}
                    disabled={maintenanceLoading}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            {pendingPayments.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending payments to review
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {pendingPayments.map((payment) => (
                  <Card key={payment.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{payment.display_name}</CardTitle>
                          <CardDescription>
                            {payment.subscription_plans?.name} • ₹{payment.amount_paid}
                          </CardDescription>
                        </div>
                        <Badge>Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(payment.signed_screenshot_url || payment.screenshot_url) && (
                        <a 
                          href={payment.signed_screenshot_url || payment.screenshot_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img 
                            src={payment.signed_screenshot_url || payment.screenshot_url} 
                            alt="Payment screenshot" 
                            className="w-full h-32 object-cover rounded border border-border"
                          />
                        </a>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleString()}
                        {payment.coupon_code && ` • Coupon: ${payment.coupon_code}`}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAIVerifyPayment(payment.id)}
                          disabled={verifyingPayment === payment.id}
                        >
                          {verifyingPayment === payment.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Bot className="w-4 h-4 mr-1" />
                          )}
                          AI Verify
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleApprovePayment(payment)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleRejectPayment(payment.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.slice(0, 50).length} of {filteredUsers.length} users
            </div>
            
            <div className="grid gap-2">
              {filteredUsers.slice(0, 50).map((u) => (
                <Card key={u.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{u.display_name || "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">{u.user_id}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.subscription ? (
                        <Badge className="bg-primary">{u.subscription.plan_name}</Badge>
                      ) : (
                        <Badge variant="outline">Free</Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setUserToDelete(u)}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Push Notifications Tab */}
          <TabsContent value="push" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Send Push Notification
                  </CardTitle>
                  <CardDescription>
                    Send a push notification to all subscribed users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Target</Label>
                    <Select value={pushTarget} onValueChange={setPushTarget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="premium">Premium Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={pushTitle}
                      onChange={(e) => setPushTitle(e.target.value)}
                      placeholder="Notification title"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Message</Label>
                    <Textarea
                      value={pushMessage}
                      onChange={(e) => setPushMessage(e.target.value)}
                      placeholder="Notification message"
                      rows={3}
                    />
                  </div>
                  
                  {/* Preview */}
                  {(pushTitle || pushMessage) && (
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                      <div className="font-medium text-sm">{pushTitle || "Notification Title"}</div>
                      <div className="text-sm text-muted-foreground">{pushMessage || "Notification message..."}</div>
                    </div>
                  )}
                  
                  <Button onClick={handleSendPush} disabled={sendingPush} className="w-full">
                    {sendingPush ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Push Notification
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Push Statistics</CardTitle>
                  <CardDescription>
                    Overview of push notification reach
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <div className="text-3xl font-bold text-primary">{pushStats.subscribed}</div>
                      <div className="text-xs text-muted-foreground">Subscribed Devices</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <div className="text-3xl font-bold text-success">{pushStats.sent}</div>
                      <div className="text-xs text-muted-foreground">Sent This Session</div>
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Push notifications are sent to users who have enabled browser notifications. 
                      Not all users may receive them if their browser doesn't support push or notifications are disabled.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create Coupon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Code</Label>
                    <Input
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE20"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Discount %</Label>
                    <Input
                      type="number"
                      value={newCoupon.discount_percent}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_percent: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Uses</Label>
                    <Input
                      type="number"
                      value={newCoupon.max_uses}
                      onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Valid Until</Label>
                    <Input
                      type="date"
                      value={newCoupon.valid_until}
                      onChange={(e) => setNewCoupon({ ...newCoupon, valid_until: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateCoupon}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Coupon
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-2">
              {coupons.map((coupon) => (
                <Card key={coupon.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold">{coupon.code}</div>
                      <div className="text-sm text-muted-foreground">
                        {coupon.discount_percent}% off • {coupon.current_uses}/{coupon.max_uses || "∞"} uses
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={coupon.is_active ? "default" : "secondary"}>
                        {coupon.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create Announcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="Announcement title"
                  />
                </div>
                <div>
                  <Label className="text-xs">Message</Label>
                  <Textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    placeholder="Announcement message"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select 
                    value={newAnnouncement.type} 
                    onValueChange={(v) => setNewAnnouncement({ ...newAnnouncement, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateAnnouncement}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-2">
              {announcements.map((a) => (
                <Card key={a.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm text-muted-foreground">{a.message}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.is_active ? "default" : "secondary"}>
                        {a.type}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteAnnouncement(a.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Email sending requires Resend to be configured with your own domain. The default onboarding@resend.dev only works for the account owner.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Send Email to All Users
                </CardTitle>
                <CardDescription>
                  This will send an email to all registered users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Subject</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <Label className="text-xs">Message</Label>
                  <Textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Email message (HTML supported)"
                    rows={6}
                  />
                </div>
                <Button onClick={handleSendEmail} disabled={sendingEmail}>
                  {sendingEmail ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maintenance Mode</CardTitle>
                <CardDescription>
                  When enabled, users will see a maintenance message instead of the app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">Maintenance Mode</div>
                    <div className="text-sm text-muted-foreground">
                      {maintenanceMode ? "Currently enabled - users see maintenance page" : "Currently disabled - app is accessible"}
                    </div>
                  </div>
                  <Switch 
                    checked={maintenanceMode} 
                    onCheckedChange={handleToggleMaintenance}
                    disabled={maintenanceLoading}
                  />
                </div>
                <div>
                  <Label className="text-xs">Maintenance Message</Label>
                  <Textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="QurobAi is currently under maintenance. We'll be back soon!"
                    rows={3}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleSaveMaintenanceMessage}
                  >
                    Save Message
                  </Button>
                </div>
                <Button 
                  onClick={handleToggleMaintenance} 
                  variant={maintenanceMode ? "destructive" : "default"}
                  disabled={maintenanceLoading}
                  className="w-full"
                >
                  {maintenanceLoading ? "Processing..." : maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gift Subscription Tab */}
          <TabsContent value="gift" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Gift Subscription
                </CardTitle>
                <CardDescription>
                  Give a user a subscription without payment. Search for a user by name.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Search User</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={giftUserSearch}
                      onChange={(e) => {
                        setGiftUserSearch(e.target.value);
                        setSelectedGiftUser(null);
                      }}
                      placeholder="Search by name or ID..."
                      className="pl-9"
                    />
                  </div>
                  
                  {giftUserResults.length > 0 && !selectedGiftUser && (
                    <div className="mt-2 border border-border rounded-lg overflow-hidden">
                      {giftUserResults.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedGiftUser(u);
                            setGiftUserSearch(u.display_name || u.user_id);
                          }}
                          className="w-full p-3 text-left hover:bg-muted flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium">{u.display_name || "Unnamed"}</div>
                            <div className="text-xs text-muted-foreground font-mono">{u.user_id.slice(0, 8)}...</div>
                          </div>
                          {u.subscription && (
                            <Badge variant="outline">{u.subscription.plan_name}</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {selectedGiftUser && (
                    <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="font-medium">{selectedGiftUser.display_name || "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{selectedGiftUser.user_id}</div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="text-xs">Plan</Label>
                  <Select value={giftPlan} onValueChange={setGiftPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.filter(p => p.price_inr > 0).map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} (₹{plan.price_inr})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Duration (days)</Label>
                  <Input
                    type="number"
                    value={giftDays}
                    onChange={(e) => setGiftDays(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <Button 
                  onClick={handleGiftSubscription}
                  disabled={!selectedGiftUser || !giftPlan}
                  className="w-full"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Gift Subscription
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}