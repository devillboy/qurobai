import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, BadgeCheck, User, ExternalLink, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SupportChatbotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  options?: { label: string; value: string }[];
}

const FAQ_DATA: Record<string, { answer: string; followUp?: { label: string; value: string }[] }> = {
  "pricing": {
    answer: "**QurobAi Pricing:**\n\n• **Qurob 2 (Free)**: Basic AI, unlimited usage\n• **Qurob 4 Premium (₹289/month)**: Advanced 70B AI + Q-06 Code AI included FREE!\n\nQ-06 is bundled with Premium at no extra cost! 🎉",
    followUp: [
      { label: "How to subscribe?", value: "subscribe" },
      { label: "Payment methods?", value: "payment" },
    ]
  },
  "subscribe": {
    answer: "**To subscribe to Qurob 4 Premium:**\n\n1. Go to Settings → Upgrade to Qurob 4\n2. Choose your plan\n3. Pay via UPI, Bank Transfer, or Google Play\n4. Upload payment screenshot\n5. Wait for verification (usually instant with AI!)",
    followUp: [
      { label: "Payment not verified?", value: "payment_issue" },
      { label: "Subscription not active?", value: "sub_issue" },
    ]
  },
  "payment": {
    answer: "**Accepted Payment Methods:**\n\n• **UPI** (PhonePe, GPay, Paytm) - Instant deep link\n• **Bank Transfer** - Manual verification\n• **Google Play Redeem** - For gift cards\n\nAfter payment, upload a screenshot for verification.",
  },
  "payment_issue": {
    answer: "**Payment Verification Issues:**\n\nIf your payment wasn't verified:\n\n1. Make sure screenshot is clear\n2. Transaction amount matches plan price\n3. Wait 24 hours for manual review\n\nStill having issues? Email us at **sohamghosh679@gmail.com** with your transaction details.",
    followUp: [
      { label: "Contact support", value: "contact" },
    ]
  },
  "sub_issue": {
    answer: "**Subscription Not Active?**\n\n1. Check Settings → Subscription History\n2. Verify payment status is 'Approved'\n3. Try refreshing the page\n4. Log out and log back in\n\nIf still not working, contact us!",
    followUp: [
      { label: "Contact support", value: "contact" },
    ]
  },
  "q06": {
    answer: "**Q-06 Code AI is FREE with Premium!**\n\nWhen you subscribe to Qurob 4 Premium (₹289/month), you get Q-06 Code AI included at no extra cost!\n\n**Q-06 Features:**\n• Expert-level coding in 100+ languages\n• Clean, modular architecture\n• Advanced debugging\n• Worth ₹320/month - FREE with Premium!",
  },
  "api": {
    answer: "**API Access:**\n\nQurobAi offers API access for developers!\n\n• **Qurob 2 API**: Free 35-day trial\n• **Qurob 4 API**: Requires Premium subscription\n\nGo to Settings → API Access to generate your API key.",
    followUp: [
      { label: "API documentation", value: "api_docs" },
    ]
  },
  "api_docs": {
    answer: "**API Quick Start:**\n\n```\nPOST /functions/v1/api-chat\nHeaders: Authorization: Bearer YOUR_API_KEY\nBody: { \"messages\": [{\"role\": \"user\", \"content\": \"Hello!\"}] }\n```\n\nFull documentation available in Settings → API Access → Documentation tab.",
  },
  "voice": {
    answer: "**Voice Input:**\n\nQurobAi supports voice input! Click the microphone button in the chat input to speak your message.\n\n**Supported browsers:** Chrome, Edge, Safari\n\n**Tips:**\n• Speak clearly\n• Works in 35+ languages\n• Auto-transcribes to text",
  },
  "data": {
    answer: "**Your Data is Safe:**\n\n• All conversations are encrypted\n• Data stored securely in cloud\n• You can export all your data anytime\n• We never sell your data\n\nGo to Settings → Download All Data to export.",
    followUp: [
      { label: "Delete my data", value: "delete_data" },
    ]
  },
  "delete_data": {
    answer: "**Delete Your Data:**\n\nTo delete your QurobAi data:\n\n1. Export your data first (Settings → Download All Data)\n2. Email **sohamghosh679@gmail.com** with subject \"Delete Account Request\"\n3. Include your registered email\n\nWe'll process within 48 hours.",
  },
  "contact": {
    answer: "**Contact Support:**\n\n📧 **Email:** sohamghosh679@gmail.com\n\nInclude:\n• Your registered email\n• Description of issue\n• Screenshots if applicable\n\nWe typically respond within 24 hours!",
  },
  "features": {
    answer: "**QurobAi Features:**\n\n✨ **Chat with AI** - Smart conversations\n🖼️ **Image Analysis** - Upload & analyze images\n🎨 **Image Generation** - Create AI images\n🎤 **Voice Input** - Speak to AI\n🔍 **Chat Search** - Find past conversations\n📊 **Real-time Data** - Live cricket, stocks, weather\n💻 **Code Help** - Programming assistance\n🔗 **API Access** - Integrate in your apps",
  },
  "default": {
    answer: "I'm here to help! Choose a topic below or type your question:",
    followUp: [
      { label: "💰 Pricing & Plans", value: "pricing" },
      { label: "💳 Payment Help", value: "payment" },
      { label: "🔑 API Access", value: "api" },
      { label: "✨ Features", value: "features" },
      { label: "🔒 Data & Privacy", value: "data" },
      { label: "📧 Contact Support", value: "contact" },
    ]
  },
};

