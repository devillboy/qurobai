import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Sparkles, Code, Zap, Shield, Globe, 
  Brain, ArrowRight, MessageSquare, Check, 
  Search, Image, Mic, ChevronRight, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";

// Perplexity-inspired animated mesh gradient
const MeshGradient = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "2s" }} />
  </div>
);

// Typing animation for hero
const TypingAnimation = () => {
  const examples = [
    "Write a React component...",
    "Explain quantum computing...",
    "What's the weather in Delhi?",
    "Debug this JavaScript code...",
    "Generate an image of sunset...",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const text = examples[currentIndex];
    const typeSpeed = isDeleting ? 30 : 50;
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < text.length) {
          setDisplayText(text.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % examples.length);
        }
      }
    }, typeSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentIndex]);

  return (
    <span className="text-muted-foreground">
      {displayText}
      <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
    </span>
  );
};

// Feature card with micro-interactions
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: { icon: any; title: string; description: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="group p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </motion.div>
);

// Stats counter
const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <SEOHead />
      
      {/* Navigation - Perplexity style */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">QurobAi</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Perplexity inspired */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <MeshGradient />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-2 rounded-full text-sm text-primary mb-8 backdrop-blur-sm">
              <Star className="w-4 h-4 fill-primary" />
              India's Premier AI Assistant
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          >
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              Ask Anything.
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Get Answers.
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Your intelligent AI companion for coding, creating, and solving problems. 
            Real-time data, code expertise, and natural conversations.
          </motion.p>

          {/* Perplexity-style search input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <Link to="/auth">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl opacity-30 group-hover:opacity-50 blur-lg transition-opacity" />
                <div className="relative flex items-center gap-3 bg-card border border-border/50 rounded-2xl px-4 py-4 shadow-xl group-hover:border-primary/30 transition-colors cursor-pointer">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <TypingAnimation />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Image className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Mic className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm text-muted-foreground"
          >
            Free to use • No credit card required • Created by Soham 🇮🇳
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 border-y border-border/50 bg-card/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value="10K+" label="Active Users" />
          <StatCard value="1M+" label="Messages" />
          <StatCard value="99.9%" label="Uptime" />
          <StatCard value="<1s" label="Response Time" />
        </div>
      </section>

      {/* Features Grid - Perplexity style */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need in one AI
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Powered by state-of-the-art AI models with real-time knowledge
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard 
              icon={Brain} 
              title="Intelligent Chat" 
              description="Natural conversations with deep understanding and thoughtful responses."
              delay={0.1}
            />
            <FeatureCard 
              icon={Code} 
              title="Code Expert" 
              description="Write, debug, and explain code in 100+ programming languages."
              delay={0.15}
            />
            <FeatureCard 
              icon={Globe} 
              title="Real-time Data" 
              description="Weather, stocks, crypto, news, and cricket scores instantly."
              delay={0.2}
            />
            <FeatureCard 
              icon={Zap} 
              title="Lightning Fast" 
              description="Instant responses powered by advanced AI infrastructure."
              delay={0.25}
            />
            <FeatureCard 
              icon={Shield} 
              title="Private & Secure" 
              description="Your conversations are encrypted and protected."
              delay={0.3}
            />
            <FeatureCard 
              icon={MessageSquare} 
              title="Vision AI" 
              description="Upload images for analysis, description, and insights."
              delay={0.35}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section - Claude style */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Start free, upgrade when you need more</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <h3 className="font-semibold text-xl mb-2">Qurob 2</h3>
              <div className="text-4xl font-bold mb-1">₹0<span className="text-base font-normal text-muted-foreground">/month</span></div>
              <p className="text-sm text-muted-foreground mb-8">Perfect for getting started</p>
              <ul className="space-y-4 text-sm mb-8">
                {["Fast AI responses", "Real-time data access", "Web search", "Image analysis", "Unlimited chats"].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full rounded-xl h-12">
                  Get Started Free
                </Button>
              </Link>
            </motion.div>
            
            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-2xl border-2 border-primary bg-gradient-to-br from-card to-primary/5 shadow-xl shadow-primary/10"
            >
              <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="font-semibold text-xl mb-2 mt-2">Qurob 4</h3>
              <div className="text-4xl font-bold mb-1">₹289<span className="text-base font-normal text-muted-foreground">/month</span></div>
              <p className="text-sm text-muted-foreground mb-8">For power users</p>
              <ul className="space-y-4 text-sm mb-8">
                {["Advanced 70B AI Model", "Q-06 Code Specialist", "Image generation", "Priority support", "All Qurob 2 features"].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className={feature.includes("Q-06") ? "font-medium text-primary" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="block">
                <Button className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  Upgrade to Premium <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <MeshGradient />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to experience the future?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who trust QurobAi every day.
          </p>
          <Link to="/auth">
            <Button size="lg" className="px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
              Start Chatting <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">QurobAi</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/security" className="hover:text-foreground transition-colors">Security</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 QurobAi. Created by Soham 🇮🇳
          </p>
        </div>
      </footer>
    </div>
  );
};
