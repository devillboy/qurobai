import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Smartphone, Apple, Shield, Zap, MessageCircle, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { toast } from "sonner";
import qurobLogo from "@/assets/qurob-logo.png";

export default function DownloadPage() {
  const navigate = useNavigate();

  const features = [
    { icon: BadgeCheck, label: "Qurob Chat", desc: "Advanced assistant at your fingertips" },
    { icon: Zap, label: "Real-time", desc: "Weather, crypto, stocks & more" },
    { icon: MessageCircle, label: "Voice", desc: "Speak to AI with voice input" },
    { icon: Shield, label: "Secure", desc: "Encrypted conversations always" },
  ];

  const handleDownload = () => {
    try {
      const link = document.createElement("a");
      link.href = "/downloads/qurobai.apk";
      link.download = "QurobAi.apk";
      link.setAttribute("type", "application/vnd.android.package-archive");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started! Check your notifications bar.");
    } catch (e) {
      // Fallback: open in new tab
      window.open("/downloads/qurobai.apk", "_blank");
      toast.info("If download didn't start, check your browser's download folder.");
    }
  };

  return (
    <>
      <SEOHead title="Download QurobAi App" description="Download QurobAi for Android. India's premier AI assistant." />
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Ambient */}
        <div className="absolute top-[-20%] left-[20%] w-[400px] h-[400px] bg-primary/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[10%] w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-lg mx-auto p-5 sm:p-8 pt-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <img src={qurobLogo} alt="QurobAi" className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-2xl glow-sm" />
            <h1 className="text-3xl font-bold mb-1 tracking-tight">Download QurobAi</h1>
            <p className="text-muted-foreground text-sm">India's AI Companion — on your phone</p>
          </motion.div>

          {/* Android Download */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="mb-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-1">Android</h2>
                <p className="text-sm text-muted-foreground mb-5">APK • Works on Android 7+</p>
                <Button size="lg" className="gap-2 w-full max-w-xs rounded-xl shadow-lg shadow-primary/20 btn-premium" onClick={handleDownload}>
                  <Download className="w-5 h-5" />
                  Download APK
                </Button>
                <p className="text-[11px] text-muted-foreground/60 mt-3">v3.2 • ~15MB</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* iOS */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="mb-8 opacity-50 border-border/30">
              <CardContent className="p-5 text-center">
                <Apple className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <h2 className="text-lg font-semibold mb-1">iOS</h2>
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-2 gap-2.5 mb-8">
              {features.map((f, i) => (
                <Card key={i} className="border-border/30 hover:border-primary/20 transition-colors">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <f.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="font-medium text-sm">{f.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Install Guide */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-border/30">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  📲 Installation Guide
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  {[
                    ["Tap ", "Download APK", " above"],
                    ["Open the downloaded file from ", "notifications", ""],
                    ["If prompted, allow ", '"Install from unknown sources"', ""],
                    ["Tap ", "Install", " and open QurobAi!"],
                  ].map(([pre, bold, post], i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span>{pre}<strong className="text-foreground">{bold}</strong>{post}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
