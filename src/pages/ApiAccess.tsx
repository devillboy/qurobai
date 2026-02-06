import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, Key, Copy, Eye, EyeOff, Trash2, Plus, 
  Code, Zap, Clock, BarChart3, ExternalLink, RefreshCw,
  Sparkles, Terminal, Shield, Rocket, CheckCircle2,
  AlertTriangle, Play, Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThreeDText } from "@/components/ThreeDText";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApiKey {
  id: string;
  key_preview: string;
  name: string;
  model: string;
  is_trial: boolean;
  trial_expires_at: string | null;
  requests_today: number;
  requests_month: number;
  total_requests: number;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
}

// API key limits per tier
const KEY_LIMITS = {
  free: { maxKeys: 2, models: ["qurob-2"], dailyLimit: 1000, monthlyLimit: 10000 },
  premium: { maxKeys: 5, models: ["qurob-2", "qurob-4"], dailyLimit: 10000, monthlyLimit: 100000 },
  q06: { maxKeys: 10, models: ["qurob-2", "qurob-4", "q-06"], dailyLimit: 50000, monthlyLimit: null },
};

export default function ApiAccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedModel, setSelectedModel] = useState("qurob-2");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);
  const [hasQ06, setHasQ06] = useState(false);
  const [userTier, setUserTier] = useState<"free" | "premium" | "q06">("free");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchApiKeys();
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(name, model_name)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("expires_at", nowIso);

      if (!error && data && data.length > 0) {
        const planNames = data.map(s => s.subscription_plans?.name?.toLowerCase() || "");
        if (planNames.some(n => n.includes("q-06") || n.includes("q06"))) {
          setHasQ06(true);
          setHasPremium(true);
          setUserTier("q06");
        } else if (planNames.some(n => n.includes("qurob 4") || n.includes("premium"))) {
          setHasPremium(true);
          setUserTier("premium");
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchApiKeys = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setApiKeys(data);
    }
    setLoading(false);
  };

  const getCurrentLimits = () => KEY_LIMITS[userTier];
  const canCreateMoreKeys = () => apiKeys.length < getCurrentLimits().maxKeys;
  const canSelectModel = (model: string) => getCurrentLimits().models.includes(model);

  const generateApiKey = async () => {
    if (!user) return;
    
    // Check key limits
    if (!canCreateMoreKeys()) {
      toast.error(`You've reached the maximum of ${getCurrentLimits().maxKeys} API keys for your plan.`);
      return;
    }

    // Check model access
    if (!canSelectModel(selectedModel)) {
      if (selectedModel === "qurob-4") {
        toast.error("Qurob 4 API requires Premium subscription.");
        navigate("/subscribe");
      } else if (selectedModel === "q-06") {
        toast.error("Q-06 API requires Q-06 subscription.");
        navigate("/subscribe");
      }
      return;
    }

    setCreating(true);

    try {
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const fullKey = "qai_" + Array.from(keyBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 48);

      const keyHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(fullKey)
      );
      const hashArray = Array.from(new Uint8Array(keyHash));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Trial only for free tier Qurob 2 keys
      const isTrial = userTier === "free" && selectedModel === "qurob-2";
      const trialExpiry = isTrial 
        ? new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          user_id: user.id,
          key_hash: hashHex,
          key_preview: fullKey.slice(0, 8) + "..." + fullKey.slice(-4),
          name: newKeyName || "My API Key",
          model: selectedModel,
          is_trial: isTrial,
          trial_expires_at: trialExpiry,
        })
        .select()
        .single();

      if (error) throw error;

      setNewlyCreatedKey(fullKey);
      setApiKeys([data, ...apiKeys]);
      setNewKeyName("");
      toast.success("API key created successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete API key");
    } else {
      setApiKeys(apiKeys.filter(k => k.id !== id));
      toast.success("API key deleted");
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard!");
  };

  const getDaysRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const testApiKey = async () => {
    if (!newlyCreatedKey) return;
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${newlyCreatedKey}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Hello! Say 'API working' in 5 words or less." }]
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data.message) {
        setTestResult(`✅ Success! Response: "${data.message.slice(0, 100)}..."`);
      } else {
        setTestResult(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (e) {
      setTestResult(`❌ Connection failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setTesting(false);
    }
  };

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-chat`;
  const limits = getCurrentLimits();

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <ScrollArea className="h-screen">
        <div className="p-4 md:p-6 pb-20">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/chat")} 
              className="mb-6 hover-lift"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {/* Premium Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Developer Tools</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                <ThreeDText as="span">API Access</ThreeDText>
              </h1>
              <p className="text-muted-foreground mt-2">
                Integrate QurobAi into your applications with our powerful API
              </p>
            </div>

            {/* Current Plan & Limits */}
            <Card className="mb-6 premium-card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardContent className="p-4 relative z-10">
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={userTier === "free" ? "secondary" : "default"} className="text-sm">
                      {userTier === "q06" ? "Q-06 Plan" : userTier === "premium" ? "Premium" : "Free Trial"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {apiKeys.length} / {limits.maxKeys} API Keys
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span>{limits.dailyLimit.toLocaleString()}/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span>{limits.monthlyLimit ? `${(limits.monthlyLimit / 1000)}K/mo` : "Unlimited"}</span>
                    </div>
                  </div>
                </div>
                <Progress value={(apiKeys.length / limits.maxKeys) * 100} className="mt-3 h-1.5" />
              </CardContent>
            </Card>

            <Tabs defaultValue="keys" className="space-y-6">
              <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
                <TabsTrigger value="keys" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Key className="w-4 h-4 mr-1.5" />
                  API Keys
                </TabsTrigger>
                <TabsTrigger value="docs" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Code className="w-4 h-4 mr-1.5" />
                  Documentation
                </TabsTrigger>
                <TabsTrigger value="pricing" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Zap className="w-4 h-4 mr-1.5" />
                  Pricing & Limits
                </TabsTrigger>
              </TabsList>

              <TabsContent value="keys" className="space-y-5">
                {/* Create New Key */}
                <Card className="premium-card overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary" />
                      Create New API Key
                    </CardTitle>
                    <CardDescription>
                      Generate a new API key ({apiKeys.length}/{limits.maxKeys} used)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    {!canCreateMoreKeys() && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription>
                          You've reached the maximum number of API keys for your plan. 
                          {userTier === "free" && " Upgrade to Premium for more keys."}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Key Name</Label>
                        <Input
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="My App API Key"
                          className="mt-1 bg-input/50"
                          disabled={!canCreateMoreKeys()}
                        />
                      </div>
                      <div>
                        <Label>Model</Label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-input/50 text-foreground"
                          disabled={!canCreateMoreKeys()}
                        >
                          <option value="qurob-2">Qurob 2 (Free Tier)</option>
                          <option value="qurob-4" disabled={!hasPremium}>
                            Qurob 4 (Premium) {!hasPremium && "🔒"}
                          </option>
                          <option value="q-06" disabled={!hasQ06}>
                            Q-06 (Code Specialist) {!hasQ06 && "🔒"}
                          </option>
                        </select>
                      </div>
                    </div>

                    {selectedModel === "qurob-4" && !hasPremium && (
                      <Alert className="animate-fade-in border-warning/30 bg-warning/10">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <AlertDescription className="text-sm">
                          <strong>Premium required</strong> - Qurob 4 API keys require an active Premium subscription (₹289/month).
                          <Button size="sm" className="ml-2" onClick={() => navigate("/subscribe")}>
                            Upgrade Now
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {selectedModel === "q-06" && !hasQ06 && (
                      <Alert className="animate-fade-in border-primary/30 bg-primary/10">
                        <Code className="w-4 h-4 text-primary" />
                        <AlertDescription className="text-sm">
                          <strong>Q-06 subscription required</strong> - Code specialist API keys require Q-06 plan (₹320/month).
                          <Button size="sm" className="ml-2" onClick={() => navigate("/subscribe")}>
                            Get Q-06
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      onClick={generateApiKey} 
                      disabled={creating || !canCreateMoreKeys() || !canSelectModel(selectedModel)} 
                      className="btn-premium"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {creating ? "Creating..." : "Generate API Key"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Newly Created Key */}
                {newlyCreatedKey && (
                  <Card className="border-2 border-primary glow animate-scale-in overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5" />
                    <CardHeader className="relative z-10">
                      <CardTitle className="text-lg flex items-center gap-2 text-primary">
                        <CheckCircle2 className="w-5 h-5" />
                        Your New API Key
                      </CardTitle>
                      <CardDescription className="text-warning">
                        ⚠️ Copy this key now! You won't be able to see it again.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-xl font-mono text-sm border border-border">
                        <span className="flex-1 break-all">
                          {showKey ? newlyCreatedKey : "•".repeat(48)}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)} className="shrink-0">
                          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => copyKey(newlyCreatedKey)} className="shrink-0">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Live Test Button */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={testApiKey}
                          disabled={testing}
                          className="gap-2"
                        >
                          {testing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Test API Key
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setNewlyCreatedKey(null)}
                        >
                          I've copied my key
                        </Button>
                      </div>

                      {testResult && (
                        <div className={`p-3 rounded-lg text-sm ${testResult.includes("✅") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {testResult}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Existing Keys */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Your API Keys</h3>
                    <Button variant="ghost" size="sm" onClick={fetchApiKeys} className="hover-lift">
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                      Refresh
                    </Button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                      Loading...
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <Card className="premium-card">
                      <CardContent className="py-12 text-center">
                        <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No API keys yet</p>
                        <p className="text-sm text-muted-foreground/70">Create one above to get started!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    apiKeys.map((key, index) => (
                      <Card key={key.id} className="premium-card animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{key.name}</span>
                                <Badge 
                                  variant={key.model === "qurob-4" ? "default" : key.model === "q-06" ? "secondary" : "outline"} 
                                  className="font-medium"
                                >
                                  {key.model === "qurob-4" ? "Qurob 4" : key.model === "q-06" ? "Q-06" : "Qurob 2"}
                                </Badge>
                                {key.is_trial && key.trial_expires_at && (
                                  <Badge variant="outline" className="gap-1">
                                    <Clock className="w-3 h-3" />
                                    {getDaysRemaining(key.trial_expires_at)} days left
                                  </Badge>
                                )}
                              </div>
                              <code className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                                {key.key_preview}
                              </code>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="w-3.5 h-3.5" />
                                  {key.total_requests.toLocaleString()} total
                                </span>
                                <span className="flex items-center gap-1">
                                  <Zap className="w-3.5 h-3.5" />
                                  {key.requests_today} today
                                </span>
                                {key.last_used_at && (
                                  <span>Last: {new Date(key.last_used_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteApiKey(key.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="docs" className="space-y-5">
                <Card className="premium-card overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-primary" />
                      Quick Start
                    </CardTitle>
                    <CardDescription>Get started with the QurobAi API in minutes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 relative z-10">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Base URL
                      </h4>
                      <div className="relative">
                        <code className="block p-4 bg-muted/50 rounded-xl text-sm font-mono border border-border overflow-x-auto">
                          {baseUrl}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-2 right-2"
                          onClick={() => copyKey(baseUrl)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Request Format</h4>
                      <pre className="p-4 bg-muted/50 rounded-xl text-sm overflow-x-auto border border-border font-mono">
{`POST /api-chat
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ]
}`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Response Format</h4>
                      <pre className="p-4 bg-muted/50 rounded-xl text-sm overflow-x-auto border border-border font-mono">
{`{
  "success": true,
  "message": "AI response here...",
  "model": "qurob-2",
  "usage": {
    "tokens_used": 150,
    "requests_today": 42,
    "requests_remaining": 958
  }
}`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">cURL Example</h4>
                      <pre className="p-4 bg-muted/50 rounded-xl text-sm overflow-x-auto border border-border font-mono">
{`curl -X POST \\
  ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer qai_your_key_here" \\
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">JavaScript/TypeScript</h4>
                      <pre className="p-4 bg-muted/50 rounded-xl text-sm overflow-x-auto border border-border font-mono">
{`const response = await fetch('${baseUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer qai_your_key_here'
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

const data = await response.json();
console.log(data.message);`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Python</h4>
                      <pre className="p-4 bg-muted/50 rounded-xl text-sm overflow-x-auto border border-border font-mono">
{`import requests

response = requests.post(
    '${baseUrl}',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer qai_your_key_here'
    },
    json={
        'messages': [{'role': 'user', 'content': 'Hello!'}]
    }
)

print(response.json()['message'])`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 text-destructive">Error Codes</h4>
                      <div className="grid gap-2">
                        {[
                          { code: "401", error: "UNAUTHORIZED / INVALID_KEY", desc: "Missing or invalid API key" },
                          { code: "403", error: "PAYMENT_REQUIRED", desc: "Premium subscription needed for Qurob 4" },
                          { code: "403", error: "TRIAL_EXPIRED", desc: "Free trial has ended" },
                          { code: "429", error: "RATE_LIMITED", desc: "Daily request limit exceeded" },
                          { code: "503", error: "SERVICE_UNAVAILABLE", desc: "AI service temporarily down" },
                        ].map((err, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg text-sm">
                            <Badge variant="outline" className="font-mono">{err.code}</Badge>
                            <code className="text-primary">{err.error}</code>
                            <span className="text-muted-foreground">{err.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-5">
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Free Tier */}
                  <Card className={`premium-card ${userTier === "free" ? "border-primary" : ""}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Free Trial</CardTitle>
                        {userTier === "free" && <Badge>Current</Badge>}
                      </div>
                      <CardDescription>Get started for free</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-3xl font-bold">₹0<span className="text-base font-normal text-muted-foreground">/month</span></div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Max 2 API keys
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Qurob 2 model only
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          1,000 requests/day
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          35 day trial
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Premium Tier */}
                  <Card className={`premium-card ${userTier === "premium" ? "border-primary" : ""}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Premium</CardTitle>
                        {userTier === "premium" && <Badge>Current</Badge>}
                      </div>
                      <CardDescription>For serious developers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-3xl font-bold">₹289<span className="text-base font-normal text-muted-foreground">/month</span></div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Max 5 API keys
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Qurob 2 + Qurob 4 models
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          10,000 requests/day
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          100K requests/month
                        </li>
                      </ul>
                      {userTier === "free" && (
                        <Button className="w-full mt-2" onClick={() => navigate("/subscribe")}>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Upgrade
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Q-06 Tier */}
                  <Card className={`premium-card ${userTier === "q06" ? "border-primary" : ""}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Q-06 Code</CardTitle>
                        {userTier === "q06" && <Badge>Current</Badge>}
                      </div>
                      <CardDescription>For professional coders</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-3xl font-bold">₹320<span className="text-base font-normal text-muted-foreground">/month</span></div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Max 10 API keys
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          All models (incl. Q-06)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          50,000 requests/day
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Unlimited monthly
                        </li>
                      </ul>
                      {!hasQ06 && (
                        <Button className="w-full mt-2" onClick={() => navigate("/subscribe")}>
                          <Code className="w-4 h-4 mr-2" />
                          Get Q-06
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Rate Limiting Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Daily Limits</h4>
                        <p className="text-muted-foreground">
                          Limits reset at midnight UTC. When you hit the limit, you'll receive a 429 error with 
                          the RATE_LIMITED code. The response includes an upgrade URL.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Monthly Limits</h4>
                        <p className="text-muted-foreground">
                          Monthly limits reset on your billing date. Premium users have 100K/month, 
                          Q-06 users have unlimited requests.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
