import { useState, useRef, useEffect } from "react";

/**
 * Floating chat widget: click the button to open a chat panel,
 * send messages to your backend, display the AI's reply.
 *
 * Usage: <ChatWidget apiEndpoint="/api/chat" />
 */
export default function ChatWidget({
  apiEndpoint = "/api/chat",
  title = "Chat with us",
  greeting = "Hi! How can I help you today?",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: greeting }]);
  const [storedMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("storedMessages");
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem("storedMessages"); // clear the corrupted value
      return null;
    }
  })
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
        if(storedMessages) setMessages(storedMessages)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setError(null);
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    localStorage.setItem("storedMessages", JSON.stringify(nextMessages))
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const msg =[...nextMessages, { role: "assistant", content: data?.reply || "(empty reply)" }]
      setMessages(msg);

      localStorage.setItem("storedMessages", JSON.stringify(msg))
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      {isOpen && (
        <div style={styles.panel} role="dialog" aria-label={title}>
          <div style={styles.header}>
            <span>{title}</span>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div ref={scrollRef} style={styles.messages}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{ ...styles.bubble, ...(m.role === "user" ? styles.userBubble : styles.assistantBubble) }}
              >
                {m.content}
              </div>
            ))}
            {isLoading && (
              <div style={{ ...styles.bubble, ...styles.assistantBubble, ...styles.typing }}>
                <span style={styles.dot} />
                <span style={{ ...styles.dot, animationDelay: "0.15s" }} />
                <span style={{ ...styles.dot, animationDelay: "0.3s" }} />
              </div>
            )}
            {error && <div style={styles.errorBox}>{error}</div>}
          </div>

          <form onSubmit={sendMessage} style={styles.inputRow}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              style={styles.input}
              disabled={isLoading}
            />
            <button type="submit" style={styles.sendBtn} disabled={isLoading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        style={styles.toggleBtn}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: { position: "fixed", bottom: 20, right: 20, zIndex: 1000, fontFamily: "system-ui, sans-serif" },
  toggleBtn: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: 24,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
  },
  panel: {
    width: 340,
    height: 460,
    marginBottom: 12,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    background: "#4f46e5",
    color: "#fff",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 600,
  },
  closeBtn: { background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" },
  messages: { flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 },
  bubble: { maxWidth: "80%", padding: "8px 12px", borderRadius: 14, fontSize: 14, lineHeight: 1.4 },
  userBubble: { alignSelf: "flex-end", background: "#4f46e5", color: "#fff", borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: "flex-start", background: "#f1f1f4", color: "#111", borderBottomLeftRadius: 4 },
  typing: { display: "flex", gap: 4, padding: "10px 14px" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#999",
    animation: "bounce 1s infinite",
  },
  errorBox: {
    alignSelf: "center",
    color: "#b91c1c",
    background: "#fee2e2",
    fontSize: 13,
    padding: "6px 10px",
    borderRadius: 8,
  },
  inputRow: { display: "flex", borderTop: "1px solid #eee", padding: 8, gap: 8 },
  input: { flex: 1, border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 14 },
  sendBtn: {
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 14,
    cursor: "pointer",
  },
};
