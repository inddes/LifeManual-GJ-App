import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are the LifeManual AI Assistant, a warm and insightful guide rooted in the teachings of the Bhagavad Gita and broader spiritual wisdom.

Your purpose:
- Help visitors explore mindfulness, meditation, and spiritual growth.
- Share relevant Bhagavad Gita verses and teachings when they illuminate a question.
- Be encouraging, non-judgmental, and accessible to people of any background.
- Keep responses concise and conversational (2-4 short paragraphs unless depth is requested).

When referencing the Gita, mention the chapter and verse when known. Stay grounded, practical, and kind.`;

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

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    return new Response(
      JSON.stringify({
        error: "OpenAI API key is not configured. Add OPENAI_API_KEY as an Edge Function secret.",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body.messages)) {
      messages = body.messages
        .filter((m: unknown): m is ChatMessage =>
          typeof m === "object" && m !== null &&
          (m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant"
        )
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "No messages provided" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Keep conversation history bounded.
  const trimmed = messages.slice(-12);

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        stream: true,
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...trimmed,
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text();
      return new Response(
        JSON.stringify({ error: `OpenAI request failed (${upstream.status}): ${errText.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform OpenAI SSE into a plain text stream of content deltas.
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
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;

          const data = trimmedLine.slice(5).trim();
          if (data === "[DONE]") {
            controller.close();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(new TextEncoder().encode(delta));
            }
          } catch {
            // Skip malformed chunks.
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
