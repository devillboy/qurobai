import { ArrowLeft, Sparkles, Bug, Zap, Globe, Search, Bot, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useEffect } from "react";

const CURRENT_VERSION = "3.0.0";

interface Update {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  type: "major" | "minor" | "patch";
  icon: React.ElementType;
}

const updates: Update[] = [
  {
    version: "3.0.0",
    date: "2026-03-02",
    title: "Ultimate System Upgrade",
    type: "major",
    icon: Sparkles,
    highlights: [
      "🚀 Switched to Google Gemini API directly — faster, more reliable AI",
      "🔍 Web Search & Deep Search powered by Serper.dev",
      "🤖 Custom Qurobs — create your own AI assistants (like ChatGPT GPTs)",
      "🔒 Encryption indicator — TLS lock icon in chat header",
      "⚡ Professional splash screen with skip button",
      "📱 Mobile UI polish — header on all screens, better scaling",
      "🎨 Settings redesigned with tabbed interface",
      "📊 Daily token system — 50 free messages/day",
      "🛠️ Fixed login errors with better network handling",
      "📋 This Patch Updates page!",
    ],
  },
  {
    version: "2.5.0",
    date: "2026-02-15",
    title: "Vision & Real-time Data",
    type: "major",
    icon: Globe,
    highlights: [
      "👁️ Vision AI — upload images for analysis",
      "🎨 Image Generation via Fireworks AI",
      "📈 Real-time crypto, stocks, weather, news, cricket",
      "🗣️ Voice input support",
      "📂 Projects & conversation organization",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-01-20",
    title: "API & Developer Tools",
    type: "major",
    icon: Zap,
    highlights: [
      "🔑 API Access for developers",
      "💳 Subscription system with UPI payments",
      "👑 Admin panel for management",
      "🎭 Personalization — tone, persona, custom instructions",
    ],
  },
  {
    version: "1.0.0",
    date: "2025-12-01",
    title: "Initial Launch",
    type: "major",
    icon: Bot,
    highlights: [
      "🤖 AI chat with Qurob 2 model",
      "💬 Conversation history",
      "🌙 Dark theme",
      "📱 Mobile responsive design",
    ],
  },
];

export default function PatchUpdates() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("qurobai_last_seen_version", CURRENT_VERSION);
  }, []);

  return (
    <>
      <SEOHead title="Patch Updates" description="See what's new in QurobAi — latest features, fixes, and improvements." />
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">What's New</h1>
            <p className="text-muted-foreground text-sm">Latest updates and improvements to QurobAi</p>
          </div>

          <div className="space-y-6">
            {updates.map((update, index) => (
              <Card key={update.version} className={index === 0 ? "border-primary/30 bg-primary/5" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${index === 0 ? "bg-primary/20" : "bg-muted"}`}>
                      <update.icon className={`w-5 h-5 ${index === 0 ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{update.title}</span>
                        <Badge variant={index === 0 ? "default" : "secondary"} className="text-[10px]">
                          v{update.version}
                        </Badge>
                        {index === 0 && <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Latest</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(update.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {update.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{h}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
