import { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  X,
  Send,
  PhoneOff,
  Phone,
  Volume2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Activity,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useVapiWidget } from '@vapi-ai/client-sdk-react';
import '@vapi-ai/client-sdk-react/styles';
import { useMicDiagnostic } from '../hooks/useMicDiagnostic';

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

type Tab = 'chat' | 'voice';
type ConnStatus = 'disconnected' | 'connecting' | 'connected';

export const VapiAIWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [chatInput, setChatInput] = useState('');
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const { diagnostic, checkMicrophone, setUserTranscriptReceived, reset: resetDiagnostic } =
    useMicDiagnostic();

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
      if (userTranscriptTimeoutRef.current) clearTimeout(userTranscriptTimeoutRef.current);
      userTranscriptTimeoutRef.current = setTimeout(() => {
        if (!transcriptReceivedRef.current) {
          setShowDiagnostic(true);
        }
      }, 12000);
    },
    onCallEnd: () => {
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
          setUserTranscriptReceived(true);
        }
      }
    },
    onError: (error: Error) => {
      console.error('[Vapi widget] error:', error.message);
      setShowDiagnostic(true);
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
        onTabChange={(tab) => {
          if (tab === 'voice' && activeTab === 'chat') {
            resetDiagnostic();
          }
          setActiveTab(tab);
        }}
        widget={widget}
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onClose={() => setIsOpen(false)}
        diagnostic={diagnostic}
        onCheckMic={checkMicrophone}
        showDiagnostic={showDiagnostic}
        onToggleDiagnostic={() => setShowDiagnostic(!showDiagnostic)}
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
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onClose: () => void;
  diagnostic: ReturnType<typeof useMicDiagnostic>['diagnostic'];
  onCheckMic: () => void;
  showDiagnostic: boolean;
  onToggleDiagnostic: () => void;
}> = ({ activeTab, onTabChange, widget, chatInput, onChatInputChange, onClose, diagnostic, onCheckMic, showDiagnostic, onToggleDiagnostic }) => {
  return (
    <div className="fixed bottom-20 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm bg-spiritual-cream rounded-2xl border border-spiritual-gold/30 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
      <VapiPanelHeader onClose={onClose} />
      <VapiTabs activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex flex-col flex-grow min-h-0">
        {activeTab === 'chat' ? (
          <ChatTab
            messages={widget.conversation}
            isTyping={widget.chat.isTyping}
            inputValue={chatInput}
            onInputChange={onChatInputChange}
            onSend={() => {
              if (chatInput.trim()) {
                widget.chat.sendMessage(chatInput.trim());
                onChatInputChange('');
              }
            }}
          />
        ) : (
          <VoiceTab
            voice={widget.voice}
            diagnostic={diagnostic}
            onCheckMic={onCheckMic}
            showDiagnostic={showDiagnostic}
            onToggleDiagnostic={onToggleDiagnostic}
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
  messages: ReturnType<typeof useVapiWidget>['conversation'];
  isTyping: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
}> = ({ messages, isTyping, inputValue, onInputChange, onSend }) => {
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
          disabled={!inputValue.trim()}
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
  diagnostic: ReturnType<typeof useMicDiagnostic>['diagnostic'];
  onCheckMic: () => void;
  showDiagnostic: boolean;
  onToggleDiagnostic: () => void;
}> = ({ voice, diagnostic, onCheckMic, showDiagnostic, onToggleDiagnostic }) => {
  const statusText = getVoiceStatusText(voice.connectionStatus, voice.isCallActive, voice.isSpeaking);
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
                  voice.startCall();
                }}
                disabled={!voice.isAvailable}
                className="flex items-center gap-2 bg-spiritual-gold text-spiritual-darkBrown font-body font-semibold px-6 py-3 rounded-full hover:bg-spiritual-saffron transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          {!voice.isAvailable && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 w-full">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Voice is not available. Check your configuration.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleDiagnostic}
          className="flex items-center gap-2 text-xs text-spiritual-brown/50 hover:text-spiritual-brown/70 transition-colors w-full justify-center py-2"
        >
          <Activity className="w-3.5 h-3.5" />
          {showDiagnostic ? 'Hide' : 'Show'} Microphone Diagnostic
        </button>

        {showDiagnostic && (
          <MicDiagnosticPanel diagnostic={diagnostic} onCheckMic={onCheckMic} />
        )}
      </div>
    </div>
  );
};

