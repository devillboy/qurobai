import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Upload, Check, Sparkles, Code, Zap, Brain } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-background to-background/90 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 md:mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>

        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-6 md:w-8 h-6 md:h-8 text-primary animate-pulse" />
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Upgrade Your AI
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-lg">
            Choose the plan that fits your needs
          </p>
        </div>

        {/* Plan Cards - 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Free Plan */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <Badge className="w-fit mb-2" variant="secondary">Current Plan</Badge>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-xl">Qurob 2</CardTitle>
              </div>
              <CardDescription className="text-2xl font-bold text-foreground">
                ₹0<span className="text-sm font-normal text-muted-foreground"> / forever</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Basic AI responses
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Real-time data access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Weather, crypto, news
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
            className={`border-2 relative overflow-hidden cursor-pointer transition-all ${
              selectedPlan?.name === "Premium" 
                ? "border-primary ring-2 ring-primary/20" 
                : "hover:border-primary/50"
            }`}
            onClick={() => premiumPlan && setSelectedPlan(premiumPlan)}
          >
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">
              POPULAR
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Qurob 4</CardTitle>
              </div>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">
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
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Deep analysis & research
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  Enhanced code help
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Q-06 Code Specialist Plan */}
          <Card 
            className={`border-2 relative overflow-hidden cursor-pointer transition-all ${
              selectedPlan?.name === "Code Specialist" 
                ? "border-purple-500 ring-2 ring-purple-500/20" 
                : "hover:border-purple-500/50"
            }`}
            onClick={() => codePlan && setSelectedPlan(codePlan)}
          >
            <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 text-xs font-bold">
              CODE EXPERT
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-500" />
                <CardTitle className="text-xl bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Q-06
                </CardTitle>
              </div>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">
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
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  <strong>Expert-level coding</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  <strong>100+ languages</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  Clean modular code
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  Architecture design
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  Debug & optimization
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Form */}
        {selectedPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedPlan.name === "Code Specialist" ? (
                  <Code className="w-5 h-5 text-purple-500" />
                ) : (
                  <Brain className="w-5 h-5 text-primary" />
                )}
                Complete Your Purchase - {selectedPlan.name === "Code Specialist" ? "Q-06" : selectedPlan.name}
              </CardTitle>
              <CardDescription>
                Pay via UPI and upload screenshot for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div>
                <Label>Coupon Code (Optional)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1"
                  />
                  <Button onClick={validateCoupon} variant="outline">
                    Apply
                  </Button>
                </div>
              </div>

              <div className={`p-4 rounded-lg space-y-2 ${
                selectedPlan.name === "Code Specialist" 
                  ? "bg-purple-500/10 border border-purple-500/20" 
                  : "bg-primary/10"
              }`}>
                <Label className="text-lg font-semibold">Payment Instructions</Label>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Pay <strong>₹{Math.round(finalPrice)}</strong> to UPI ID: <strong className="font-mono">7864084241@ybl</strong></li>
                  <li>Take a screenshot of the payment confirmation</li>
                  <li>Upload the screenshot below</li>
                  <li>Wait for admin approval (usually within 24 hours)</li>
                </ol>
              </div>

              <div>
                <Label>Upload Payment Screenshot</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Payment screenshot"
                      className="mt-4 rounded-lg border max-w-full md:max-w-md"
                    />
                  )}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || !screenshot}
                className={`w-full ${
                  selectedPlan.name === "Code Specialist"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    : ""
                }`}
                size="lg"
              >
                {loading ? (
                  "Submitting..."
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Payment for {selectedPlan.name === "Code Specialist" ? "Q-06" : selectedPlan.name}
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
