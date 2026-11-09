import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VapiChatResponse {
  id?: string;
  output?: unknown;
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

    if (!vapiKey || !assistantId) {
      return jsonResponse({ error: "The chat service is not configured." }, 503);
    }

    const body = await req.json();
    const input = typeof body?.input === "string" ? body.input.trim() : "";
    const previousChatId =
      typeof body?.previousChatId === "string" ? body.previousChatId.trim() : "";

    if (!input || input.length > 4000) {
      return jsonResponse({ error: "Please enter a message under 4000 characters." }, 400);
    }

    const payload: Record<string, string> = {
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

    const upstreamBody = (await upstream.json().catch(() => null)) as VapiChatResponse | null;
    if (!upstream.ok || !upstreamBody) {
      return jsonResponse(
        { error: "The assistant could not respond right now. Please try again." },
        502
      );
    }

    const content = getAssistantContent(upstreamBody.output).trim();
    if (!upstreamBody.id || !content) {
      return jsonResponse(
        { error: "The assistant returned an unreadable response. Please try again." },
        502
      );
    }

    return jsonResponse({ chatId: upstreamBody.id, response: content });
  } catch {
    return jsonResponse(
      { error: "The assistant could not respond right now. Please try again." },
      500
    );
  }
});
