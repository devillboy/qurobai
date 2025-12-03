import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Calendar, CreditCard, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  starts_at: string;
  expires_at: string;
  created_at: string;
  subscription_plans: {
    name: string;
    model_name: string;
    price_inr: number;
  } | null;
}

interface Payment {
  id: string;
  amount_paid: number;
  status: string;
  created_at: string;
  coupon_code: string | null;
  subscription_plans: {
    name: string;
  } | null;
}

export default function SubscriptionHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentModel, setCurrentModel] = useState("Qurob 2");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    
    const [subsRes, paymentsRes, modelRes] = await Promise.all([
      supabase
        .from("user_subscriptions")
        .select(`
          *,
          subscription_plans(name, model_name, price_inr)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      
      supabase
        .from("payment_screenshots")
        .select(`
          *,
          subscription_plans(name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      
      supabase.rpc("get_user_model", { user_id: user.id })
    ]);

    if (subsRes.data) setSubscriptions(subsRes.data);
    if (paymentsRes.data) setPayments(paymentsRes.data);
    if (modelRes.data) setCurrentModel(modelRes.data);
    
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "approved":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/90 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/90 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Subscription History
          </h1>
        </motion.div>

        {/* Current Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{currentModel}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentModel === "Qurob 4" ? "Premium AI Model" : "Free AI Model"}
                  </p>
                </div>
                {currentModel === "Qurob 2" && (
                  <Button onClick={() => navigate("/subscribe")}>
                    Upgrade to Qurob 4
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscriptions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscriptions
          </h2>
          
          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No subscriptions yet. Upgrade to Qurob 4 for better AI!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub, index) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(sub.status)}
                          <div>
                            <p className="font-medium">{sub.subscription_plans?.name || "Subscription"}</p>
                            <p className="text-sm text-muted-foreground">
                              {sub.subscription_plans?.model_name}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(sub.status)}
                      </div>
                      <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Started: {formatDate(sub.starts_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Expires: {formatDate(sub.expires_at)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment History
          </h2>
          
          {payments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No payment history yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {payments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(payment.status)}
                          <div>
                            <p className="font-medium">₹{payment.amount_paid}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.subscription_plans?.name || "Subscription"}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(payment.created_at)}
                        </div>
                        {payment.coupon_code && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              Coupon: {payment.coupon_code}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}