import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const vapiKey = Deno.env.get("VAPI_PRIVATE_API_KEY");
  const assistantId = Deno.env.get("VITE_VAPI_ASSISTANT_ID");

  if (!vapiKey) {
    return new Response(
      JSON.stringify({
        error: "Vapi private API key is not configured. Add VAPI_PRIVATE_API_KEY as an Edge Function secret.",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!assistantId) {
    return new Response(
      JSON.stringify({
        error: "Vapi assistant ID is not configured. Add VITE_VAPI_ASSISTANT_ID as an Edge Function secret.",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let input = "";
  let previousChatId: string | undefined;

  try {
    const body = await req.json();
    if (typeof body.input === "string") {
      input = body.input.slice(0, 4000);
    }
    if (typeof body.previousChatId === "string") {
      previousChatId = body.previousChatId;
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!input) {
    return new Response(
      JSON.stringify({ error: "No input provided" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: Record<string, unknown> = {
      assistantId,
      input,
      stream: true,
    };
    if (previousChatId) {
      payload.previousChatId = previousChatId;
    }

    const upstream = await fetch("https://api.vapi.ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vapiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text();
      return new Response(
        JSON.stringify({ error: `Vapi chat request failed (${upstream.status}): ${errText.slice(0, 300)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pipe the SSE stream through, extracting content deltas for the frontend.
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") {
            controller.close();
            return;
          }

          try {
            const parsed = JSON.parse(data);

            // Forward content deltas to the frontend as plain text.
            if (parsed.delta && parsed.path === "chat.output.content") {
              controller.enqueue(new TextEncoder().encode(parsed.delta));
            }

            // Forward chat ID for multi-turn context.
            if (parsed.chatId) {
              controller.enqueue(
                new TextEncoder().encode(`\n__CHAT_ID__:${parsed.chatId}__END_CHAT_ID__\n`)
              );
            }
          } catch {
            // Skip malformed SSE chunks.
          }
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: `Streaming failed: ${message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
