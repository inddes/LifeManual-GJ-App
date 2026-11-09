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
    "Namaste. I'm the LifeManual AI Assistant, here to explore mindfulness, meditation, and the wisdom of the Bhagavad Gita with you. How can I support your journey today?",
  timestamp: Date.now(),
};

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const CHAT_ID_MARKER_START = '__CHAT_ID__:';
const CHAT_ID_MARKER_END = '__END_CHAT_ID__';

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

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
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

        if (!response.ok) {
          let detail = `Request failed (${response.status})`;
          try {
            const body = await response.json();
            if (body?.error) detail = body.error;
          } catch {
            // ignore parse error
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

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          // Extract chat ID markers from the stream (for multi-turn context).
          let cleaned = accumulated;
          const markerIdx = cleaned.indexOf(CHAT_ID_MARKER_START);
          if (markerIdx !== -1) {
            const endIdx = cleaned.indexOf(CHAT_ID_MARKER_END, markerIdx);
            if (endIdx !== -1) {
              const idValue = cleaned.slice(
                markerIdx + CHAT_ID_MARKER_START.length,
                endIdx
              );
              chatIdRef.current = idValue;
              cleaned =
                cleaned.slice(0, markerIdx) + cleaned.slice(endIdx + CHAT_ID_MARKER_END.length);
            }
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: cleaned } : m
            )
          );
        }

        // Final cleanup of any remaining markers.
        let finalContent = accumulated;
        const markerIdx = finalContent.indexOf(CHAT_ID_MARKER_START);
        if (markerIdx !== -1) {
          const endIdx = finalContent.indexOf(CHAT_ID_MARKER_END, markerIdx);
          if (endIdx !== -1) {
            const idValue = finalContent.slice(
              markerIdx + CHAT_ID_MARKER_START.length,
              endIdx
            );
            chatIdRef.current = idValue;
            finalContent =
              finalContent.slice(0, markerIdx) +
              finalContent.slice(endIdx + CHAT_ID_MARKER_END.length);
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: finalContent, streaming: false } : m
          )
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m
            )
          );
        } else {
          const message = err instanceof Error ? err.message : 'Something went wrong.';
          setError(message);
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
