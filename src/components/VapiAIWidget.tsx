import { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  X,
  Send,
  PhoneOff,
  Phone,
  AlertCircle,
  Loader2,
  Activity,
} from 'lucide-react';
import { useVapiWidget } from '@vapi-ai/client-sdk-react';
import '@vapi-ai/client-sdk-react/styles';
import { useMicDiagnostic } from '../hooks/useMicDiagnostic';
import { useVapiChat } from '../hooks/useVapiChat';

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY as string;
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID as string;

const PLACEHOLDER_VALUES = ['your-vapi-public-key-here', 'your-vapi-assistant-id-here'];

const isConfigured =
  !!VAPI_PUBLIC_KEY &&
  !PLACEHOLDER_VALUES.includes(VAPI_PUBLIC_KEY) &&
  !!VAPI_ASSISTANT_ID &&
  !PLACEHOLDER_VALUES.includes(VAPI_ASSISTANT_ID);

const WELCOME_MESSAGE =
  'Hello and welcome to LifeManual. I\u2019m your AI companion. How can I help you today?';
const VAPI_DEBUG = import.meta.env.DEV && import.meta.env.VITE_VAPI_DEBUG === 'true';

type Tab = 'chat' | 'voice';
type ConnStatus = 'disconnected' | 'connecting' | 'connected';

export const VapiAIWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [chatInput, setChatInput] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [hasEndedCall, setHasEndedCall] = useState(false);

  const { checkMicrophone, setUserTranscriptReceived } = useMicDiagnostic();
  const textChat = useVapiChat();

  const transcriptReceivedRef = useRef(false);
  const userTranscriptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const widget = useVapiWidget({
    mode: 'hybrid',
    publicKey: VAPI_PUBLIC_KEY,
    assistantId: VAPI_ASSISTANT_ID,
    firstChatMessage: WELCOME_MESSAGE,
    onCallStart: () => {
      transcriptReceivedRef.current = false;
      setUserTranscriptReceived(false);
      setVoiceError(null);
      setHasEndedCall(false);
      if (VAPI_DEBUG) {
        if (userTranscriptTimeoutRef.current) clearTimeout(userTranscriptTimeoutRef.current);
        userTranscriptTimeoutRef.current = setTimeout(() => {
          if (!transcriptReceivedRef.current) {
            console.debug('[Vapi widget] no user transcript received after 12 seconds');
          }
        }, 12000);
      }
    },
    onCallEnd: () => {
      setHasEndedCall(true);
      if (userTranscriptTimeoutRef.current) {
        clearTimeout(userTranscriptTimeoutRef.current);
        userTranscriptTimeoutRef.current = null;
      }
    },
    onMessage: (message: Record<string, unknown>) => {
      const type = message.type as string | undefined;
      if (type === 'transcript') {
        const role = message.role as string | undefined;
        if (role === 'user') {
          transcriptReceivedRef.current = true;
          if (VAPI_DEBUG) {
            setUserTranscriptReceived(true);
            console.debug('[Vapi widget] user transcript received');
          }
        }
      }
    },
    onError: (error: Error) => {
      setVoiceError(error.message || 'The voice conversation could not connect. Please try again.');
      if (import.meta.env.DEV && import.meta.env.VITE_VAPI_DEBUG === 'true') {
        console.debug('[Vapi widget] voice error:', error.message);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (userTranscriptTimeoutRef.current) {
        clearTimeout(userTranscriptTimeoutRef.current);
      }
    };
  }, []);

  if (!isConfigured) {
    return (
      <div
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-spiritual-cream/90 border border-spiritual-gold/30 px-4 py-2 shadow-lg pointer-events-none"
        role="alert"
        aria-label="AI companion unavailable"
      >
        <AlertCircle className="w-4 h-4 text-spiritual-brown/60" />
        <span className="text-xs font-body text-spiritual-brown/60">
          LifeManual AI unavailable
        </span>
      </div>
    );
  }

  return (
    <VapiFloatingButton
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      isCallActive={widget.voice.isCallActive}
      connectionStatus={widget.voice.connectionStatus}
      isSpeaking={widget.voice.isSpeaking}
    >
      <VapiPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        widget={widget}
        chat={textChat}
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onClose={() => setIsOpen(false)}
        voiceError={voiceError}
        hasEndedCall={hasEndedCall}
        onCheckMic={checkMicrophone}
      />
    </VapiFloatingButton>
  );
};

