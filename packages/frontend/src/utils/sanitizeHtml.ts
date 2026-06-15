import DOMPurify from "dompurify";

// Allow-list mirrors what the TipTap editor produces (and the backend OWASP
// sanitizer). This is defense-in-depth: the backend is the authoritative XSS
// boundary, but we also sanitize before sending and before rendering.
const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s",
  "h1", "h2", "h3",
  "ul", "ol", "li",
  "blockquote", "code", "pre", "a",
];
const ALLOWED_ATTR = ["href", "target", "rel"];

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

// True when the HTML carries no visible text (e.g. an empty TipTap document
// "<p></p>"). Used to validate the rich-text field.
export function isHtmlEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
}
