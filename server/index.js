import express from "express";
import cors from "cors";
import "dotenv/config";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.MODEL || "nex-agi/nex-n2.5-pro:free";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
}); 

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Very small in-memory rate limiter (per IP) so a stray loop can't burn your API budget.
// For production, replace with a real store (Redis) behind a load balancer.
const rateLimitWindowMs = 60_000;
const maxRequestsPerWindow = 20;
const requestLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < rateLimitWindowMs);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > maxRequestsPerWindow;
}
 
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasApiKey: Boolean(OPENROUTER_API_KEY), model: MODEL });
});

app.post("/api/chat", async (req, res) => {
  const ip = req.ip;
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }

  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "`messages` must be a non-empty array." });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: "Server is missing OPENROUTER_API_KEY. Add it to server/.env and restart.",
    });
  }

  // Only forward role/content — never trust extra fields the client might send.
  const cleanMessages = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    const apiResponse = await client.chat.completions.create({
      model: MODEL,
      messages: cleanMessages,
      // max_tokens: 500,
    });

    const choice = apiResponse.choices?.[0];

    // Diagnostic: log the raw shape so you can see exactly what came back.
    // Remove or gate behind NODE_ENV !== "production" once things are stable.
    console.log("Raw model response:", JSON.stringify(apiResponse, null, 2));

    // Some OpenRouter providers — especially reasoning models on the free
    // tier — put the real answer in `reasoning` and leave `content` empty,
    // or return empty content when throttled. Fall back where we can.
    let reply = choice?.message?.content;
    if (!reply && choice?.message?.reasoning) {
      reply = choice.message.reasoning;
    }
    if (!reply) {
      console.warn(
        `Empty reply from model. finish_reason: ${choice?.finish_reason}. On free-tier models this usually ` +
          `means it was throttled or cut off before producing output — try again, or switch MODEL to a paid one.`
      );
      reply = "Sorry, I didn't catch that — could you try asking again?";
    }
    
    res.json({ reply });
  } catch (err) {
    console.error("Chat endpoint error:", err);
    res.status(500).json({ error: "Something went wrong talking to the AI service." });
  }
});

app.listen(PORT, () => {
  console.log(`Chat server listening on http://localhost:${PORT}`);
  if (!OPENROUTER_API_KEY) {
    console.warn("⚠️  OPENROUTER_API_KEY not set — /api/chat will return an error until it is.");
  }
});

export default app