const VapiFloatingButton: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
  isCallActive: boolean;
  connectionStatus: ConnStatus;
  isSpeaking: boolean;
  children: React.ReactNode;
}> = ({ isOpen, onToggle, isCallActive, connectionStatus, isSpeaking, children }) => {
  const isActive = isCallActive || connectionStatus === 'connecting';
  return (
    <>
      {isOpen && children}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Close LifeManual AI' : 'Open LifeManual AI'}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-spiritual-brown text-spiritual-lightGold px-5 py-3 shadow-lg hover:bg-spiritual-darkBrown transition-all duration-300 hover:scale-105"
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : isActive ? (
          <>
            {isSpeaking ? (
              <Activity className="w-5 h-5 text-spiritual-gold animate-pulse" />
            ) : (
              <span className="relative flex w-3 h-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
            )}
            <span className="text-sm font-body font-semibold">AI Active</span>
          </>
        ) : (
          <>
            <MessageSquare className="w-5 h-5 text-spiritual-gold" />
            <span className="text-sm font-body font-semibold">LifeManual AI</span>
          </>
        )}
      </button>
    </>
  );
};

const VapiPanel: React.FC<{
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  widget: ReturnType<typeof useVapiWidget>;
  chat: ReturnType<typeof useVapiChat>;
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onClose: () => void;
  voiceError: string | null;
  hasEndedCall: boolean;
  onCheckMic: () => Promise<void>;
}> = ({ activeTab, onTabChange, widget, chat, chatInput, onChatInputChange, onClose, voiceError, hasEndedCall, onCheckMic }) => {
  return (
    <div className="fixed bottom-20 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm bg-spiritual-cream rounded-2xl border border-spiritual-gold/30 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
      <VapiPanelHeader onClose={onClose} />
      <VapiTabs activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex flex-col flex-grow min-h-0">
        {activeTab === 'chat' ? (
          <ChatTab
            messages={chat.messages}
            isTyping={chat.isStreaming}
            error={chat.error}
            inputValue={chatInput}
            onInputChange={onChatInputChange}
            onSend={() => {
              if (chatInput.trim()) {
                void chat.sendMessage(chatInput.trim());
                onChatInputChange('');
              }
            }}
          />
        ) : (
          <VoiceTab
            voice={widget.voice}
            voiceError={voiceError}
            hasEndedCall={hasEndedCall}
            onCheckMic={onCheckMic}
          />
        )}
      </div>
    </div>
  );
};

const VapiPanelHeader: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="flex items-center justify-between px-5 py-4 bg-spiritual-brown">
    <div className="flex items-center gap-2">
      <span className="w-8 h-8 rounded-full bg-spiritual-gold/20 flex items-center justify-center">
        <MessageSquare className="w-4 h-4 text-spiritual-gold" />
      </span>
      <h3 className="text-base font-heading font-bold text-spiritual-lightGold">
        LifeManual AI
      </h3>
    </div>
    <button
      onClick={onClose}
      aria-label="Close"
      className="text-spiritual-lightGold/60 hover:text-spiritual-lightGold transition-colors"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

