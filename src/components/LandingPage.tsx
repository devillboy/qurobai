import { Link } from "react-router-dom";
import { 
  Sparkles, Code, Zap, Shield, Globe, 
  Brain, ArrowRight, MessageSquare, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">QurobAi</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-2 rounded-full text-sm text-primary mb-8">
            <Sparkles className="w-4 h-4" />
            AI Assistant by Soham from India
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Qurob<span className="text-primary">Ai</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            Your intelligent AI companion for coding, creating, and solving problems. Built in India, for the world.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-base px-8 bg-primary hover:bg-primary/90">
                Start Chatting <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            Free to use • No credit card required
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            What QurobAi Can Do
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <Brain className="w-8 h-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Intelligent Chat</h3>
              <p className="text-sm text-muted-foreground">
                Natural conversations with context understanding and thoughtful responses.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <Code className="w-8 h-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Code Expert</h3>
              <p className="text-sm text-muted-foreground">
                Write, debug, and explain code in any programming language.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <Globe className="w-8 h-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Real-time Data</h3>
              <p className="text-sm text-muted-foreground">
                Weather, stocks, crypto, news, and cricket scores in real-time.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <Zap className="w-8 h-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Fast Responses</h3>
              <p className="text-sm text-muted-foreground">
                Instant answers powered by advanced AI technology.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <Shield className="w-8 h-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Secure</h3>
              <p className="text-sm text-muted-foreground">
                Your conversations are private and protected.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <MessageSquare className="w-8 h-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Vision AI</h3>
              <p className="text-sm text-muted-foreground">
                Upload images for analysis and description.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground mb-12">
            Start free, upgrade for more power
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free Plan */}
            <div className="p-6 rounded-xl border border-border bg-card text-left">
              <h3 className="font-semibold text-lg mb-1">Qurob 2</h3>
              <div className="text-3xl font-bold mb-4">₹0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              <p className="text-sm text-muted-foreground mb-6">
                Perfect for getting started
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Basic AI (Gemini Flash)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Real-time data access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Web search</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Image analysis</span>
                </li>
              </ul>
              <Link to="/auth" className="block mt-6">
                <Button variant="outline" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </div>
            
            {/* Premium Plan */}
            <div className="p-6 rounded-xl border-2 border-primary bg-card text-left relative">
              <div className="absolute -top-3 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                BEST VALUE
              </div>
              <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                Q-06 FREE!
              </div>
              <h3 className="font-semibold text-lg mb-1 mt-2">Qurob 4</h3>
              <div className="text-3xl font-bold mb-4">₹289<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              <p className="text-sm text-muted-foreground mb-6">
                For power users and developers
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Advanced AI (DeepSeek)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">Q-06 Code Specialist FREE!</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>100+ programming languages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>All Qurob 2 features</span>
                </li>
              </ul>
              <Link to="/auth" className="block mt-6">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to start?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands using QurobAi every day.
          </p>
          <Link to="/auth">
            <Button size="lg" className="px-8 bg-primary hover:bg-primary/90">
              Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
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
            © 2024 QurobAi. Created by Soham from India 🇮🇳
          </p>
        </div>
      </footer>
    </div>
  );
};
