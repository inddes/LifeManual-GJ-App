import React, { useEffect, useRef, useState } from 'react';
import { Send, Trash2, Square, Sparkles, AlertCircle } from 'lucide-react';
import { useVapiChat, type ChatMessage } from '../../hooks/useVapiChat';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-spiritual-gold/20 flex items-center justify-center mr-3 mt-1">
          <Sparkles className="w-4 h-4 text-spiritual-gold" />
        </div>
      )}
      <div className={`max-w-[78%] sm:max-w-[70%]`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-spiritual-gold text-spiritual-darkBrown rounded-tr-sm'
              : 'bg-white border border-spiritual-gold/30 text-spiritual-brown rounded-tl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.content}
            {message.streaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-spiritual-gold animate-pulse align-middle" />
            )}
          </p>
        </div>
        <div
          className={`text-xs text-spiritual-brown/50 mt-1 ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-spiritual-saffron/20 flex items-center justify-center ml-3 mt-1">
          <span className="text-xs font-bold text-spiritual-saffron">You</span>
        </div>
      )}
    </div>
  );
};

export const VapiChatPanel: React.FC = () => {
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearConversation } =
    useVapiChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[600px] bg-spiritual-cream rounded-2xl border border-spiritual-gold/20 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-spiritual-brown">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-spiritual-gold" />
          <h3 className="text-lg font-heading font-bold text-spiritual-lightGold">
            Text Chat
          </h3>
        </div>
        <button
          onClick={clearConversation}
          className="flex items-center space-x-1.5 text-sm text-spiritual-lightGold/70 hover:text-spiritual-gold transition-colors lm-focus-ring"
          aria-label="Clear conversation"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-grow overflow-y-auto px-4 py-4 scroll-smooth"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {error && (
          <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Something went wrong</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 bg-white border-t border-spiritual-gold/20">
        <div className="flex items-end space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask about the Gita, meditation, mindfulness..."
            rows={1}
            className="flex-grow resize-none rounded-xl border border-spiritual-gold/40 bg-spiritual-cream/50 px-4 py-2.5 text-sm text-spiritual-brown placeholder:text-spiritual-brown/40 lm-focus-ring max-h-32"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="flex-shrink-0 w-11 h-11 rounded-xl bg-spiritual-brown text-spiritual-lightGold flex items-center justify-center hover:bg-spiritual-darkBrown transition-colors lm-focus-ring"
              aria-label="Stop generating"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex-shrink-0 w-11 h-11 rounded-xl bg-spiritual-gold text-spiritual-darkBrown flex items-center justify-center hover:bg-spiritual-saffron transition-colors disabled:opacity-40 disabled:cursor-not-allowed lm-focus-ring"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-spiritual-brown/40 mt-2">
          Press Enter to send, Shift+Enter for a new line.
        </p>
      </form>
    </div>
  );
};
