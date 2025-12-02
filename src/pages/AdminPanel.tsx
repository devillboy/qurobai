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
import { ArrowLeft, Check, X, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
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

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    totalRevenue: 0,
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
    ]);
    setLoading(false);
  };

  const loadPendingPayments = async () => {
    const { data, error } = await supabase
      .from("payment_screenshots")
      .select(`
        *,
        profiles(display_name),
        subscription_plans(name, model_name, price_inr)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPendingPayments(data);
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

  const loadStats = async () => {
    const [usersRes, subsRes, paymentsRes, revenueRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("user_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("payment_screenshots").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("payment_screenshots").select("amount_paid").eq("status", "approved"),
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      activeSubscriptions: subsRes.count || 0,
      pendingPayments: paymentsRes.count || 0,
      totalRevenue: revenueRes.data?.reduce((sum, p) => sum + p.amount_paid, 0) || 0,
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

    // Create subscription
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/90 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/90 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Subscriptions</CardDescription>
              <CardTitle className="text-3xl">{stats.activeSubscriptions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Payments</CardDescription>
              <CardTitle className="text-3xl">{stats.pendingPayments}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-3xl">₹{stats.totalRevenue}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments">Pending Payments</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            {pendingPayments.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending payments to review
                </CardContent>
              </Card>
            ) : (
              pendingPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {payment.profiles?.display_name || "User"}
                        </CardTitle>
                        <CardDescription>
                          {payment.subscription_plans?.name} - ₹{payment.amount_paid}
                        </CardDescription>
                      </div>
                      <Badge>{payment.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Payment Screenshot</Label>
                      <img
                        src={payment.screenshot_url}
                        alt="Payment proof"
                        className="mt-2 rounded-lg border max-w-md"
                      />
                    </div>
                    {payment.coupon_code && (
                      <div>
                        <Label>Coupon Used</Label>
                        <p className="text-sm font-mono mt-1">{payment.coupon_code}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprovePayment(payment)}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleRejectPayment(payment.id)}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Coupon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Coupon Code</Label>
                    <Input
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                      placeholder="WELCOME50"
                    />
                  </div>
                  <div>
                    <Label>Discount (%)</Label>
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
                    <Label>Max Uses (optional)</Label>
                    <Input
                      type="number"
                      value={newCoupon.max_uses}
                      onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <Label>Valid Until (optional)</Label>
                    <Input
                      type="datetime-local"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="font-mono">{coupon.code}</CardTitle>
                        <CardDescription>{coupon.discount_percent}% off</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>Uses: {coupon.current_uses} / {coupon.max_uses || "∞"}</div>
                    {coupon.valid_until && (
                      <div>Valid until: {new Date(coupon.valid_until).toLocaleDateString()}</div>
                    )}
                    <Badge variant={coupon.is_active ? "default" : "secondary"}>
                      {coupon.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
