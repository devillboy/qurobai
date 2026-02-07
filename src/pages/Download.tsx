import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Smartphone, Apple, Shield, Zap, Brain, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";

export default function DownloadPage() {
  const navigate = useNavigate();

  const features = [
    { icon: Brain, label: "AI Chat", desc: "Talk to Qurob 2 & Qurob 4 AI models" },
    { icon: Zap, label: "Real-time Data", desc: "Weather, crypto, stocks, news & more" },
    { icon: MessageCircle, label: "Voice Mode", desc: "Speak to AI with voice input" },
    { icon: Shield, label: "Secure", desc: "End-to-end encrypted conversations" },
  ];

  return (
    <>
      <SEOHead title="Download QurobAi App" description="Download QurobAi for Android. India's premier AI assistant." />
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">Q</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Download QurobAi</h1>
            <p className="text-muted-foreground">India's AI Companion – on your phone</p>
          </div>

          {/* Android Download */}
          <Card className="mb-4 border-primary/20 bg-primary/5">
            <CardContent className="p-6 text-center">
              <Smartphone className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-1">Android</h2>
              <p className="text-sm text-muted-foreground mb-4">APK • Works on Android 7+</p>
              <a href="/downloads/qurobai.apk" download>
                <Button size="lg" className="gap-2 w-full max-w-xs">
                  <Download className="w-5 h-5" />
                  Download APK
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* iOS Coming Soon */}
          <Card className="mb-8 opacity-60">
            <CardContent className="p-6 text-center">
              <Apple className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-1">iOS</h2>
              <Badge variant="secondary">Coming Soon</Badge>
            </CardContent>
          </Card>

          {/* Features */}
          <h3 className="font-semibold mb-4 text-center">App Features</h3>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map((f, i) => (
              <Card key={i}>
                <CardContent className="p-4 text-center">
                  <f.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="font-medium text-sm">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Install Instructions */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">📲 Installation Guide</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Tap <strong>Download APK</strong> above</li>
                <li>Open the downloaded file</li>
                <li>If prompted, allow "Install from unknown sources" in Settings</li>
                <li>Tap <strong>Install</strong> and wait</li>
                <li>Open QurobAi and sign in!</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
