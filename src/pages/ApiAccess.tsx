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
  Code, Zap, Clock, BarChart3, ExternalLink, RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchApiKeys();
  }, [user]);

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
    setCreating(true);

    try {
      // Generate a random API key
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const fullKey = "qai_" + Array.from(keyBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 48);

      // Create hash for storage (simple hash for demo)
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
      toast.success("API key created!");
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/chat")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Code className="w-6 h-6 text-primary" />
            API Access
          </h1>
          <p className="text-muted-foreground mt-1">
            Use QurobAi in your own applications
          </p>
        </div>

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="keys">
              <Key className="w-4 h-4 mr-1" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="docs">
              <Code className="w-4 h-4 mr-1" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <Zap className="w-4 h-4 mr-1" />
              Pricing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4">
            {/* Create New Key */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create API Key</CardTitle>
                <CardDescription>Generate a new API key for your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Key Name</Label>
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="My App API Key"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="qurob-2">Qurob 2 (Free Trial - 35 days)</option>
                      <option value="qurob-4">Qurob 4 (Premium - ₹1789/year)</option>
                    </select>
                  </div>
                </div>
                <Button onClick={generateApiKey} disabled={creating}>
                  <Plus className="w-4 h-4 mr-2" />
                  {creating ? "Creating..." : "Create API Key"}
                </Button>
              </CardContent>
            </Card>

            {/* Newly Created Key */}
            {newlyCreatedKey && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">🎉 Your New API Key</CardTitle>
                  <CardDescription>
                    Copy this key now! You won't be able to see it again.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                    <span className="flex-1 break-all">
                      {showKey ? newlyCreatedKey : "•".repeat(40)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => copyKey(newlyCreatedKey)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-3"
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
                <h3 className="font-medium">Your API Keys</h3>
                <Button variant="ghost" size="sm" onClick={fetchApiKeys}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No API keys yet. Create one above!
                </div>
              ) : (
                apiKeys.map((key) => (
                  <Card key={key.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{key.name}</span>
                            <Badge variant={key.model === "qurob-4" ? "default" : "secondary"}>
                              {key.model === "qurob-4" ? "Qurob 4" : "Qurob 2"}
                            </Badge>
                            {key.is_trial && key.trial_expires_at && (
                              <Badge variant="outline">
                                <Clock className="w-3 h-3 mr-1" />
                                {getDaysRemaining(key.trial_expires_at)} days left
                              </Badge>
                            )}
                          </div>
                          <code className="text-sm text-muted-foreground font-mono">
                            {key.key_preview}
                          </code>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {key.total_requests.toLocaleString()} total requests
                            </span>
                            {key.last_used_at && (
                              <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
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

          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>Get started with the QurobAi API in minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Base URL</h4>
                  <code className="block p-3 bg-muted rounded-lg text-sm">
                    https://fstxrxojxnziuqqceobd.supabase.co/functions/v1/api-chat
                  </code>
                </div>

                <div>
                  <h4 className="font-medium mb-2">cURL Example</h4>
                  <pre className="p-3 bg-muted rounded-lg text-sm overflow-x-auto">
{`curl -X POST \\
  https://fstxrxojxnziuqqceobd.supabase.co/functions/v1/api-chat \\
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
                  <h4 className="font-medium mb-2">JavaScript Example</h4>
                  <pre className="p-3 bg-muted rounded-lg text-sm overflow-x-auto">
{`const response = await fetch(
  'https://fstxrxojxnziuqqceobd.supabase.co/functions/v1/api-chat',
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
                  <h4 className="font-medium mb-2">Python Example</h4>
                  <pre className="p-3 bg-muted rounded-lg text-sm overflow-x-auto">
{`import requests

response = requests.post(
    'https://fstxrxojxnziuqqceobd.supabase.co/functions/v1/api-chat',
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

            <Card>
              <CardHeader>
                <CardTitle>Response Format</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-3 bg-muted rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "AI response text here",
  "model": "qurob-2",
  "usage": {
    "tokens_used": 150
  }
}`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardHeader>
                  <Badge className="w-fit mb-2" variant="secondary">Free Trial</Badge>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Qurob 2 API
                  </CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">₹0</span>
                    <span className="text-sm"> / 35 days trial</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">✓ Fast AI responses</li>
                    <li className="flex items-center gap-2">✓ 1000 requests/day</li>
                    <li className="flex items-center gap-2">✓ Basic chat capabilities</li>
                    <li className="flex items-center gap-2">✓ 35-day free trial</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary">
                <CardHeader>
                  <Badge className="w-fit mb-2">Premium</Badge>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Qurob 4 API
                  </CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">₹1789</span>
                    <span className="text-sm"> / 12 months</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">✓ Advanced AI model</li>
                    <li className="flex items-center gap-2">✓ Unlimited requests</li>
                    <li className="flex items-center gap-2">✓ Priority processing</li>
                    <li className="flex items-center gap-2">✓ Code specialist access</li>
                    <li className="flex items-center gap-2">✓ 12 months validity</li>
                  </ul>
                  <Button className="w-full mt-4" onClick={() => navigate("/subscribe")}>
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
