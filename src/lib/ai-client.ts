/**
 * Helpers for calling the LifeManual AI Edge Functions.
 * Mirrors the existing fetch-bg-verse call style (anon key as Bearer token).
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

export function getChatEndpoint(): string {
  return `${SUPABASE_URL}/functions/v1/ai-chat`;
}

export function getRealtimeSessionEndpoint(): string {
  return `${SUPABASE_URL}/functions/v1/realtime-session`;
}

export function getAuthHeaders(): HeadersInit {
  return headers();
}
