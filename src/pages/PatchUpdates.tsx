import { ArrowLeft, Sparkles, Zap, Globe, Bot, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useEffect } from "react";

const CURRENT_VERSION = "3.0.0";

interface Update {
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: string[];
  type: "major" | "minor" | "patch";
}

const updates: Update[] = [
  {
    version: "3.0.0",
    date: "2026-03-02",
    title: "Ultimate System Upgrade",
    summary: "A complete platform overhaul — faster AI, custom assistants, professional UI, and search capabilities across the web.",
    type: "major",
    highlights: [
      "🔍 Web Search & Deep Search — find real-time info directly from chat",
      "🤖 Custom Qurobs — build and share your own AI assistants",
      "🔒 Encryption indicators — TLS lock icon in chat header",
      "⚡ Professional splash screen with skip button",
      "📱 Mobile UI polish — responsive header, better button scaling",
      "🎨 Redesigned Settings with tabbed interface",
      "📊 Daily token system — 50 free messages/day",
      "🛠️ Improved login error handling with network detection",
      "📋 This Patch Updates page!",
    ],
  },
  {
    version: "2.5.0",
    date: "2026-02-15",
    title: "Vision & Real-time Data",
    summary: "Upload images for AI analysis, generate artwork, and access live data for crypto, stocks, weather, news, and cricket.",
    type: "major",
    highlights: [
      "👁️ Vision AI — upload images for detailed analysis",
      "🎨 AI Image Generation",
      "📈 Real-time crypto, stocks, weather, news, cricket",
      "🗣️ Voice input support",
      "📂 Projects & conversation organization",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-01-20",
    title: "API & Developer Tools",
    summary: "Developer-focused update bringing API access, subscription management, admin controls, and AI personalization.",
    type: "major",
    highlights: [
      "🔑 API Access for developers",
      "💳 Subscription system with UPI payments",
      "👑 Admin panel for platform management",
      "🎭 Personalization — tone, persona, custom instructions",
    ],
  },
  {
    version: "1.0.0",
    date: "2025-12-01",
    title: "Initial Launch",
    summary: "QurobAi goes live — India's AI companion with conversational AI, chat history, and a polished dark theme.",
    type: "major",
    highlights: [
      "🤖 AI chat with intelligent conversations",
      "💬 Persistent conversation history",
      "🌙 Premium dark theme",
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
      <SEOHead title="What's New — QurobAi" description="See what's new in QurobAi — latest features, fixes, and improvements." />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">What's New</h1>
              <p className="text-xs text-muted-foreground">Changelog & updates</p>
            </div>
            <Badge variant="outline" className="text-xs">v{CURRENT_VERSION}</Badge>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-4 py-8">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <Rocket className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">QurobAi Changelog</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Every update, improvement, and new feature — documented with care.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-8 bottom-8 w-[2px] bg-border hidden md:block" />

            <div className="space-y-8">
              {updates.map((update, index) => (
                <article key={update.version} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute left-[12px] top-6 w-[16px] h-[16px] rounded-full border-2 hidden md:block ${
                    index === 0 ? "bg-primary border-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]" : "bg-muted border-border"
                  }`} />

                  <div className={`md:ml-12 rounded-2xl border overflow-hidden transition-colors ${
                    index === 0 ? "border-primary/20 bg-card shadow-lg shadow-primary/5" : "border-border bg-card/50"
                  }`}>
                    {/* Post Header */}
                    <div className="p-5 md:p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={index === 0 ? "default" : "secondary"} className="text-[10px]">
                          v{update.version}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                            Latest
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(update.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold mb-2">{update.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{update.summary}</p>

                      {/* Highlights */}
                      <div className="space-y-2.5">
                        {update.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                            <span className="text-foreground/80">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pb-8">
            <p className="text-xs text-muted-foreground">
              Built with ❤️ by Soham from India 🇮🇳
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
