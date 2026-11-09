import { useCallback, useRef, useState } from 'react';
import { getVapiChatEndpoint, getAuthHeaders } from '../lib/vapi-client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  streaming?: boolean;
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello and welcome to LifeManual. I'm your AI companion. I'm here to help you reflect, explore your goals and find practical ways to make positive changes in your life. What would you like to talk about today?",
  timestamp: Date.now(),
};

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ChatResponse {
  chatId?: string;
  response?: string;
  error?: string;
}

export function useVapiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chatIdRef = useRef<string | undefined>(undefined);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setMessages((previous) => [
        ...previous,
        {
          id: uid(),
          role: 'user',
          content: trimmed,
          timestamp: Date.now(),
        },
      ]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(getVapiChatEndpoint(), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            input: trimmed,
            previousChatId: chatIdRef.current,
          }),
          signal: controller.signal,
        });

        const body = (await response.json().catch(() => null)) as Partial<ChatResponse> | null;
        if (!response.ok) {
          throw new Error(
            typeof body?.error === 'string'
              ? body.error
              : 'The assistant could not respond right now. Please try again.'
          );
        }

        const assistantContent = typeof body?.response === 'string' ? body.response.trim() : '';
        if (typeof body?.chatId !== 'string' || !assistantContent) {
          throw new Error('The assistant returned an unreadable response. Please try again.');
        }

        chatIdRef.current = body.chatId;
        setMessages((previous) => [
          ...previous,
          {
            id: uid(),
            role: 'assistant',
            content: assistantContent,
            timestamp: Date.now(),
          },
        ]);
      } catch (requestError) {
        if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'The assistant could not respond right now. Please try again.'
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearConversation = useCallback(() => {
    abortRef.current?.abort();
    setError(null);
    chatIdRef.current = undefined;
    setMessages([{ ...WELCOME, id: 'welcome', timestamp: Date.now() }]);
  }, []);

  return { messages, isStreaming, error, sendMessage, stopStreaming, clearConversation };
}
