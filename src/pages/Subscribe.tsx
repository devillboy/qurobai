import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  ArrowLeft, Upload, Check, Sparkles, Code, Zap, Brain, 
  Smartphone, Copy, Gift, Wallet, QrCode,
  Building2, Crown, Shield, Star, Rocket
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type PaymentMethod = "upi" | "google_redeem" | "bank_transfer";

type DrawerStep = "pay" | "proof";

export default function Subscribe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [redeemCode, setRedeemCode] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<DrawerStep>("pay");

  // Payment config (kept on backend; fallback to hardcoded for safety)
  const [upiId, setUpiId] = useState<string>("7864084241@ybl");

  // Bank details are optional for now (can be moved to backend later)
  const bankDetails = useMemo(
    () =>
      [
        { label: "Bank Name", value: "—" },
        { label: "Account No", value: "—" },
        { label: "IFSC Code", value: "—" },
        { label: "Holder", value: "—" },
      ] as const,
    [],
  );

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadPlans();
    loadPaymentSettings();
  }, [user]);

  const loadPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "upi_id")
        .maybeSingle();

      if (!error && data?.setting_value) {
        setUpiId(String(data.setting_value));
      }
    } catch {
      // ignore and keep fallback
    }
  };

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price_inr", { ascending: true });

    if (!error && data) {
      setPlans(data);
      const premiumPlan = data.find(p => p.name === "Premium");
      if (premiumPlan) setSelectedPlan(premiumPlan);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setDiscount(0);
      return;
    }

    const { data, error } = await supabase
      .from("coupon_codes")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      toast.error("Invalid or expired coupon code");
      setDiscount(0);
      return;
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      toast.error("Coupon has reached maximum uses");
      setDiscount(0);
      return;
    }

    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      toast.error("Coupon has expired");
      setDiscount(0);
      return;
    }

    setDiscount(data.discount_percent);
    toast.success(`${data.discount_percent}% discount applied!`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const openUpiApp = () => {
    if (!selectedPlan) return;
    const finalPrice = Math.round(selectedPlan.price_inr * (1 - discount / 100));
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=QurobAi&am=${finalPrice}&cu=INR&tn=QurobAi%20${encodeURIComponent(
      selectedPlan.name,
    )}%20Subscription`;
    window.location.href = upiLink;
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (paymentMethod === "google_redeem") {
      if (!redeemCode.trim()) {
        toast.error("Please enter the Google Play redeem code");
        return false;
      }
    } else {
      if (!screenshot) {
        toast.error("Please upload payment screenshot");
        return false;
      }
    }

    if (!selectedPlan) {
      toast.error("Please select a plan");
      return false;
    }

    setLoading(true);

    try {
      let screenshotUrl = "";
      
      if (screenshot) {
        const fileName = `${user?.id}/${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("payment-screenshots")
          .upload(fileName, screenshot);

        if (uploadError) throw uploadError;

        // Bucket is private; we store a stable URL-looking string so the verifier can extract path.
        const { data: urlData } = supabase.storage.from("payment-screenshots").getPublicUrl(fileName);
        screenshotUrl = urlData.publicUrl;
      }

      const finalPrice = selectedPlan.price_inr * (1 - discount / 100);

      const paymentData: any = {
        user_id: user?.id,
        plan_id: selectedPlan.id,
        amount_paid: Math.round(finalPrice),
        coupon_code: couponCode || null,
        payment_method: paymentMethod,
      };

      if (screenshotUrl) {
        paymentData.screenshot_url = screenshotUrl;
      }

      if (paymentMethod === "google_redeem") {
        paymentData.admin_notes = `Google Play Redeem Code: ${redeemCode}`;
      }

      if (transactionId) {
        paymentData.admin_notes = `${paymentData.admin_notes || ""} Transaction ID: ${transactionId}`.trim();
      }

      const { data: insertData, error: insertError } = await supabase
        .from("payment_screenshots")
        .insert(paymentData)
        .select()
        .single();

      if (insertError) throw insertError;

      if (couponCode) {
        const { data: couponData } = await supabase
          .from("coupon_codes")
          .select("current_uses")
          .eq("code", couponCode.toUpperCase())
          .single();

        if (couponData) {
          await supabase
            .from("coupon_codes")
            .update({ current_uses: couponData.current_uses + 1 })
            .eq("code", couponCode.toUpperCase());
        }
      }

      // Auto-trigger AI verification (only for screenshot payments)
      if (screenshotUrl) {
        toast.loading("Verifying payment...", { id: "verify" });
        try {
          const { data: verifyResult, error: verifyError } = await supabase.functions.invoke("verify-payment", {
            body: { paymentId: insertData.id },
          });
          
          if (verifyError) {
            toast.dismiss("verify");
            toast.info("Payment submitted! AI verification pending.");
          } else if (verifyResult?.action === "approved") {
            toast.dismiss("verify");
            toast.success("🎉 Payment verified! Subscription active.");
          } else if (verifyResult?.action === "rejected") {
            toast.dismiss("verify");
            toast.error("Payment verification failed. Contact support.");
          } else {
            toast.dismiss("verify");
            toast.info("Payment submitted! Admin will verify shortly.");
          }
        } catch (e) {
          toast.dismiss("verify");
          toast.info("Payment submitted! Admin will review.");
        }
      } else {
        toast.success("Payment submitted! Admin will verify within 24 hours.");
      }

      navigate("/");
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit payment");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const premiumPlan = plans.find(p => p.name === "Premium");
  const codePlan = plans.find(p => p.name === "Code Specialist");
  
  const finalPrice = selectedPlan ? selectedPlan.price_inr * (1 - discount / 100) : 0;
  const canOpenDrawer = Boolean(selectedPlan && selectedPlan.price_inr > 0);

  const canContinueToProof =
    paymentMethod === "google_redeem" ? Boolean(redeemCode.trim()) : true;

  const canSubmit =
    !loading &&
    (paymentMethod === "google_redeem" ? Boolean(redeemCode.trim()) : Boolean(screenshot));

  return (
    <div className="min-h-screen bg-background gradient-mesh p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 hover-lift">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Premium Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Crown className="w-5 h-5 text-primary animate-pulse-glow" />
            <span className="text-sm font-medium text-primary">Unlock Premium Features</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-gradient">Upgrade Your AI Experience</span>
          </h1>
          <p className="text-muted-foreground">Choose the perfect plan for your needs</p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Free Plan */}
          <Card className="premium-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent opacity-50" />
            <CardHeader className="pb-3 relative z-10">
              <Badge className="w-fit mb-2" variant="secondary">Current Plan</Badge>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted">
                  <Zap className="w-5 h-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">Qurob 2</CardTitle>
              </div>
              <CardDescription className="text-2xl font-bold text-foreground mt-2">
                Free<span className="text-sm font-normal text-muted-foreground ml-1">forever</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Basic AI responses
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Real-time data
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Basic code help
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card 
            className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
              selectedPlan?.name === "Premium" 
                ? "border-2 border-primary glow" 
                : "premium-card hover:border-primary/50"
            }`}
            onClick={() => premiumPlan && setSelectedPlan(premiumPlan)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
            <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
              <Star className="w-3 h-3 inline mr-1" />
              POPULAR
            </div>
            <div className="absolute top-0 left-0 bg-success text-white px-2 py-1 text-xs font-medium rounded-br-lg">
              + Q-06
            </div>
            <CardHeader className="pb-3 relative z-10 pt-8">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg gradient-primary">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg">Qurob 4</CardTitle>
              </div>
              <CardDescription className="mt-2">
                <span className="text-2xl font-bold text-foreground">
                  ₹{premiumPlan ? Math.round(premiumPlan.price_inr * (1 - (selectedPlan?.name === "Premium" ? discount : 0) / 100)) : 289}
                </span>
                {selectedPlan?.name === "Premium" && discount > 0 && (
                  <span className="ml-2 line-through text-muted-foreground text-sm">
                    ₹{premiumPlan?.price_inr}
                  </span>
                )}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <strong>Advanced 70B AI</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <strong>Superior reasoning</strong>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Deep analysis
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Priority support
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Q-06 Plan */}
          <Card 
            className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
              selectedPlan?.name === "Code Specialist" 
                ? "border-2 border-primary glow" 
                : "premium-card hover:border-primary/50"
            }`}
            onClick={() => codePlan && setSelectedPlan(codePlan)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/5" />
            <div className="absolute top-0 right-0 bg-foreground text-background px-3 py-1 text-xs font-semibold rounded-bl-lg">
              <Rocket className="w-3 h-3 inline mr-1" />
              CODE EXPERT
            </div>
            <CardHeader className="pb-3 relative z-10 pt-8">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Code className="w-5 h-5 text-accent" />
                </div>
                <CardTitle className="text-lg">Q-06</CardTitle>
              </div>
              <CardDescription className="mt-2">
                <span className="text-2xl font-bold text-foreground">
                  ₹{codePlan ? Math.round(codePlan.price_inr * (1 - (selectedPlan?.name === "Code Specialist" ? discount : 0) / 100)) : 320}
                </span>
                {selectedPlan?.name === "Code Specialist" && discount > 0 && (
                  <span className="ml-2 line-through text-muted-foreground text-sm">
                    ₹{codePlan?.price_inr}
                  </span>
                )}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <strong>Expert-level coding</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <strong>100+ languages</strong>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Clean modular code
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Architecture design
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-first payment wizard (bottom sheet) */}
        {canOpenDrawer && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Payable</div>
                <div className="text-lg font-semibold leading-tight">₹{Math.round(finalPrice)}</div>
                {discount > 0 && selectedPlan && (
                  <div className="text-xs text-muted-foreground">
                    <span className="line-through">₹{selectedPlan.price_inr}</span>
                    <Badge className="ml-2" variant="secondary">
                      {discount}% OFF
                    </Badge>
                  </div>
                )}
              </div>

              <Button
                className="btn-premium h-11"
                onClick={() => {
                  setDrawerStep("pay");
                  setDrawerOpen(true);
                }}
              >
                <Shield className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </div>
          </div>
        )}

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="max-h-[88vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  Payment Gateway
                </span>
                <DrawerClose asChild>
                  <Button variant="ghost" size="sm">
                    Close
                  </Button>
                </DrawerClose>
              </DrawerTitle>
              <p className="text-sm text-muted-foreground">
                {selectedPlan?.name === "Code Specialist" ? "Q-06" : selectedPlan?.name} • ₹{Math.round(finalPrice)}
              </p>
            </DrawerHeader>

            <div className="px-4 pb-4 overflow-y-auto">
              {/* Step indicator */}
              <div className="mb-4 flex items-center gap-2">
                <div
                  className={`h-1.5 flex-1 rounded-full ${drawerStep === "pay" ? "bg-primary" : "bg-primary/30"}`}
                />
                <div
                  className={`h-1.5 flex-1 rounded-full ${drawerStep === "proof" ? "bg-primary" : "bg-primary/30"}`}
                />
              </div>

              {drawerStep === "pay" && (
                <div className="space-y-4">
                  {/* Coupon */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-sm text-muted-foreground">Coupon</Label>
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="mt-1 bg-input/50"
                      />
                    </div>
                    <Button onClick={validateCoupon} variant="outline" className="mt-6">
                      Apply
                    </Button>
                  </div>

                  {/* Payment methods */}
                  <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                      <TabsTrigger value="upi" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <QrCode className="w-4 h-4 mr-1.5" />
                        UPI
                      </TabsTrigger>
                      <TabsTrigger
                        value="google_redeem"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Gift className="w-4 h-4 mr-1.5" />
                        Redeem
                      </TabsTrigger>
                      <TabsTrigger
                        value="bank_transfer"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Building2 className="w-4 h-4 mr-1.5" />
                        Bank
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upi" className="space-y-3 mt-4">
                      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-primary" />
                          <span className="font-semibold">Pay via UPI</span>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                          <span className="text-sm text-muted-foreground">UPI ID:</span>
                          <code className="font-mono text-primary flex-1 font-medium">{upiId}</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(upiId, "UPI ID")}
                            aria-label="Copy UPI ID"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>

                        <Button onClick={openUpiApp} variant="outline" className="w-full hover-lift">
                          <Smartphone className="w-4 h-4 mr-2" />
                          Open UPI App
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="google_redeem" className="space-y-3 mt-4">
                      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                        <div className="flex items-center gap-2">
                          <Gift className="w-5 h-5 text-success" />
                          <span className="font-semibold">Google Play Redeem Code</span>
                        </div>

                        <div>
                          <Label className="text-sm">Redeem Code</Label>
                          <Input
                            value={redeemCode}
                            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            className="mt-1 font-mono tracking-widest bg-input/50 text-center text-lg"
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Tip: Gift card amount should be around ₹{Math.round(finalPrice)}.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="bank_transfer" className="space-y-3 mt-4">
                      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-primary" />
                          <span className="font-semibold">Bank Transfer</span>
                        </div>

                        <div className="space-y-2">
                          {bankDetails.map(({ label, value }) => (
                            <div
                              key={label}
                              className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border border-border/50"
                            >
                              <span className="text-sm text-muted-foreground">{label}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium text-sm">{value}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(value, label)}
                                  aria-label={`Copy ${label}`}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <Label className="text-sm">Transaction ID (Optional)</Label>
                          <Input
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter UTR / Transaction ID"
                            className="mt-1 bg-input/50"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {drawerStep === "proof" && (
                <div className="space-y-3">
                  {paymentMethod !== "google_redeem" ? (
                    <>
                      <Label className="text-sm">Upload Payment Screenshot</Label>
                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Payment screenshot preview"
                            loading="lazy"
                            className="max-h-52 mx-auto rounded-lg object-contain"
                          />
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Tap to upload screenshot</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <p className="text-sm text-muted-foreground">
                        Redeem code submitted without screenshot.
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    🔒 Secure payment • Admin verification within 24 hours
                  </p>
                </div>
              )}
            </div>

            <DrawerFooter>
              {drawerStep === "pay" ? (
                <Button
                  className="btn-premium h-12"
                  disabled={!canContinueToProof}
                  onClick={() => setDrawerStep("proof")}
                >
                  Continue to Proof
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="h-12 flex-1" onClick={() => setDrawerStep("pay")}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    className="btn-premium h-12 flex-1"
                    onClick={async () => {
                      const ok = await handleSubmit();
                      if (ok) setDrawerOpen(false);
                    }}
                    disabled={!canSubmit}
                  >
                    {loading ? "Processing..." : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              )}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
