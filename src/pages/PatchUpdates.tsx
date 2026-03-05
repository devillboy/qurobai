import { ArrowLeft, Sparkles, Rocket, Calendar, Tag, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { useEffect } from "react";

const CURRENT_VERSION = "3.2.0";

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
    version: "3.2.0",
    date: "2026-03-05",
    title: "Experience Like Never Before",
    summary: "Complete platform redesign with professional polish, smoother animations, competitive chat design, and production-ready stability across every page.",
    type: "major",
    highlights: [
      "Complete auth page redesign — immersive welcome experience with brand tagline",
      "Professional splash screen with ambient glow effects",
      "Redesigned chat welcome with time-based greetings and card-grid actions",
      "Smoother animations and transitions across all pages",
      "Mobile-first 9:16 scaling with polished touch interactions",
      "Admin panel visual overhaul with better stat cards",
      "Fixed APK download functionality",
      "Settings dialog with clean tabbed interface",
      "Production-ready stability — all known bugs fixed",
    ],
  },
  {
    version: "3.0.0",
    date: "2026-03-02",
    title: "Ultimate System Upgrade",
    summary: "A complete platform overhaul — faster AI, custom assistants, professional UI, and search capabilities across the web.",
    type: "major",
    highlights: [
      "Web Search & Deep Search — find real-time info directly from chat",
      "Custom Qurobs — build and share your own AI assistants",
      "Professional splash screen with skip button",
      "Mobile UI polish — responsive header, better scaling",
      "Redesigned Settings with tabbed interface",
      "Daily token system — 50 free messages/day",
    ],
  },
  {
    version: "2.5.0",
    date: "2026-02-15",
    title: "Vision & Real-time Data",
    summary: "Upload images for AI analysis, generate artwork, and access live data for crypto, stocks, weather, news, and cricket.",
    type: "major",
    highlights: [
      "Vision AI — upload images for detailed analysis",
      "AI Image Generation",
      "Real-time crypto, stocks, weather, news, cricket",
      "Voice input support",
      "Projects & conversation organization",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-01-20",
    title: "API & Developer Tools",
    summary: "Developer-focused update bringing API access, subscription management, admin controls, and AI personalization.",
    type: "major",
    highlights: [
      "API Access for developers",
      "Subscription system with UPI payments",
      "Admin panel for platform management",
      "Personalization — tone, persona, custom instructions",
    ],
  },
  {
    version: "1.0.0",
    date: "2025-12-01",
    title: "Initial Launch",
    summary: "QurobAi goes live — India's AI companion with conversational AI, chat history, and a polished dark theme.",
    type: "major",
    highlights: [
      "AI chat with intelligent conversations",
      "Persistent conversation history",
      "Premium dark theme",
      "Mobile responsive design",
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
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/30">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">What's New</h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Changelog</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">v{CURRENT_VERSION}</Badge>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          {/* Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 mb-5 shadow-lg glow-sm">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
              <span className="text-gradient">QurobAi</span> Changelog
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              Every update, improvement, and new feature — built with care for you.
            </p>
          </motion.div>

          {/* Updates list — blog style */}
          <div className="space-y-6">
            {updates.map((update, index) => (
              <motion.article 
                key={update.version}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                  index === 0 
                    ? "border-primary/20 bg-gradient-to-br from-card to-card/80 shadow-xl shadow-primary/5" 
                    : "border-border/40 bg-card/50 hover:border-border/60"
                }`}
              >
                <div className="p-5 md:p-7">
                  {/* Meta */}
                  <div className="flex items-center flex-wrap gap-2 mb-4">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="text-[10px] font-mono">
                      v{update.version}
                    </Badge>
                    {index === 0 && (
                      <Badge className="text-[10px] bg-primary/15 text-primary border-0">
                        ✨ Latest
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                      <Calendar className="w-3 h-3" />
                      {new Date(update.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight">{update.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{update.summary}</p>

                  {/* Highlights */}
                  <div className="space-y-2">
                    {update.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm group">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 shrink-0 group-hover:bg-primary transition-colors" />
                        <span className="text-foreground/80 group-hover:text-foreground transition-colors">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-14 pb-10">
            <p className="text-xs text-muted-foreground/50">
              Built with ❤️ by Soham from India 🇮🇳
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
