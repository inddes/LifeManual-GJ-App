import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAX_REQUESTS_PER_WINDOW = 15;
const RATE_LIMIT_WINDOW_MS = 60_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VapiChatResponse {
  id?: string;
  output?: unknown;
  messages?: unknown;
}

function getAssistantContent(output: unknown): string {
  if (typeof output === "string") return output;

  if (Array.isArray(output)) {
    const assistantMessage = output.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as Record<string, unknown>).role === "assistant"
    ) as Record<string, unknown> | undefined;
    return typeof assistantMessage?.content === "string" ? assistantMessage.content : "";
  }

  if (output && typeof output === "object") {
    const content = (output as Record<string, unknown>).content;
    return typeof content === "string" ? content : "";
  }

  return "";
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function classifyUpstreamStatus(status: number): string {
  if (status === 401 || status === 403) return "authorization";
  if (status === 402 || status === 403) return "subscription";
  if (status === 404) return "assistant_not_found";
  if (status === 429) return "rate_limited";
  if (status >= 400 && status < 500) return "client_error";
  if (status >= 500) return "server_error";
  return "unknown";
}

function safeErrorDetail(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const lower = raw.toLowerCase();
  if (
    lower.includes("key") ||
    lower.includes("token") ||
    lower.includes("authorization") ||
    lower.includes("secret") ||
    lower.includes("bearer")
  ) {
    return "auth";
  }
  if (
    lower.includes("payment") ||
    lower.includes("subscribe") ||
    lower.includes("subscription") ||
    lower.includes("usage") ||
    lower.includes("quota") ||
    lower.includes("plan")
  ) {
    return "subscription";
  }
  if (lower.includes("assistant")) return "assistant";
  if (lower.includes("assistantid")) return "assistant";
  return raw.slice(0, 200);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const vapiKey = Deno.env.get("VAPI_PRIVATE_API_KEY");
    const assistantId = Deno.env.get("VITE_VAPI_ASSISTANT_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!vapiKey || !assistantId) {
      return jsonResponse({ error: "The chat service is not configured." }, 503);
    }

    const rateLimitResponse = await enforceRateLimit(req, supabaseUrl, serviceRoleKey);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const input = typeof body?.input === "string" ? body.input.trim() : "";
    const previousChatId =
      typeof body?.previousChatId === "string" ? body.previousChatId.trim() : "";

    if (!input || input.length > 4000) {
      return jsonResponse({ error: "Please enter a message under 4000 characters." }, 400);
    }

    const payload: Record<string, unknown> = {
      assistantId,
      input,
    };
    if (previousChatId) payload.previousChatId = previousChatId;

    const upstream = await fetch("https://api.vapi.ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vapiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const rawUpstreamText = await upstream.text();
    let upstreamBody: VapiChatResponse | null = null;
    try {
      upstreamBody = JSON.parse(rawUpstreamText) as VapiChatResponse;
    } catch {
      upstreamBody = null;
    }

    if (!upstream.ok || !upstreamBody) {
      const category = classifyUpstreamStatus(upstream.status);
      const detail = safeErrorDetail(
        upstreamBody
          ? ((upstreamBody as Record<string, unknown>).message ??
            (upstreamBody as Record<string, unknown>).error ??
            rawUpstreamText)
          : rawUpstreamText
      );

      const logSafe: Record<string, unknown> = {
        ok: false,
        upstreamStatus: upstream.status,
        category,
        contentType: upstream.headers.get("content-type"),
        upstreamKeys: upstreamBody
          ? Object.keys(upstreamBody as Record<string, unknown>)
          : [],
      };
      console.error("[vapi-chat] upstream failed", JSON.stringify(logSafe));

      if (category === "authorization") {
        return jsonResponse(
          { error: "Chat authentication failed. Please contact the site administrator." },
          upstream.status
        );
      }
      if (category === "subscription") {
        return jsonResponse(
          { error: "The chat service is unavailable due to a plan or usage limit. Please try again later." },
          upstream.status
        );
      }
      if (category === "assistant_not_found" || detail === "assistant") {
        return jsonResponse(
          { error: "The assistant is not available right now. Please try again later." },
          upstream.status
        );
      }
      if (category === "rate_limited") {
        return jsonResponse(
          { error: "Too many requests. Please wait a moment and try again." },
          upstream.status
        );
      }
      return jsonResponse(
        { error: "The assistant could not respond right now. Please try again." },
        upstream.status >= 400 ? upstream.status : 502
      );
    }

    const logKeys: Record<string, unknown> = {
      ok: true,
      upstreamStatus: upstream.status,
      upstreamKeys: Object.keys(upstreamBody as Record<string, unknown>),
      outputType: Array.isArray(upstreamBody.output)
        ? "array"
        : typeof upstreamBody.output,
    };
    console.log("[vapi-chat] upstream ok", JSON.stringify(logKeys));

    const content = getAssistantContent(upstreamBody.output).trim();
    if (!upstreamBody.id || !content) {
      console.error(
        "[vapi-chat] unreadable response",
        JSON.stringify({
          hasId: !!upstreamBody.id,
          hasContent: !!content,
          upstreamKeys: Object.keys(upstreamBody as Record<string, unknown>),
        })
      );
      return jsonResponse(
        { error: "The assistant returned an unreadable response. Please try again." },
        502
      );
    }

    return jsonResponse({ chatId: upstreamBody.id, response: content });
  } catch (error) {
    console.error("[vapi-chat] function error", error instanceof Error ? error.message : "unknown");
    console.error("[vapi-chat] function error", error instanceof Error ? error.message : "unknown");
    return jsonResponse(
      { error: "The assistant could not respond right now. Please try again." },
      500
    );
  }
});

async function enforceRateLimit(
  req: Request,
  supabaseUrl: string | undefined,
  serviceRoleKey: string | undefined
): Promise<Response | null> {
  if (!supabaseUrl || !serviceRoleKey) return null;

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(clientIp)
  );
  const ipHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const windowStart = new Date(
    Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS
  ).toISOString();

  try {
    const selectResp = await fetch(
      `${supabaseUrl}/rest/v1/chat_rate_limits?select=id,request_count,window_start&ip_hash=eq.${ipHash}&window_start=eq.${encodeURIComponent(windowStart)}&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    if (selectResp.ok) {
      const rows = (await selectResp.json()) as Array<{
        id: string;
        request_count: number;
        window_start: string;
      }>;
      if (rows.length > 0) {
        const row = rows[0];
        if (row.request_count >= MAX_REQUESTS_PER_WINDOW) {
          console.warn("[vapi-chat] rate limited", { ipHash, count: row.request_count });
          return jsonResponse(
            { error: "You're sending messages too quickly. Please wait a moment and try again." },
            429
          );
        }

        await fetch(`${supabaseUrl}/rest/v1/chat_rate_limits?id=eq.${row.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ request_count: row.request_count + 1 }),
        });
        return null;
      }
    }

    await fetch(`${supabaseUrl}/rest/v1/chat_rate_limits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ ip_hash: ipHash, window_start: windowStart, request_count: 1 }),
    });
  } catch (rateLimitError) {
    console.error(
      "[vapi-chat] rate limit check failed",
      rateLimitError instanceof Error ? rateLimitError.message : "unknown"
    );
  }

  return null;
}
