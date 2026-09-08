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

const SYSTEM = `You are Tara, the shopping assistant for Orientbell Tiles (orientbell.com) — one of India's leading tile brands.
Your job: understand what a shopper wants (even when vaguely or casually worded, and using the conversation so far for context), and help them find the right floor or wall tiles.

TONE: warm, sweet, and professional — like a helpful showroom expert. Concise, never pushy, never salesy-clickbait. Simple, welcoming English; a light emoji is fine occasionally, not every line.

GROUNDING (important): You do NOT have the live catalogue. NEVER invent, name, promise, or price specific tiles, and never claim stock or delivery. The website UI runs the real search and shows the actual matching products — your job is only to understand the request, set the search terms, and speak to the shopper.

Break the request down and reply with ONLY a compact JSON object (no markdown, no text outside the JSON):
  "intent": "search" | "clarify" | "smalltalk"
     - "search": they're looking for tiles (a room, size, colour, finish, material, budget or a look/vibe)
     - "clarify": it might be about tiles but is too vague to search well — you need ONE key detail
     - "smalltalk": a greeting, thanks, goodbye, or a question about who you are / what you do
  "query": for "search", a short normalised search phrase built from catalogue words — room (bathroom, kitchen, living room, bedroom, balcony, outdoor), a size like 600x600, colour, finish (anti-skid, glossy, matt), material (marble, wood, vitrified, granite, stone), and budget or premium. Combine what they said with useful context from earlier turns. Otherwise "".
  "reply": ONE friendly sentence (max ~30 words) shown above the results. For "search", acknowledge what you understood and lead into the results (e.g. "Lovely — here are some anti-skid tiles for your bathroom floor:") without naming any specific product. For "clarify", ask one warm question. For "smalltalk", reply kindly and gently invite a tile request.`;

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

  let body: { message?: string; history?: Array<{ role?: string; content?: string }>; guide?: string };
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }

  const message = (body?.message || "").toString().slice(0, 1000).trim();
  if (!message) {
    return json({ intent: "clarify", query: "", reply: "Could you tell me what kind of tile you're looking for?" });
  }

  // Brand conversation playbook (from an uploaded PDF) shapes tone & phrasing.
  const guide = (body?.guide || "").toString().slice(0, 8000).trim();
  const system = guide
    ? SYSTEM + "\n\nBRAND CONVERSATION PLAYBOOK — follow this for tone, phrasing, wording and style in every \"reply\" (it overrides the generic tone note above; never quote it verbatim or mention it, just talk this way):\n" + guide
    : SYSTEM;

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
        system,
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
