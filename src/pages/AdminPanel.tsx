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
import { ArrowLeft, Check, X, Plus, Trash2, Users, CreditCard, Bell, Settings, Activity, MessageSquare, Shield, AlertTriangle, Eye, Ban, Gift, Download, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  
  // Gift subscription state
  const [giftEmail, setGiftEmail] = useState("");
  const [giftPlan, setGiftPlan] = useState("");
  const [plans, setPlans] = useState<any[]>([]);

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
    ]);
    setLoading(false);
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
      
      const paymentsWithProfiles = payments.map(payment => ({
        ...payment,
        display_name: profileMap.get(payment.user_id) || "Unknown User"
      }));

      setPendingPayments(paymentsWithProfiles);
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

    // Get subscriptions for each user
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
    const { data } = await supabase
      .from("maintenance_mode")
      .select("*")
      .limit(1)
      .single();
    if (data) {
      setMaintenanceMode(data.is_enabled);
      setMaintenanceMessage(data.message || "");
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
    const newStatus = !maintenanceMode;
    const { error } = await supabase
      .from("maintenance_mode")
      .update({
        is_enabled: newStatus,
        message: maintenanceMessage,
        enabled_by: newStatus ? user?.id : null,
        enabled_at: newStatus ? new Date().toISOString() : null,
      })
      .eq("id", (await supabase.from("maintenance_mode").select("id").limit(1).single()).data?.id);

    if (error) {
      toast.error("Failed to update maintenance mode");
      return;
    }

    setMaintenanceMode(newStatus);
    toast.success(newStatus ? "Maintenance mode enabled" : "Maintenance mode disabled");
  };

  const handleGiftSubscription = async () => {
    if (!giftEmail || !giftPlan) {
      toast.error("Email and plan are required");
      return;
    }

    // Find user by email - we'll need to search in auth.users
    // For now, show a message that this requires email to be same as user_id lookup
    toast.error("Gift subscription feature requires email lookup - coming soon!");
  };

  const filteredUsers = users.filter(u => 
    !userSearch || 
    u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.user_id.toLowerCase().includes(userSearch.toLowerCase())
  );

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
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Admin Panel</h1>
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
              <AlertTriangle className="w-3 h-3" />
              Pending
            </div>
            <div className="text-2xl font-bold text-warning">{stats.pendingPayments}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="w-3 h-3" />
              Today
            </div>
            <div className="text-2xl font-bold text-primary">₹{stats.todayRevenue}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="w-3 h-3" />
              This Month
            </div>
            <div className="text-2xl font-bold text-primary">₹{stats.monthlyRevenue}</div>
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
              <TabsTrigger value="dashboard" className="gap-2">
                <Activity className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Payments
                {stats.pendingPayments > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5">{stats.pendingPayments}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="coupons" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Coupons
              </TabsTrigger>
              <TabsTrigger value="announcements" className="gap-2">
                <Bell className="w-4 h-4" />
                Announcements
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="gap-2">
                <Shield className="w-4 h-4" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="gift" className="gap-2">
                <Gift className="w-4 h-4" />
                Gift Sub
              </TabsTrigger>
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
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
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
                    onClick={() => setActiveTab("announcements")}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Create Announcement
                  </Button>
                  <Button 
                    variant={maintenanceMode ? "destructive" : "outline"}
                    className="w-full justify-start"
                    onClick={handleToggleMaintenance}
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
                        <Badge variant="secondary">{payment.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <img
                        src={payment.screenshot_url}
                        alt="Payment proof"
                        className="rounded-lg border max-h-48 w-full object-contain bg-muted/50"
                      />
                      {payment.coupon_code && (
                        <div className="text-xs text-muted-foreground">
                          Coupon: <code className="bg-muted px-1 rounded">{payment.coupon_code}</code>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprovePayment(payment)} className="flex-1">
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectPayment(payment.id)} className="flex-1">
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
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">User</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Subscription</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Joined</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.slice(0, 50).map((u) => (
                        <tr key={u.id} className="border-b border-border/50">
                          <td className="p-3">
                            <div className="font-medium text-sm">{u.display_name || "No name"}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{u.user_id}</div>
                          </td>
                          <td className="p-3">
                            {u.subscription ? (
                              <Badge variant="default" className="text-xs">{u.subscription.plan_name}</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Free</Badge>
                            )}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create New Coupon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Code</Label>
                    <Input
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Discount %</Label>
                    <Input
                      type="number"
                      value={newCoupon.discount_percent}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_percent: e.target.value })}
                      placeholder="50"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Uses</Label>
                    <Input
                      type="number"
                      value={newCoupon.max_uses}
                      onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                      placeholder="∞"
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
                <Button onClick={handleCreateCoupon} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Coupon
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {coupons.map((coupon) => (
                <Card key={coupon.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <code className="text-lg font-bold">{coupon.code}</code>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCoupon(coupon.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>{coupon.discount_percent}% off</div>
                    <div>Uses: {coupon.current_uses}/{coupon.max_uses || "∞"}</div>
                    <Badge variant={coupon.is_active ? "default" : "secondary"} className="text-xs">
                      {coupon.is_active ? "Active" : "Inactive"}
                    </Badge>
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
              <CardContent className="space-y-3">
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
                <div className="flex gap-2">
                  {["info", "warning", "success", "maintenance"].map((type) => (
                    <Button
                      key={type}
                      variant={newAnnouncement.type === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewAnnouncement({ ...newAnnouncement, type })}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                <Button onClick={handleCreateAnnouncement} className="w-full">
                  <Bell className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {announcements.map((a) => (
                <Card key={a.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={a.type === "warning" ? "destructive" : "secondary"} className="text-xs">
                          {a.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteAnnouncement(a.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Maintenance Mode
                </CardTitle>
                <CardDescription>
                  Enable maintenance mode to prevent users from accessing the app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">Maintenance Mode</div>
                    <div className="text-sm text-muted-foreground">
                      {maintenanceMode ? "Currently enabled" : "Currently disabled"}
                    </div>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={handleToggleMaintenance}
                  />
                </div>
                <div>
                  <Label>Maintenance Message</Label>
                  <Textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="Message to show users during maintenance"
                    rows={3}
                  />
                </div>
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
                  Give a free subscription to a user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>User Email</Label>
                  <Input
                    type="email"
                    value={giftEmail}
                    onChange={(e) => setGiftEmail(e.target.value)}
                    placeholder="user@email.com"
                  />
                </div>
                <div>
                  <Label>Plan</Label>
                  <div className="flex gap-2 mt-2">
                    {plans.filter(p => p.price_inr > 0).map((plan) => (
                      <Button
                        key={plan.id}
                        variant={giftPlan === plan.id ? "default" : "outline"}
                        onClick={() => setGiftPlan(plan.id)}
                      >
                        {plan.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleGiftSubscription} className="w-full">
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
