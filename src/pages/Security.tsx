import { ArrowLeft, Shield, Lock, Server, Key, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Security = () => {
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Security</h1>
            <p className="text-muted-foreground">How we protect your data</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-6 rounded-xl bg-card border border-border">
              <Lock className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Encryption</h3>
              <p className="text-muted-foreground text-sm">
                All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <Server className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Secure Infrastructure</h3>
              <p className="text-muted-foreground text-sm">
                Hosted on enterprise-grade cloud infrastructure with 99.9% uptime guarantee.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <Key className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication</h3>
              <p className="text-muted-foreground text-sm">
                Secure authentication with encrypted password storage and session management.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <Shield className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Control</h3>
              <p className="text-muted-foreground text-sm">
                Row-level security ensures you can only access your own data.
              </p>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Security Measures</h2>
            <ul className="space-y-3">
              {[
                "HTTPS/TLS encryption for all connections",
                "Secure API key management with environment variables",
                "Regular security audits and vulnerability scanning",
                "Automatic session expiration for inactive users",
                "Rate limiting to prevent abuse",
                "Input validation and sanitization",
                "SQL injection and XSS protection",
                "Secure password hashing using bcrypt",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Data Protection</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Conversations:</strong> Your chat history is stored securely and only accessible by you. We do not share your conversations with third parties.
              </p>
              <p>
                <strong className="text-foreground">Payment Screenshots:</strong> Uploaded for verification only, stored temporarily, and deleted after subscription activation.
              </p>
              <p>
                <strong className="text-foreground">Personal Data:</strong> Minimal data collection - only what's necessary to provide the service.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">AI Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your conversations are processed securely using enterprise-grade AI infrastructure. Your prompts are processed securely and not used to train AI models without consent. All AI processing follows industry-standard security practices.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Report Security Issues</h2>
            <p className="text-muted-foreground">
              Found a security vulnerability? Report it responsibly to:{" "}
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

export default Security;
