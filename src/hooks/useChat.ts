import { useState, useCallback } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Simulated AI responses (replace with actual LLM endpoint)
const simulateResponse = async (userMessage: string): Promise<string> => {
  // Simulate typing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const responses: Record<string, string> = {
    code: `Here's a clean, efficient solution:

\`\`\`typescript
// Example: Async data fetching with error handling
async function fetchData<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}
\`\`\`

This implementation includes type safety, proper error handling, and follows modern async/await patterns.`,

    explain: `Let me break this down in simple terms:

**Key Concepts:**
1. **Foundation** - The basic building blocks that make everything work
2. **Architecture** - How components connect and communicate
3. **Optimization** - Making it fast and efficient

Think of it like building with LEGO - each piece has a purpose, and when combined correctly, they create something powerful.

Would you like me to dive deeper into any specific aspect?`,

    brainstorm: `Here are some creative ideas to consider:

🚀 **Bold Ideas:**
- Implement a real-time collaboration feature
- Add AI-powered suggestions based on user behavior
- Create an interactive visualization dashboard

💡 **Quick Wins:**
- Streamline the onboarding flow
- Add keyboard shortcuts for power users
- Implement smart caching for better performance

🎯 **Strategic Moves:**
- Build an API for third-party integrations
- Create a plugin ecosystem
- Develop mobile-first responsive designs

Which direction resonates most with your goals?`,

    debug: `Let me help you debug this issue:

**Diagnostic Steps:**
1. Check the console for error messages
2. Verify all dependencies are correctly imported
3. Confirm the data types match expectations

**Common Fixes:**
- Ensure async operations are properly awaited
- Check for null/undefined values before accessing properties
- Verify API endpoints return expected data structure

Share the specific error or code snippet, and I'll provide a targeted solution!`,
  };

  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes("code") || lowerMessage.includes("write")) {
    return responses.code;
  } else if (lowerMessage.includes("explain") || lowerMessage.includes("how")) {
    return responses.explain;
  } else if (lowerMessage.includes("idea") || lowerMessage.includes("brainstorm")) {
    return responses.brainstorm;
  } else if (lowerMessage.includes("debug") || lowerMessage.includes("fix") || lowerMessage.includes("error")) {
    return responses.debug;
  }

  return `I understand you're asking about: "${userMessage}"

As a free, self-hosted AI assistant, I'm designed to help with:
• **Coding** - Write, review, and debug code
• **Explanations** - Break down complex topics
• **Brainstorming** - Generate creative solutions
• **Problem-solving** - Debug issues and find fixes

This is a demo interface. To enable full AI capabilities, connect to your self-hosted LLM backend (vLLM, Ollama, or Text-Generation-Inference).

How can I assist you today?`;
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Simulate streaming by adding chars progressively
      const response = await simulateResponse(content);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Simulate streaming effect
      for (let i = 0; i <= response.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: response.slice(0, i) }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};
