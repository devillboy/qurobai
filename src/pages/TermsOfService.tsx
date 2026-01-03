import { ArrowLeft, FileText, AlertTriangle, CreditCard, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Agreement to Terms</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using QurobAi, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Use of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              QurobAi provides AI-powered conversational assistance. You agree to use the service only for lawful purposes and in accordance with these Terms.
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">You may:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Use the AI for personal and commercial purposes</li>
                <li>Generate content, code, and get assistance</li>
                <li>Share AI-generated content (you own the output)</li>
              </ul>
            </div>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">You may NOT:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Use the service for illegal activities</li>
                <li>Generate harmful, abusive, or misleading content</li>
                <li>Attempt to reverse-engineer or hack the service</li>
                <li>Share your account credentials with others</li>
                <li>Use automated tools to abuse the service</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Subscriptions & Payments</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <p><strong className="text-foreground">Free Tier:</strong> Access to Qurob 2 model at no cost.</p>
              <p><strong className="text-foreground">Premium (₹289/month):</strong> Access to Qurob 4 advanced model.</p>
              <p><strong className="text-foreground">Code Specialist (₹320/month):</strong> Access to Q-06 coding AI.</p>
              <p><strong className="text-foreground">Payment Method:</strong> UPI payments to 7864084241@ybl with screenshot verification.</p>
              <p><strong className="text-foreground">Activation:</strong> Subscriptions activate within 24 hours after admin approval.</p>
              <p><strong className="text-foreground">Duration:</strong> All subscriptions are valid for 30 days from activation.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Refund Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Due to the nature of digital services, we generally do not offer refunds after subscription activation. However, if you experience technical issues that prevent you from using the service, contact us within 7 days for a review. Refund decisions are made on a case-by-case basis.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Disclaimer</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              QurobAi is provided "as is" without warranties of any kind. AI responses may not always be accurate. Do not rely on AI for medical, legal, or financial advice. Always verify important information from authoritative sources.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Limitation of Liability</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall QurobAi or its creator be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The QurobAi service, including its design, features, and branding, is owned by Soham. Content you generate using our AI belongs to you. You grant us a license to use your conversations to improve our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violations of these terms. Upon termination, your right to use the service ceases immediately.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-muted-foreground">
              Questions about these terms? Contact us at:{" "}
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

export default TermsOfService;
