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

export function isVapiConfigured(): boolean {
  return (
    !!VAPI_PUBLIC_KEY &&
    VAPI_PUBLIC_KEY !== 'your-vapi-public-key-here' &&
    !!VAPI_ASSISTANT_ID &&
    VAPI_ASSISTANT_ID !== 'your-vapi-assistant-id-here'
  );
}

let vapiInstance: Vapi | null = null;

export function getVapiInstance(): Vapi {
  if (!VAPI_PUBLIC_KEY || VAPI_PUBLIC_KEY === 'your-vapi-public-key-here') {
    throw new Error(
      'Vapi public key is not configured. Set VITE_VAPI_PUBLIC_KEY in your environment variables.'
    );
  }
  if (!VAPI_ASSISTANT_ID || VAPI_ASSISTANT_ID === 'your-vapi-assistant-id-here') {
    throw new Error(
      'Vapi assistant ID is not configured. Set VITE_VAPI_ASSISTANT_ID in your environment variables.'
    );
  }
  if (!vapiInstance) {
    vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
  }
  return vapiInstance;
}