const MicDiagnosticPanel: React.FC<{
  diagnostic: ReturnType<typeof useMicDiagnostic>['diagnostic'];
  onCheckMic: () => void;
}> = ({ diagnostic, onCheckMic }) => {
  const statusIcon = (ok: boolean) =>
    ok ? (
      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
    ) : (
      <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
    );

  return (
    <div className="bg-spiritual-brown/5 border border-spiritual-gold/20 rounded-xl p-4 space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-heading font-bold text-spiritual-brown uppercase tracking-wide">
          Microphone Diagnostic
        </span>
        <button
          onClick={onCheckMic}
          className="text-xs text-spiritual-gold hover:text-spiritual-saffron font-medium"
        >
          Re-check
        </button>
      </div>

      <DiagnosticRow
        icon={statusIcon(diagnostic.isSecureContext)}
        label="Secure context (HTTPS)"
        value={diagnostic.isSecureContext ? 'Yes' : 'No'}
      />
      <DiagnosticRow
        icon={statusIcon(!diagnostic.isInIframe)}
        label="Not in iframe"
        value={diagnostic.isInIframe ? 'Inside iframe' : 'Direct page'}
      />
      <DiagnosticRow
        icon={statusIcon(diagnostic.hasGetUserMedia)}
        label="Microphone API"
        value={diagnostic.hasGetUserMedia ? 'Available' : 'Unsupported'}
      />
      <DiagnosticRow
        icon={
          diagnostic.permissionState === 'granted'
            ? statusIcon(true)
            : diagnostic.permissionState === 'denied'
            ? statusIcon(false)
            : <Activity className="w-4 h-4 text-amber-500 flex-shrink-0" />
        }
        label="Permission state"
        value={diagnostic.permissionState}
      />
      <DiagnosticRow
        icon={
          diagnostic.checkStatus === 'ok'
            ? statusIcon(true)
            : diagnostic.checkStatus === 'error'
            ? statusIcon(false)
            : <Activity className="w-4 h-4 text-spiritual-brown/40 flex-shrink-0" />
        }
        label="Audio input detected"
        value={
          diagnostic.checkStatus === 'ok'
            ? 'Yes'
            : diagnostic.checkStatus === 'checking'
            ? 'Checking...'
            : diagnostic.checkStatus === 'idle'
            ? 'Not checked'
            : 'No'
        }
      />
      {diagnostic.trackLabel && (
        <DiagnosticRow
          icon={<Volume2 className="w-4 h-4 text-spiritual-brown/50 flex-shrink-0" />}
          label="Microphone device"
          value={diagnostic.trackLabel}
        />
      )}
      <DiagnosticRow
        icon={
          diagnostic.userTranscriptReceived
            ? statusIcon(true)
            : <Activity className="w-4 h-4 text-amber-500 flex-shrink-0" />
        }
        label="User transcript received"
        value={diagnostic.userTranscriptReceived ? 'Yes' : 'Waiting...'}
      />

      {diagnostic.errorMessage && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 leading-relaxed">{diagnostic.errorMessage}</p>
        </div>
      )}

      {diagnostic.isInIframe && diagnostic.checkStatus === 'error' && (
        <button
          onClick={() => window.open(window.location.href, '_blank')}
          className="flex items-center gap-2 w-full justify-center bg-spiritual-brown text-spiritual-lightGold text-sm font-body font-medium px-4 py-2.5 rounded-full hover:bg-spiritual-darkBrown transition-colors mt-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open in New Tab
        </button>
      )}
    </div>
  );
};

const DiagnosticRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-spiritual-brown/70">{label}</span>
    </div>
    <span className="text-xs font-medium text-spiritual-brown capitalize">{value}</span>
  </div>
);

function getVoiceStatusText(conn: ConnStatus, isCallActive: boolean, isSpeaking: boolean): string {
  if (conn === 'connecting') return 'Connecting...';
  if (isCallActive && isSpeaking) return 'Speaking';
  if (isCallActive) return 'Listening';
  if (conn === 'connected') return 'Connected';
  return 'Idle';
}

function getVoiceStatusColor(conn: ConnStatus, isCallActive: boolean): string {
  if (conn === 'connecting') return 'bg-spiritual-saffron';
  if (isCallActive) return 'bg-green-500';
  if (conn === 'connected') return 'bg-green-400';
  return 'bg-spiritual-brown/30';
}
