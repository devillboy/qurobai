import DOMPurify from "dompurify";

// Whitelist only safe HTML tags for chat rendering
const ALLOWED_TAGS = [
  "strong",
  "em",
  "code",
  "a",
  "br",
  "span",
  "p",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "pre",
  "blockquote",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class", "style"];

// Configure DOMPurify
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  // Force all links to open in new tab with security attributes
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

/**
 * Sanitize HTML content to prevent XSS attacks
 * Only allows safe formatting tags used in chat messages
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: { html: true },
  });
}

/**
 * Sanitize user input for plain text (removes ALL HTML)
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Check if content contains potentially dangerous patterns
 */
export function containsDangerousContent(content: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(content));
}