const VapiTabs: React.FC<{
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}> = ({ activeTab, onTabChange }) => (
  <div className="flex border-b border-spiritual-gold/20 bg-spiritual-lightGold/30">
    <TabButton
      active={activeTab === 'chat'}
      onClick={() => onTabChange('chat')}
      icon={<MessageSquare className="w-4 h-4" />}
      label="Chat"
    />
    <TabButton
      active={activeTab === 'voice'}
      onClick={() => onTabChange('voice')}
      icon={<Mic className="w-4 h-4" />}
      label="Voice"
    />
  </div>
);

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-body font-medium transition-all duration-200 ${
      active
        ? 'text-spiritual-brown border-b-2 border-spiritual-gold bg-spiritual-cream'
        : 'text-spiritual-brown/50 hover:text-spiritual-brown/70'
    }`}
  >
    {icon}
    {label}
  </button>
);

const ChatTab: React.FC<{
  messages: ReturnType<typeof useVapiChat>['messages'];
  isTyping: boolean;
  error: string | null;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
}> = ({ messages, isTyping, error, inputValue, onInputChange, onSend }) => {
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[400px]">
      <div ref={messagesRef} className="flex-grow overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-sm text-spiritual-brown/50 max-w-[16rem] leading-relaxed">
              {WELCOME_MESSAGE}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => <ChatBubble key={msg.id || idx} role={msg.role} content={msg.content} />)
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-spiritual-gold/30 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-spiritual-gold/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-spiritual-gold/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-spiritual-gold/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-600">
            {error}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-spiritual-gold/20 bg-spiritual-cream">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Type your message..."
          className="flex-grow bg-white border border-spiritual-gold/30 rounded-full px-4 py-2.5 text-sm text-spiritual-brown placeholder:text-spiritual-brown/40 focus:outline-none focus:border-spiritual-gold focus:ring-1 focus:ring-spiritual-gold/30 transition-colors"
        />
        <button
          onClick={onSend}
          disabled={!inputValue.trim() || isTyping}
          aria-label="Send message"
          className="flex-shrink-0 w-10 h-10 rounded-full bg-spiritual-gold text-spiritual-darkBrown flex items-center justify-center hover:bg-spiritual-saffron transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ChatBubble: React.FC<{ role: string; content: string }> = ({ role, content }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-spiritual-gold text-spiritual-darkBrown rounded-tr-sm'
            : 'bg-white border border-spiritual-gold/30 text-spiritual-brown rounded-tl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
};

const VoiceTab: React.FC<{
  voice: ReturnType<typeof useVapiWidget>['voice'];
  voiceError: string | null;
  hasEndedCall: boolean;
  onCheckMic: () => Promise<void>;
}> = ({ voice, voiceError, hasEndedCall, onCheckMic }) => {
  const statusText = getVoiceStatusText(voice.connectionStatus, voice.isCallActive, voice.isSpeaking, hasEndedCall);
  const statusColor = getVoiceStatusColor(voice.connectionStatus, voice.isCallActive);

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-grow overflow-y-auto px-4 py-4">
        <div className="flex flex-col items-center gap-4 py-4">
          <div
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              voice.isCallActive
                ? voice.isSpeaking
                  ? 'bg-spiritual-saffron/30 scale-110'
                  : 'bg-spiritual-gold/20'
                : 'bg-spiritual-brown/10'
            }`}
          >
            {voice.isCallActive ? (
              <Mic className="w-8 h-8 text-spiritual-brown" />
            ) : (
              <MicOff className="w-8 h-8 text-spiritual-brown/40" />
            )}
            {voice.isSpeaking && (
              <span className="absolute inset-0 rounded-full border-2 border-spiritual-saffron animate-ping" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusColor} ${voice.isCallActive ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-body text-spiritual-brown/70">{statusText}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {!voice.isCallActive && voice.connectionStatus !== 'connecting' ? (
              <button
                onClick={async () => {
                  await onCheckMic();
                  await voice.startCall();
                }}
                className="flex items-center gap-2 bg-spiritual-gold text-spiritual-darkBrown font-body font-semibold px-6 py-3 rounded-full hover:bg-spiritual-saffron transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Start Voice Chat</span>
              </button>
            ) : voice.connectionStatus === 'connecting' ? (
              <div className="flex items-center gap-2 bg-spiritual-saffron/20 text-spiritual-brown font-body font-semibold px-6 py-3 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              <>
                <button
                  onClick={voice.toggleMute}
                  className={`flex items-center gap-2 font-body font-semibold px-4 py-3 rounded-full transition-colors ${
                    voice.isMuted
                      ? 'bg-spiritual-brown text-spiritual-lightGold'
                      : 'bg-spiritual-lightGold text-spiritual-brown border border-spiritual-gold/40'
                  }`}
                  aria-label={voice.isMuted ? 'Unmute' : 'Mute'}
                >
                  {voice.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span className="text-sm">{voice.isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                <button
                  onClick={() => voice.endCall()}
                  className="flex items-center gap-2 bg-red-500 text-white font-body font-semibold px-6 py-3 rounded-full hover:bg-red-600 transition-colors"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              </>
            )}
          </div>

          {voiceError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 w-full">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 leading-relaxed">{voiceError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getVoiceStatusText(
  conn: ConnStatus,
  isCallActive: boolean,
  isSpeaking: boolean,
  hasEndedCall: boolean,
): string {
  if (conn === 'connecting') return 'Connecting...';
  if (isCallActive && isSpeaking) return 'AI is speaking...';
  if (isCallActive) return 'Listening...';
  if (hasEndedCall) return 'Call ended';
  return 'Ready';
}

function getVoiceStatusColor(conn: ConnStatus, isCallActive: boolean): string {
  if (conn === 'connecting') return 'bg-spiritual-saffron';
  if (isCallActive) return 'bg-green-500';
  if (conn === 'connected') return 'bg-green-400';
  return 'bg-spiritual-brown/30';
}
