import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Upload, Check, Sparkles } from "lucide-react";
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
      // Upload screenshot
      const fileName = `${user?.id}/${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(fileName);

      const finalPrice = selectedPlan.price_inr * (1 - discount / 100);

      // Create payment record
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

      // Update coupon usage
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
  if (!premiumPlan) return null;

  const finalPrice = premiumPlan.price_inr * (1 - discount / 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/90 p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Upgrade to Qurob 4
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Unlock the most advanced AI model with premium features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2">
            <CardHeader>
              <Badge className="w-fit mb-2">Current Plan</Badge>
              <CardTitle>Qurob 2</CardTitle>
              <CardDescription>Free forever</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Basic AI responses
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Standard speed
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Community support
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-bold">
              PREMIUM
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Qurob 4</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">₹{Math.round(finalPrice)}</span>
                {discount > 0 && (
                  <span className="ml-2 line-through text-muted-foreground">
                    ₹{premiumPlan.price_inr}
                  </span>
                )}
                <span className="text-sm"> / month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <strong>Advanced AI responses</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <strong>Best answers & reasoning</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Faster processing
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complete Your Purchase</CardTitle>
            <CardDescription>
              Pay via UPI and upload screenshot for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Coupon Code (Optional)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                />
                <Button onClick={validateCoupon} variant="outline">
                  Apply
                </Button>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg space-y-2">
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
                    className="mt-4 rounded-lg border max-w-md"
                  />
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !screenshot}
              className="w-full"
              size="lg"
            >
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Payment for Approval
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
