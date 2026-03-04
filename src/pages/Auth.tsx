import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Brain, Zap, Globe, Shield, Code, Image, ArrowRight, Download } from "lucide-react";
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

const features = [
  { icon: Brain, title: "Intelligent AI", desc: "Advanced reasoning & deep understanding" },
  { icon: Code, title: "Code Expert", desc: "Write, debug & explain in 100+ languages" },
  { icon: Globe, title: "Real-time Data", desc: "Weather, stocks, news & more instantly" },
  { icon: Image, title: "Vision & Image Gen", desc: "Analyze images & create visuals" },
  { icon: Zap, title: "Lightning Fast", desc: "Sub-second response times" },
  { icon: Shield, title: "Encrypted & Secure", desc: "Your data stays private always" },
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
      <SEOHead title="Sign In to QurobAi" description="India's premier AI assistant. Sign in or create an account to start chatting." />
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* Left Side - Hero/Features (hidden on mobile, visible on desktop) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-10 xl:p-14"
        >
          {/* Mesh gradient background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/8 via-background to-accent/5" />
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/12 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }} />
          </div>

          {/* Logo + branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <img src={qurobLogo} alt="QurobAi" className="w-11 h-11 rounded-xl shadow-xl" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">QurobAi</h1>
                <p className="text-xs text-muted-foreground tracking-widest uppercase">India's AI Companion</p>
              </div>
            </div>
          </div>

          {/* Hero text */}
          <div className="relative z-10 -mt-10">
            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1] mb-5"
            >
              <span className="text-foreground">Think.</span>
              <br />
              <span className="text-gradient">Create.</span>
              <br />
              <span className="text-foreground">Solve.</span>
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-muted-foreground text-lg max-w-md leading-relaxed"
            >
              Your intelligent AI partner for coding, creating, and conquering any challenge.
            </motion.p>
          </div>

          {/* Feature grid */}
          <div className="relative z-10">
            <div className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border/30 backdrop-blur-sm"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{f.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 relative">
          {/* Mobile background accent */}
          <div className="absolute inset-0 lg:hidden">
            <div className="absolute top-[-15%] right-[-15%] w-[300px] h-[300px] bg-primary/8 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-accent/6 rounded-full blur-[70px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm relative z-10"
          >
            {/* Mobile logo */}
            <div className="text-center mb-8 lg:hidden">
              <img src={qurobLogo} alt="QurobAi" className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-xl" />
              <h1 className="text-2xl font-bold tracking-tight">
                Qurob<span className="text-primary">Ai</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">India's AI Companion</p>
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

            {/* Form Card */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-xl">
              <AnimatePresence mode="wait">
                <motion.form
                  key={isLogin ? "login" : "signup"}
                  initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <div className="space-y-1.5">
                      <Label htmlFor="displayName" className="text-xs font-medium">Display Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="Your name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="pl-10 h-11 bg-background/50 rounded-xl border-border/50"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                        className="pl-10 h-11 bg-background/50 rounded-xl border-border/50"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                        className="pl-10 pr-10 h-11 bg-background/50 rounded-xl border-border/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  {!isLogin && (
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="terms"
                          checked={agreedToTerms}
                          onCheckedChange={(checked) => { setAgreedToTerms(checked as boolean); setErrors(prev => ({ ...prev, terms: undefined })); }}
                          className="mt-1"
                        />
                        <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                          I agree to the{" "}
                          <Link to="/terms" className="text-primary hover:underline">Terms</Link>{" "}and{" "}
                          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                        </label>
                      </div>
                      {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 font-medium shadow-lg shadow-primary/20" disabled={isLoading}>
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
                  <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setErrors({}); setAgreedToTerms(false); }}
                    className="text-primary hover:underline font-medium"
                  >
                    {isLogin ? "Sign Up" : "Sign In"}
                  </button>
                </p>
              </div>
            </div>

            {/* Mobile features row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="lg:hidden mt-6 flex flex-wrap justify-center gap-3"
            >
              {[
                { icon: Brain, label: "AI Chat" },
                { icon: Code, label: "Code" },
                { icon: Globe, label: "Real-time" },
                { icon: Image, label: "Vision" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <f.icon className="w-3 h-3" />
                  <span>{f.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Download app link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-center"
            >
              <Link to="/download" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-primary transition-colors">
                <Download className="w-3 h-3" />
                Download Android App
              </Link>
            </motion.div>

            <p className="text-center text-[11px] text-muted-foreground/40 mt-4">
              Created by Soham from India 🇮🇳
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Auth;
