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
  Sparkles, Terminal, Shield, Rocket, CheckCircle2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThreeDText } from "@/components/ThreeDText";

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

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchApiKeys();
    checkPremium();
  }, [user]);

  const checkPremium = async () => {
    if (!user) return;
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("expires_at", nowIso)
        .limit(1);

      if (!error) setHasPremium(Boolean(data && data.length > 0));
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

  const generateApiKey = async () => {
    if (!user) return;
    if (selectedModel === "qurob-4" && !hasPremium) {
      toast.error("Qurob 4 API unlock karne ke liye pehle Premium subscription chahiye.");
      navigate("/subscribe");
      return;
    }
    setCreating(true);

    try {
      // Generate a random API key
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const fullKey = "qai_" + Array.from(keyBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 48);

      // Create hash for storage
      const keyHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(fullKey)
      );
      const hashArray = Array.from(new Uint8Array(keyHash));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Calculate trial expiry (35 days for free)
      const trialExpiry = selectedModel === "qurob-2" 
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
          is_trial: selectedModel === "qurob-2",
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

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-chat`;

  return (
    <div className="min-h-screen bg-background gradient-mesh p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/chat")} className="mb-6 hover-lift">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
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

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
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
              Pricing
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
                <CardDescription>Generate a new API key for your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Key Name</Label>
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="My App API Key"
                      className="mt-1 bg-input/50"
                    />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-input/50 text-foreground"
                    >
                      <option value="qurob-2">Qurob 2 (Free Trial - 35 days)</option>
                      <option value="qurob-4">Qurob 4 (Premium - ₹1789/year)</option>
                    </select>
                  </div>
                </div>

                {selectedModel === "qurob-4" && !hasPremium && (
                  <div className="p-4 rounded-xl border border-warning/30 bg-warning/10 animate-fade-in">
                    <p className="text-sm text-foreground font-medium">Premium required</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Qurob 4 API key generate karne se pehle premium subscription activate hona chahiye.
                    </p>
                    <Button className="mt-3 btn-premium" onClick={() => navigate("/subscribe")}>
                      Unlock via Payment
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
                <Button onClick={generateApiKey} disabled={creating} className="btn-premium">
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
                <CardContent className="relative z-10">
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
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setNewlyCreatedKey(null)}
                  >
                    I've copied my key
                  </Button>
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
                            <Badge variant={key.model === "qurob-4" ? "default" : "secondary"} className="font-medium">
                              {key.model === "qurob-4" ? "Qurob 4" : "Qurob 2"}
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
                              {key.total_requests.toLocaleString()} requests
                            </span>
                            {key.last_used_at && (
                              <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
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
                  <h4 className="font-semibold mb-2">cURL Example</h4>
                  <pre className="p-4 bg-muted/50 rounded-xl text-sm overflow-x-auto border border-border font-mono">
{`curl -X POST \\
  ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">JavaScript Example</h4>
                  <pre className="p-4 bg-muted/50 rounded-xl text-sm overflow-x-auto border border-border font-mono">
{`const response = await fetch(
  '${baseUrl}',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Hello!' }]
    })
  }
);

const data = await response.json();
console.log(data.message);`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Python Example</h4>
                  <pre className="p-4 bg-muted/50 rounded-xl text-sm overflow-x-auto border border-border font-mono">
{`import requests

response = requests.post(
    '${baseUrl}',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    json={
        'messages': [{'role': 'user', 'content': 'Hello!'}]
    }
)

print(response.json()['message'])`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Response Format</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted/50 rounded-xl text-sm overflow-x-auto border border-border font-mono">
{`{
  "success": true,
  "message": "AI response text here",
  "model": "qurob-2",
  "usage": {
    "tokens_used": 150,
    "requests_today": 42,
    "requests_remaining": 958
  }
}`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="premium-card overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent" />
                <CardHeader className="relative z-10">
                  <Badge className="w-fit mb-2" variant="secondary">Free Trial</Badge>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Qurob 2 API
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold text-foreground mt-2">
                    ₹0<span className="text-sm font-normal text-muted-foreground ml-1">/ 35 days</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-2.5 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Fast AI responses
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      1000 requests/day
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Basic chat capabilities
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      35-day free trial
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="premium-card overflow-hidden border-2 border-primary relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5" />
                <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                  RECOMMENDED
                </div>
                <CardHeader className="relative z-10">
                  <Badge className="w-fit mb-2">Premium</Badge>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Qurob 4 API
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold text-foreground mt-2">
                    ₹1789<span className="text-sm font-normal text-muted-foreground ml-1">/ 12 months</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-2.5 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Advanced AI model
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <strong>Unlimited requests</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Priority processing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Code specialist access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      12 months validity
                    </li>
                  </ul>
                  <Button className="w-full mt-5 btn-premium" onClick={() => navigate("/subscribe")}>
                    Subscribe Now
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
