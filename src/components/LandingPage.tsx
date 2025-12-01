import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Sparkles, Code, MessageSquare, Zap, Shield, Globe, 
  Brain, Rocket, Users, Star, ArrowRight, CheckCircle2,
  FileText, Image, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "Intelligent Conversations",
    description: "QurobAi understands context and provides thoughtful, relevant responses to your questions.",
  },
  {
    icon: Code,
    title: "Code Assistant",
    description: "Write, debug, and explain code in any programming language with syntax highlighting.",
  },
  {
    icon: FileText,
    title: "Document Analysis",
    description: "Upload documents and images for QurobAi to analyze and help you understand.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get instant responses powered by cutting-edge AI technology.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your conversations are encrypted and your data stays protected.",
  },
  {
    icon: Globe,
    title: "Always Available",
    description: "Access your AI companion 24/7 from anywhere in the world.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Sign Up",
    description: "Create your free account in seconds with just your email.",
  },
  {
    step: "02",
    title: "Start Chatting",
    description: "Ask QurobAi anything - from coding help to creative ideas.",
  },
  {
    step: "03",
    title: "Upload Files",
    description: "Share images, documents, or code files for analysis.",
  },
  {
    step: "04",
    title: "Get Results",
    description: "Receive intelligent, friendly responses tailored to your needs.",
  },
];

const useCases = [
  {
    icon: Code,
    title: "Developers",
    items: ["Write & debug code", "Explain algorithms", "Code reviews", "Documentation"],
  },
  {
    icon: Lightbulb,
    title: "Creators",
    items: ["Brainstorm ideas", "Content writing", "Story generation", "Creative projects"],
  },
  {
    icon: Users,
    title: "Students",
    items: ["Homework help", "Concept explanations", "Research assistance", "Study guides"],
  },
  {
    icon: Rocket,
    title: "Professionals",
    items: ["Email drafting", "Data analysis", "Presentations", "Problem solving"],
  },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              QurobAi
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="hidden sm:inline-flex">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px]" />
        
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Welcome to the Future of AI
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Meet{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                QurobAi
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Your intelligent, friendly AI companion that helps you code, create, and conquer any challenge.
            </p>
            
            <p className="text-sm text-muted-foreground/70 mb-8">
              Created with ❤️ by Soham from India 🇮🇳
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 text-lg px-8">
                  Start Chatting Free <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* 3D Chat Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tl-sm px-4 py-2 text-sm">
                    Who made you?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-2 text-sm max-w-md">
                    I was created by Soham from India! 🇮🇳 He built me to be your friendly AI companion!
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need in an AI assistant, designed to make your life easier.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started with QurobAi in just a few simple steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center"
              >
                <div className="text-5xl font-bold bg-gradient-to-br from-primary to-purple-500 bg-clip-text text-transparent mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Everyone
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're a developer, creator, student, or professional, QurobAi has you covered.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50"
              >
                <useCase.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-3">{useCase.title}</h3>
                <ul className="space-y-2">
                  {useCase.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              About QurobAi
            </h2>
            <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground">
              <p className="mb-4">
                QurobAi is an intelligent AI assistant created by <strong className="text-foreground">Soham from India</strong> 🇮🇳. 
                Built with the vision of making AI accessible and friendly for everyone, QurobAi combines 
                cutting-edge technology with a warm, helpful personality.
              </p>
              <p className="mb-4">
                Unlike other AI assistants, QurobAi is designed to be your companion - understanding your needs, 
                helping you solve problems, and always being there when you need assistance. Whether you're 
                coding late at night, working on a creative project, or just need someone to brainstorm with, 
                QurobAi is here for you.
              </p>
              <p>
                QurobAi believes in the power of AI to make everyone's life better. Our mission is to 
                democratize access to intelligent assistance and help people achieve more than they ever 
                thought possible.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="relative p-12 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Meet QurobAi?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of users who are already chatting with their new AI companion. It's free to get started!
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="text-lg px-8 shadow-xl">
                  Start Chatting Now <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">QurobAi</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 QurobAi. Created with ❤️ by Soham from India 🇮🇳
          </p>
        </div>
      </footer>
    </div>
  );
};
