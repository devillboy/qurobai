import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Upload, Check, Sparkles, Code, Zap, Brain, Smartphone, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [upiId] = useState("7864084241@ybl");

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

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    toast.success("UPI ID copied!");
  };

  const openUpiApp = () => {
    if (!selectedPlan) return;
    const finalPrice = Math.round(selectedPlan.price_inr * (1 - discount / 100));
    const upiLink = `upi://pay?pa=${upiId}&pn=QurobAi&am=${finalPrice}&cu=INR&tn=QurobAi%20${selectedPlan.name}%20Subscription`;
    window.location.href = upiLink;
  };

  const handleSubmit = async () => {
    if (!screenshot) {
      toast.error("Please upload payment screenshot");
      return;
    }

    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    setLoading(true);

    try {
      const fileName = `${user?.id}/${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(fileName);

      const finalPrice = selectedPlan.price_inr * (1 - discount / 100);

      const { error: insertError } = await supabase
        .from("payment_screenshots")
        .insert({
          user_id: user?.id,
          plan_id: selectedPlan.id,
          screenshot_url: urlData.publicUrl,
          amount_paid: Math.round(finalPrice),
          coupon_code: couponCode || null,
        });

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

      toast.success("Payment submitted! Waiting for admin approval.");
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
                Pay via UPI and upload screenshot for verification
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

              {/* UPI Payment */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <Label className="font-medium">Payment Instructions</Label>
                
                <div className="flex items-center gap-2 p-3 bg-background rounded border">
                  <span className="text-sm">UPI ID:</span>
                  <code className="font-mono text-primary flex-1">{upiId}</code>
                  <Button variant="ghost" size="sm" onClick={copyUpiId}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">₹{Math.round(finalPrice)}</div>
                  {discount > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <span className="line-through">₹{selectedPlan.price_inr}</span> • {discount}% off
                    </div>
                  )}
                </div>

                <Button onClick={openUpiApp} variant="outline" className="w-full">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Open UPI App
                </Button>

                <ol className="text-xs text-muted-foreground space-y-1">
                  <li>1. Pay ₹{Math.round(finalPrice)} to UPI ID above</li>
                  <li>2. Take a screenshot of payment confirmation</li>
                  <li>3. Upload the screenshot below</li>
                  <li>4. Admin will verify within 24 hours</li>
                </ol>
              </div>

              {/* Screenshot Upload */}
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

              <Button
                onClick={handleSubmit}
                disabled={loading || !screenshot}
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
