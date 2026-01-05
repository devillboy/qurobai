import { Link } from "react-router-dom";
import { 
  Sparkles, Code, Zap, Shield, Globe, 
  Brain, ArrowRight, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="text-lg font-semibold">QurobAi</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-border px-3 py-1.5 rounded-full text-sm text-muted-foreground mb-8">
            <Sparkles className="w-3 h-3" />
            AI Assistant by Soham
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            QurobAi
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            Your intelligent AI companion for coding, creating, and solving problems. Built in India.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-base px-8">
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
          <h2 className="text-2xl font-semibold text-center mb-12">
            What QurobAi Can Do
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-border bg-card">
              <Brain className="w-8 h-8 mb-4" />
              <h3 className="font-semibold mb-2">Intelligent Chat</h3>
              <p className="text-sm text-muted-foreground">
                Natural conversations with context understanding and thoughtful responses.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-card">
              <Code className="w-8 h-8 mb-4" />
              <h3 className="font-semibold mb-2">Code Expert</h3>
              <p className="text-sm text-muted-foreground">
                Write, debug, and explain code in any programming language.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-card">
              <Globe className="w-8 h-8 mb-4" />
              <h3 className="font-semibold mb-2">Real-time Data</h3>
              <p className="text-sm text-muted-foreground">
                Weather, stocks, crypto, news, and cricket scores in real-time.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-card">
              <Zap className="w-8 h-8 mb-4" />
              <h3 className="font-semibold mb-2">Fast Responses</h3>
              <p className="text-sm text-muted-foreground">
                Instant answers powered by advanced AI technology.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-card">
              <Shield className="w-8 h-8 mb-4" />
              <h3 className="font-semibold mb-2">Secure</h3>
              <p className="text-sm text-muted-foreground">
                Your conversations are private and protected.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-card">
              <MessageSquare className="w-8 h-8 mb-4" />
              <h3 className="font-semibold mb-2">Vision AI</h3>
              <p className="text-sm text-muted-foreground">
                Upload images for analysis and description.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground mb-12">
            Start free, upgrade for more power
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2">Qurob 2</h3>
              <div className="text-3xl font-bold mb-4">₹0</div>
              <p className="text-sm text-muted-foreground">
                Free forever. Basic AI, real-time data access.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border-2 border-foreground bg-card">
              <div className="text-xs font-medium mb-2">POPULAR</div>
              <h3 className="font-semibold mb-2">Qurob 4</h3>
              <div className="text-3xl font-bold mb-4">₹289<span className="text-sm font-normal">/mo</span></div>
              <p className="text-sm text-muted-foreground">
                Advanced AI with superior reasoning.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2">Q-06</h3>
              <div className="text-3xl font-bold mb-4">₹320<span className="text-sm font-normal">/mo</span></div>
              <p className="text-sm text-muted-foreground">
                Expert-level coding AI. 100+ languages.
              </p>
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
            <Button size="lg" className="px-8">
              Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-background" />
            </div>
            <span className="font-medium">QurobAi</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 QurobAi. Created by Soham from India 🇮🇳
          </p>
        </div>
      </footer>
    </div>
  );
};
