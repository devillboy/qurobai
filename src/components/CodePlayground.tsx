import { useState, useRef, memo } from "react";
import { Play, RotateCcw, Maximize2, Minimize2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodePlaygroundProps {
  code: string;
  language: string;
}

export const CodePlayground = memo(({ code, language }: CodePlaygroundProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isHTML = language.toLowerCase() === "html" || code.includes("<!DOCTYPE") || code.includes("<html");
  const isJS = language.toLowerCase() === "javascript" || language.toLowerCase() === "js";

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runCode = () => {
    setIsRunning(true);
    setOutput("");

    if (isHTML || (isJS && code.includes("document."))) {
      // For HTML or DOM-manipulating JS, use iframe
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (iframeDoc) {
          let htmlContent = code;
          
          // If it's pure JS, wrap in HTML
          if (isJS && !isHTML) {
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; background: #1a1a1a; color: #e5e5e5; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>${code}</script>
</body>
</html>`;
          }
          
          iframeDoc.open();
          iframeDoc.write(htmlContent);
          iframeDoc.close();
        }
      }
    } else if (isJS) {
      // For pure JS without DOM, capture console output
      try {
        const logs: string[] = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.log = (...args) => {
          logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" "));
        };
        console.error = (...args) => {
          logs.push("❌ " + args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" "));
        };
        console.warn = (...args) => {
          logs.push("⚠️ " + args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" "));
        };
        
        // Execute the code
        const result = new Function(code)();
        
        if (result !== undefined) {
          logs.push("→ " + (typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)));
        }
        
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
        
        setOutput(logs.join("\n") || "✓ Code executed successfully (no output)");
      } catch (error) {
        setOutput("❌ Error: " + (error instanceof Error ? error.message : String(error)));
      }
    }

    setIsRunning(false);
  };

  const resetCode = () => {
    setOutput("");
    if (iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write("");
        iframeDoc.close();
      }
    }
  };

  const showIframe = isHTML || (isJS && code.includes("document."));

  return (
    <div className={cn(
      "my-4 rounded-xl overflow-hidden border border-border bg-card transition-all",
      isExpanded && "fixed inset-2 md:inset-4 z-50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{language}</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Playground</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 md:h-7 md:px-2 touch-manipulation" onClick={copyCode}>
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 md:h-7 md:px-2 touch-manipulation" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Code Display */}
      <pre className={cn(
        "p-3 overflow-auto text-sm bg-background",
        isExpanded ? "max-h-[35vh]" : "max-h-48 md:max-h-64"
      )}>
        <code className="font-mono text-foreground whitespace-pre-wrap text-xs md:text-sm">{code}</code>
      </pre>

      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted border-t border-border">
        <Button
          size="sm"
          className="h-8 md:h-7 touch-manipulation"
          onClick={runCode}
          disabled={isRunning}
        >
          <Play className="w-3 h-3 mr-1" />
          Run
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 md:h-7 touch-manipulation"
          onClick={resetCode}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Output Area */}
      {(output || showIframe) && (
        <div className={cn(
          "border-t border-border",
          isExpanded ? "h-[35vh]" : "max-h-48 md:max-h-64"
        )}>
          {showIframe ? (
            <iframe
              ref={iframeRef}
              title="Code Playground Output"
              className="w-full h-full bg-background min-h-[120px]"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : output && (
            <pre className="p-3 text-xs md:text-sm font-mono text-foreground bg-secondary overflow-auto h-full">
              {output}
            </pre>
          )}
        </div>
      )}
    </div>
  );
});

CodePlayground.displayName = "CodePlayground";