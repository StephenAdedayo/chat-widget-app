import ChatWidget from "./ChatWidget.jsx";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 40, maxWidth: 700, margin: "0 auto" }}>
      <h1>My Website</h1>
      <p>
        This page stands in for a real site. The chat widget is mounted once, fixed to the
        bottom-right corner — click the bubble to open it.
      </p>
      <p>
        Try asking it something once the server is running with a valid <code>ANTHROPIC_API_KEY</code>.
      </p>

      <ChatWidget apiEndpoint="/api/chat" title="Site Assistant" greeting="Hi! Ask me anything about this site." />
    </div>
  );
}
