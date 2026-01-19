import { useState, useEffect } from "react";
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
  Smartphone, Copy, CreditCard, Gift, Wallet, QrCode,
  Building2, Banknote
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PaymentMethod = "upi" | "google_redeem" | "bank_transfer";

interface PaymentDetails {
  upiId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
}

const paymentDetails: PaymentDetails = {
  upiId: "7864084241@ybl",
  bankName: "State Bank of India",
  accountNumber: "40364689383",
  ifscCode: "SBIN0007859",
  accountHolder: "SOHAM GHOSH",
};

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

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadPlans();
  }, [user]);

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
    const upiLink = `upi://pay?pa=${paymentDetails.upiId}&pn=QurobAi&am=${finalPrice}&cu=INR&tn=QurobAi%20${selectedPlan.name}%20Subscription`;
    window.location.href = upiLink;
  };

  const handleSubmit = async () => {
    if (paymentMethod === "google_redeem") {
      if (!redeemCode.trim()) {
        toast.error("Please enter the Google Play redeem code");
        return;
      }
    } else {
      if (!screenshot) {
        toast.error("Please upload payment screenshot");
        return;
      }
    }

    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
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

        const { data: urlData } = supabase.storage
          .from("payment-screenshots")
          .getPublicUrl(fileName);

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
            console.error("Verification error:", verifyError);
            toast.dismiss("verify");
            toast.info("Payment submitted! AI verification pending, admin will review shortly.");
          } else if (verifyResult?.action === "approved") {
            toast.dismiss("verify");
            toast.success("🎉 Payment verified and approved! Your subscription is now active.");
          } else if (verifyResult?.action === "rejected") {
            toast.dismiss("verify");
            toast.error("Payment could not be verified. Please contact support.");
          } else if (verifyResult?.retryable) {
            toast.dismiss("verify");
            toast.info("Verification service busy. Admin will review your payment shortly.");
          } else {
            toast.dismiss("verify");
            toast.info("Payment submitted! Admin will verify within 24 hours.");
          }
        } catch (e) {
          console.error("Verification invoke error:", e);
          toast.dismiss("verify");
          toast.info("Payment submitted! Admin will review shortly.");
        }
      } else {
        toast.success("Payment submitted! Admin will verify your redeem code within 24 hours.");
      }

      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit payment");
    } finally {
      setLoading(false);
    }
  };

  const premiumPlan = plans.find(p => p.name === "Premium");
  const codePlan = plans.find(p => p.name === "Code Specialist");
  
  const finalPrice = selectedPlan ? selectedPlan.price_inr * (1 - discount / 100) : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Upgrade Your AI</h1>
          </div>
          <p className="text-muted-foreground text-sm">Choose the plan that fits your needs</p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Free Plan */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <Badge className="w-fit mb-2" variant="secondary">Current Plan</Badge>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Qurob 2</CardTitle>
              </div>
              <CardDescription className="text-xl font-bold text-foreground">
                ₹0<span className="text-sm font-normal text-muted-foreground"> / forever</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
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
            className={`border-2 relative cursor-pointer transition-all ${
              selectedPlan?.name === "Premium" 
                ? "border-primary" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => premiumPlan && setSelectedPlan(premiumPlan)}
          >
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium rounded-bl">
              POPULAR
            </div>
            <div className="absolute top-0 left-0 bg-green-600 text-white px-2 py-0.5 text-xs font-medium rounded-br">
              + Q-06 Included
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Qurob 4</CardTitle>
              </div>
              <CardDescription>
                <span className="text-xl font-bold text-foreground">
                  ₹{premiumPlan ? Math.round(premiumPlan.price_inr * (1 - (selectedPlan?.name === "Premium" ? discount : 0) / 100)) : 289}
                </span>
                {selectedPlan?.name === "Premium" && discount > 0 && (
                  <span className="ml-2 line-through text-muted-foreground text-sm">
                    ₹{premiumPlan?.price_inr}
                  </span>
                )}
                <span className="text-sm font-normal text-muted-foreground"> / month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <strong>Advanced 70B AI model</strong>
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
            className={`border-2 relative cursor-pointer transition-all ${
              selectedPlan?.name === "Code Specialist" 
                ? "border-primary" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => codePlan && setSelectedPlan(codePlan)}
          >
            <div className="absolute top-0 right-0 bg-foreground text-background px-2 py-0.5 text-xs font-medium rounded-bl">
              CODE EXPERT
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Q-06</CardTitle>
              </div>
              <CardDescription>
                <span className="text-xl font-bold text-foreground">
                  ₹{codePlan ? Math.round(codePlan.price_inr * (1 - (selectedPlan?.name === "Code Specialist" ? discount : 0) / 100)) : 320}
                </span>
                {selectedPlan?.name === "Code Specialist" && discount > 0 && (
                  <span className="ml-2 line-through text-muted-foreground text-sm">
                    ₹{codePlan?.price_inr}
                  </span>
                )}
                <span className="text-sm font-normal text-muted-foreground"> / month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
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

        {/* Purchase Form */}
        {selectedPlan && selectedPlan.price_inr > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Complete Your Purchase - {selectedPlan.name === "Code Specialist" ? "Q-06" : selectedPlan.name}
              </CardTitle>
              <CardDescription>
                Choose your preferred payment method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coupon */}
              <div>
                <Label className="text-sm">Coupon Code (Optional)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon"
                    className="flex-1"
                  />
                  <Button onClick={validateCoupon} variant="outline" size="sm">
                    Apply
                  </Button>
                </div>
              </div>

              {/* Price Display */}
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">₹{Math.round(finalPrice)}</div>
                {discount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="line-through">₹{selectedPlan.price_inr}</span> • {discount}% off
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upi" className="flex items-center gap-1">
                    <QrCode className="w-4 h-4" />
                    <span className="hidden sm:inline">UPI</span>
                  </TabsTrigger>
                  <TabsTrigger value="google_redeem" className="flex items-center gap-1">
                    <Gift className="w-4 h-4" />
                    <span className="hidden sm:inline">Redeem Code</span>
                  </TabsTrigger>
                  <TabsTrigger value="bank_transfer" className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Bank</span>
                  </TabsTrigger>
                </TabsList>

                {/* UPI Payment */}
                <TabsContent value="upi" className="space-y-4 mt-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      <span className="font-medium">Pay via UPI</span>
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 bg-background rounded border">
                      <span className="text-sm">UPI ID:</span>
                      <code className="font-mono text-primary flex-1">{paymentDetails.upiId}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentDetails.upiId, "UPI ID")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button onClick={openUpiApp} variant="outline" className="w-full">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Open UPI App (PhonePe, GPay, Paytm)
                    </Button>

                    <div className="grid grid-cols-4 gap-2 py-2">
                      {["PhonePe", "GPay", "Paytm", "BHIM"].map((app) => (
                        <div key={app} className="text-center text-xs text-muted-foreground p-2 rounded bg-background border">
                          {app}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Google Play Redeem Code */}
                <TabsContent value="google_redeem" className="space-y-4 mt-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Google Play Redeem Code</span>
                    </div>

                    <div className="bg-background p-3 rounded border space-y-2">
                      <p className="text-sm text-muted-foreground">
                        You can pay using Google Play gift card / redeem code worth ₹{Math.round(finalPrice)}
                      </p>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Buy a Google Play gift card of ₹{Math.round(finalPrice)} or more</li>
                        <li>Enter the redeem code below</li>
                        <li>Admin will verify and activate your subscription</li>
                      </ol>
                    </div>

                    <div>
                      <Label className="text-sm">Enter Redeem Code</Label>
                      <Input
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="mt-1 font-mono tracking-wider"
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      💡 You can buy Google Play gift cards from stores like Amazon, Flipkart, or local retailers
                    </p>
                  </div>
                </TabsContent>

                {/* Bank Transfer */}
                <TabsContent value="bank_transfer" className="space-y-4 mt-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Bank Transfer (NEFT/IMPS/RTGS)</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-background rounded border">
                        <span className="text-sm text-muted-foreground">Bank Name</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{paymentDetails.bankName}</span>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentDetails.bankName, "Bank Name")}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-background rounded border">
                        <span className="text-sm text-muted-foreground">Account Number</span>
                        <div className="flex items-center gap-2">
                          <code className="font-mono">{paymentDetails.accountNumber}</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentDetails.accountNumber, "Account Number")}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-background rounded border">
                        <span className="text-sm text-muted-foreground">IFSC Code</span>
                        <div className="flex items-center gap-2">
                          <code className="font-mono">{paymentDetails.ifscCode}</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentDetails.ifscCode, "IFSC Code")}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-background rounded border">
                        <span className="text-sm text-muted-foreground">Account Holder</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{paymentDetails.accountHolder}</span>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentDetails.accountHolder, "Account Holder")}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Transaction ID (Optional)</Label>
                      <Input
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter UTR / Transaction ID"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Screenshot Upload (for UPI and Bank Transfer) */}
              {paymentMethod !== "google_redeem" && (
                <div>
                  <Label className="text-sm">Upload Payment Screenshot</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 cursor-pointer"
                  />
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Payment screenshot"
                      className="mt-3 rounded-lg border max-h-48 object-contain"
                    />
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p className="font-medium mb-1">📝 After Payment:</p>
                <ol className="space-y-1 list-decimal list-inside">
                  {paymentMethod === "google_redeem" ? (
                    <>
                      <li>Enter the complete redeem code above</li>
                      <li>Submit your payment</li>
                      <li>Admin will verify the code and activate your subscription within 24 hours</li>
                    </>
                  ) : (
                    <>
                      <li>Take a screenshot of successful payment</li>
                      <li>Upload the screenshot above</li>
                      <li>Admin will verify within 24 hours (usually faster with AI!)</li>
                    </>
                  )}
                </ol>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || (paymentMethod === "google_redeem" ? !redeemCode : !screenshot)}
                className="w-full"
              >
                {loading ? (
                  "Submitting..."
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Payment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
