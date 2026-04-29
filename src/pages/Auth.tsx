import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, Download, Shield, Zap, Code, Globe, Image, MessageSquare, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { z } from "zod";
import qurobLogo from "@/assets/qurob-logo.png";

const emailSchema = z.string().email("Please enter a valid email");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const capabilities = [
  { icon: BadgeCheck, title: "Intelligent Assistant", desc: "Advanced reasoning with deep understanding" },
  { icon: Code, title: "Code Expert", desc: "Write, debug & explain in 100+ languages" },
  { icon: Globe, title: "Real-time Search", desc: "Web search & deep research instantly" },
  { icon: Image, title: "Vision & Create", desc: "Analyze images & generate visuals" },
  { icon: Shield, title: "Private & Secure", desc: "Encrypted data, always protected" },
  { icon: Zap, title: "Lightning Fast", desc: "Sub-second intelligent responses" },
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; terms?: string }>({});
  
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/chat");
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; terms?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    if (!isLogin && !agreedToTerms) newErrors.terms = "You must agree to the Terms of Service and Privacy Policy";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          const isNetworkError = error.message === "Failed to fetch" || error.message?.includes("NetworkError") || error.message?.includes("network");
          toast({
            title: "Login Failed",
            description: isNetworkError
              ? "Connection error. Please check your internet and try again."
              : error.message === "Invalid login credentials" 
                ? "Invalid email or password. Please try again."
                : error.message,
            variant: "destructive",
          });
        } else {
          toast({ title: "Welcome back!", description: "You've successfully logged in." });
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          const isNetworkError = error.message === "Failed to fetch" || error.message?.includes("NetworkError") || error.message?.includes("network");
          toast({
            title: "Sign Up Failed",
            description: isNetworkError
              ? "Connection error. Please check your internet and try again."
              : error.message.includes("already registered")
                ? "This email is already registered. Please login instead."
                : error.message,
            variant: "destructive",
          });
        } else {
          toast({ title: "Account Created!", description: "Please check your email to verify your account." });
        }
      }
    } catch (err) {
      toast({
        title: "Connection Error",
        description: "Unable to reach the server. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="QurobAi — Experience Like Never Before" description="India's premier AI assistant. Sign in or create an account to start chatting." />
      <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT — Immersive brand showcase (desktop) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden"
        >
          {/* Layered background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-background to-accent/4" />
            <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-float" />
            <div className="absolute bottom-[-25%] right-[-15%] w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px]" />
            <div className="absolute top-[40%] left-[60%] w-[200px] h-[200px] bg-primary/5 rounded-full blur-[80px]" />
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
              backgroundSize: '32px 32px'
            }} />
          </div>

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img src={qurobLogo} alt="QurobAi" className="w-12 h-12 rounded-2xl shadow-2xl glow-sm" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">QurobAi</h1>
                <p className="text-[10px] text-muted-foreground tracking-[0.25em] uppercase font-medium">Experience Like Never Before</p>
              </div>
            </div>
          </div>

          {/* Hero text */}
          <div className="relative z-10 -mt-8">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-5xl xl:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
                <span className="text-foreground">Your AI</span>
                <br />
                <span className="text-gradient">Companion</span>
                <br />
                <span className="text-foreground/70">for Everything.</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                Code, create, research, and solve — all in one intelligent conversation.
              </p>
            </motion.div>
          </div>

          {/* Capability cards */}
          <div className="relative z-10">
            <div className="grid grid-cols-3 gap-2.5">
              {capabilities.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
                  className="p-3 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm hover:border-primary/30 hover:bg-card/70 transition-all duration-300 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-xs font-semibold mb-0.5">{f.title}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{f.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* RIGHT — Auth form */}
        <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 relative min-h-screen">
          {/* Mobile ambient bg */}
          <div className="absolute inset-0 lg:hidden overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[350px] h-[350px] bg-primary/8 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-15%] left-[-15%] w-[300px] h-[300px] bg-accent/6 rounded-full blur-[80px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[380px] relative z-10"
          >
            {/* Mobile branding */}
            <div className="text-center mb-8 lg:hidden">
              <motion.img 
                src={qurobLogo} 
                alt="QurobAi" 
                className="w-18 h-18 rounded-2xl mx-auto mb-4 shadow-2xl glow"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{ width: 72, height: 72 }}
              />
              <h1 className="text-3xl font-bold tracking-tight">
                Qurob<span className="text-primary">Ai</span>
              </h1>
              <p className="text-primary/80 text-xs mt-1.5 tracking-[0.2em] uppercase font-semibold">Experience Like Never Before</p>
              <p className="text-muted-foreground text-sm mt-2">India's Intelligent AI Companion</p>
            </div>

            {/* Desktop header */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold">
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {isLogin ? "Sign in to continue to QurobAi" : "Get started with QurobAi for free"}
              </p>
            </div>

            {/* Form */}
            <div className="bg-card/80 backdrop-blur-md border border-border/40 rounded-2xl p-6 shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.form
                  key={isLogin ? "login" : "signup"}
                  initial={{ opacity: 0, x: isLogin ? -12 : 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 12 : -12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <div className="space-y-1.5">
                      <Label htmlFor="displayName" className="text-xs font-medium">Display Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="displayName" type="text" placeholder="Your name" value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="pl-10 h-11 bg-background/60 rounded-xl border-border/50 focus:border-primary/50 transition-colors" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="you@example.com" value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                        className="pl-10 h-11 bg-background/60 rounded-xl border-border/50 focus:border-primary/50 transition-colors" />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                        className="pl-10 pr-10 h-11 bg-background/60 rounded-xl border-border/50 focus:border-primary/50 transition-colors" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  {!isLogin && (
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <Checkbox id="terms" checked={agreedToTerms}
                          onCheckedChange={(checked) => { setAgreedToTerms(checked as boolean); setErrors(prev => ({ ...prev, terms: undefined })); }}
                          className="mt-1" />
                        <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                          I agree to the{" "}
                          <Link to="/terms" className="text-primary hover:underline">Terms</Link>{" "}and{" "}
                          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                        </label>
                      </div>
                      {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/25 btn-premium" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isLogin ? "Signing in..." : "Creating account..."}</>
                    ) : (
                      <>{isLogin ? "Sign In" : "Create Account"}<ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </motion.form>
              </AnimatePresence>

              <div className="mt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button type="button"
                    onClick={() => { setIsLogin(!isLogin); setErrors({}); setAgreedToTerms(false); }}
                    className="text-primary hover:underline font-semibold">
                    {isLogin ? "Sign Up" : "Sign In"}
                  </button>
                </p>
              </div>
            </div>

            {/* Mobile capability pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="lg:hidden mt-6 flex flex-wrap justify-center gap-2">
              {[
                { icon: MessageSquare, label: "Chat" },
                { icon: Code, label: "Code" },
                { icon: Globe, label: "Search" },
                { icon: Image, label: "Vision" },
                { icon: Shield, label: "Secure" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border/30 text-xs text-muted-foreground/80">
                  <f.icon className="w-3 h-3 text-primary/70" />
                  <span>{f.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Download + footer */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-5 text-center">
              <Link to="/download" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-primary transition-colors">
                <Download className="w-3 h-3" />
                Download Android App
              </Link>
            </motion.div>

            <p className="text-center text-[10px] text-muted-foreground/30 mt-4">
              Created by Soham from India 🇮🇳
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Auth;
