import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SessionResponse {
  client_secret: {
    value: string;
    expires_at: string;
  };
}

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

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "verse",
          instructions:
            "You are the LifeManual Voice Assistant, a calm, warm spiritual guide rooted in the Bhagavad Gita. Speak concisely, conversationally, and with kindness. When helpful, reference Gita teachings. Keep spoken answers short (1-3 sentences) unless the listener asks for more.",
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `Failed to create realtime session (${response.status}): ${errText.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: SessionResponse = await response.json();

    return new Response(
      JSON.stringify({
        client_secret_value: data.client_secret.value,
        expires_at: data.client_secret.expires_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: `Realtime session failed: ${message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
