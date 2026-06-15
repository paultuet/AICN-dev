(ns aicn.html
  "Server-side HTML sanitization for admin-authored rich-text content (journal
   posts). This is the AUTHORITATIVE XSS boundary: the frontend DOMPurify pass is
   defense-in-depth only and can be bypassed by a direct API call. The allow-list
   matches what the TipTap editor produces on the frontend."
  (:import [org.owasp.html HtmlPolicyBuilder PolicyFactory]))

(def ^:private ^PolicyFactory policy
  (-> (HtmlPolicyBuilder.)
      (.allowElements (into-array String ["p" "br" "strong" "em" "u" "s"
                                          "h1" "h2" "h3"
                                          "ul" "ol" "li"
                                          "blockquote" "code" "pre" "a"]))
      (.allowAttributes (into-array String ["href"]))
      (.onElements (into-array String ["a"]))
      (.allowStandardUrlProtocols)
      (.requireRelNofollowOnLinks)
      (.toFactory)))

(defn sanitize
  "Return a sanitized copy of admin-authored HTML, stripping scripts, styles,
   event handlers and any element/attribute outside the allow-list. Returns nil
   for nil input (so partial updates leave the column untouched)."
  [^String html]
  (when html
    (.sanitize policy html)))
