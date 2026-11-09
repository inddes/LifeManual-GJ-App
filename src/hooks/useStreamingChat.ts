import { useCallback, useRef, useState } from "react";
import { getChatEndpoint, getAuthHeaders } from '../lib/ai-client';

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
    "Namaste. I'm the LifeManual AI Assistant, here to explore mindfulness, meditation, and the wisdom of the Bhagavad Gita with you. How can I support your journey today?",
  timestamp: Date.now(),
};

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useStreamingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      const assistantId = uid();
      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        streaming: true,
      };

      // Build the history to send (exclude the empty placeholder).
      const history = [...messages, userMsg]
        .filter((m) => m.id !== 'welcome' && m.content.length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(getChatEndpoint(), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let detail = `Request failed (${response.status})`;
          try {
            const body = await response.json();
            if (body?.error) detail = body.error;
          } catch {
            /* ignore parse error */
          }
          throw new Error(detail);
        }

        if (!response.body) {
          throw new Error('No response stream received.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          );
        }

        // Mark streaming complete.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // User stopped — finalize what we have.
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m
            )
          );
        } else {
          const message = err instanceof Error ? err.message : 'Something went wrong.';
          setError(message);
          // Remove the empty placeholder if nothing was streamed.
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content || '(no response)', streaming: false }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, messages]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearConversation = useCallback(() => {
    abortRef.current?.abort();
    setError(null);
    setMessages([{ ...WELCOME, id: 'welcome', timestamp: Date.now() }]);
  }, []);

  return { messages, isStreaming, error, sendMessage, stopStreaming, clearConversation };
}
