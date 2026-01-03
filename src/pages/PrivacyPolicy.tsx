import { ArrowLeft, Shield, Lock, Eye, Database, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Introduction</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              QurobAi ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI assistant service.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Information We Collect</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <p><strong className="text-foreground">Account Information:</strong> Email address, display name, and authentication data when you create an account.</p>
              <p><strong className="text-foreground">Conversation Data:</strong> Messages you send to our AI assistant to provide and improve the service.</p>
              <p><strong className="text-foreground">Usage Data:</strong> Information about how you interact with our service, including features used and time spent.</p>
              <p><strong className="text-foreground">Payment Information:</strong> UPI transaction screenshots for subscription verification (stored securely and deleted after verification).</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">How We Use Your Information</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Provide and maintain our AI assistant service</li>
              <li>Process your subscription and payments</li>
              <li>Improve our AI models and service quality</li>
              <li>Send important updates about your account</li>
              <li>Respond to your inquiries and provide support</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Data Security</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption in transit (HTTPS/TLS) and at rest, secure cloud infrastructure, and regular security audits. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use third-party AI providers (Groq, Fireworks AI, DeepInfra) to power our AI capabilities. Your conversations may be processed by these services according to their respective privacy policies. We do not sell your personal data to third parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Your Rights</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your conversation history</li>
              <li>Opt-out of promotional communications</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide services. You can delete your conversations at any time. Account deletion requests will be processed within 30 days.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Contact Us</h2>
            </div>
            <p className="text-muted-foreground">
              For privacy-related inquiries, contact us at:{" "}
              <a href="mailto:sohamghosh679@gmail.com" className="text-primary hover:underline">
                sohamghosh679@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