export const SupportChatbot = ({ open, onOpenChange }: SupportChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Initial greeting
      setMessages([
        {
          id: "1",
          role: "bot",
          content: "👋 Hi! I'm QurobAi Support.\n\nHow can I help you today?",
          options: FAQ_DATA.default.followUp,
        },
      ]);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleOptionClick = (value: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: FAQ_DATA[value]?.answer ? value : value,
    };

    const faq = FAQ_DATA[value] || FAQ_DATA.default;
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "bot",
      content: faq.answer,
      options: faq.followUp,
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    // Simple keyword matching
    const lowerInput = input.toLowerCase();
    let matchedKey = "default";

    if (lowerInput.includes("price") || lowerInput.includes("cost") || lowerInput.includes("plan")) {
      matchedKey = "pricing";
    } else if (lowerInput.includes("pay") || lowerInput.includes("upi") || lowerInput.includes("bank")) {
      matchedKey = "payment";
    } else if (lowerInput.includes("subscri") || lowerInput.includes("upgrade") || lowerInput.includes("premium")) {
      matchedKey = "subscribe";
    } else if (lowerInput.includes("q-06") || lowerInput.includes("q06") || lowerInput.includes("code")) {
      matchedKey = "q06";
    } else if (lowerInput.includes("api") || lowerInput.includes("key")) {
      matchedKey = "api";
    } else if (lowerInput.includes("voice") || lowerInput.includes("speak") || lowerInput.includes("mic")) {
      matchedKey = "voice";
    } else if (lowerInput.includes("data") || lowerInput.includes("privacy") || lowerInput.includes("safe")) {
      matchedKey = "data";
    } else if (lowerInput.includes("contact") || lowerInput.includes("email") || lowerInput.includes("help")) {
      matchedKey = "contact";
    } else if (lowerInput.includes("feature") || lowerInput.includes("what can")) {
      matchedKey = "features";
    }

    const faq = FAQ_DATA[matchedKey];
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "bot",
      content: faq.answer,
      options: faq.followUp,
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 border-b border-border bg-primary/5">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <BadgeCheck className="w-4 h-4 text-white" />
            </div>
            QurobAi Support
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  {msg.options && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.options.map((opt) => (
                        <Button
                          key={opt.value}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => handleOptionClick(opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-background" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-background/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
            <Mail className="w-3 h-3" />
            <a href="mailto:sohamghosh679@gmail.com" className="hover:text-primary">
              sohamghosh679@gmail.com
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
