// Supabase Edge Function: tara-chat
// ---------------------------------------------------------------------------
// Gives Tara AI a Claude-powered conversational layer while keeping the
// Anthropic API key server-side (browsers must never hold it).
//
// The browser POSTs { message, history } here. This function asks Claude to
// (a) classify the intent, (b) normalise the request into a tile search
// phrase, and (c) write one friendly sentence. It returns a small JSON object.
// The Tara UI then runs its own catalogue search to show the real product
// cards — Claude never sees or invents inventory, so it can't hallucinate
// tiles, prices, or stock.
//
// Deploy:
//   supabase functions deploy tara-chat --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Then paste the function's URL into AI_ENDPOINT in the Tara HTML.
// ---------------------------------------------------------------------------

// Switch to "claude-haiku-4-5" for the lowest cost + fastest replies (best for
// a high-traffic shopping bot), or "claude-sonnet-5" for a middle ground.
const MODEL = "claude-opus-5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are Tara, the friendly shopping assistant for Orientbell Tiles (orientbell.com).
Your only job is to help shoppers find floor and wall tiles and to understand vague or messy requests.
You do NOT have the live catalogue and must NEVER invent, name, or promise specific tiles, prices, stock, or delivery — the website UI shows the real matching tiles itself.
Reply with ONLY a compact JSON object (no markdown, no text outside the JSON) with these fields:
  "intent": "search" | "clarify" | "smalltalk"
     - "search": the shopper is looking for tiles (a room, size, colour, finish, material, budget, or look)
     - "clarify": it may be about tiles but is too vague to search — you need one more detail
     - "smalltalk": a greeting, thanks, goodbye, or a question about who you are / what you do
  "query": when intent is "search", a short normalised search phrase using tile words (room, a size like 600x600, colour, finish like anti-skid/glossy/matt, material like marble/wood/vitrified, and budget or premium). Otherwise "".
  "reply": ONE warm, concise sentence (max ~30 words) to show the shopper. For "search" keep it general (e.g. "Sure — here are some bathroom floor tiles you'll like:") and never name a specific product. For "clarify" ask one friendly question. For "smalltalk" respond kindly and invite a tile request.
Use simple, welcoming English.`;

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "missing ANTHROPIC_API_KEY" }, 500);

  let body: { message?: string; history?: Array<{ role?: string; content?: string }> };
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }

  const message = (body?.message || "").toString().slice(0, 1000).trim();
  if (!message) {
    return json({ intent: "clarify", query: "", reply: "Could you tell me what kind of tile you're looking for?" });
  }

  const msgs: Array<{ role: string; content: string }> = [];
  if (Array.isArray(body.history)) {
    for (const h of body.history.slice(-6)) {
      if (h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string") {
        msgs.push({ role: h.role, content: h.content.slice(0, 1000) });
      }
    }
  }
  msgs.push({ role: "user", content: message });

  let r: Response;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM,
        messages: msgs,
      }),
    });
  } catch (e) {
    return json({ error: "network", detail: String(e) }, 502);
  }
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    return json({ error: "upstream", status: r.status, detail: detail.slice(0, 300) }, 502);
  }

  const data = await r.json();
  const text = (data.content || [])
    .filter((bl: { type?: string }) => bl.type === "text")
    .map((bl: { text?: string }) => bl.text || "")
    .join("")
    .trim();

  let out: { intent?: string; query?: string; reply?: string } | null = null;
  try { out = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")); } catch { out = null; }
  if (!out || typeof out !== "object") {
    // If the model didn't return clean JSON, treat the message as a search.
    out = { intent: "search", query: message, reply: "" };
  }
  return json({
    intent: out.intent || "search",
    query: out.query || "",
    reply: out.reply || "",
  });
});
