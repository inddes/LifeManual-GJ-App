import Vapi from '@vapi-ai/web';

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
export const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getVapiChatEndpoint(): string {
  return `${SUPABASE_URL}/functions/v1/vapi-chat`;
}

export function getAuthHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

let vapiInstance: Vapi | null = null;

export function getVapiInstance(): Vapi {
  if (!VAPI_PUBLIC_KEY || VAPI_PUBLIC_KEY === 'your-vapi-public-key-here') {
    throw new Error(
      'Vapi public key is not configured. Set VITE_VAPI_PUBLIC_KEY in your .env file.'
    );
  }
  if (!vapiInstance) {
    vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
  }
  return vapiInstance;
}
