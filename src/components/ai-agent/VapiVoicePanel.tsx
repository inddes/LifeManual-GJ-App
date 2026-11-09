import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  AlertCircle,
  Loader2,
  Sparkles,
  Trash2,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  useVapiVoice,
  type VoiceConnectionState,
  type VoiceTranscriptLine,
} from '../../hooks/useVapiVoice';
import { isVapiConfigured } from '../../lib/vapi-client';
import { VoiceVisualizer } from './VoiceVisualizer';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const STATUS_LABELS: Record<VoiceConnectionState, { text: string; color: string }> = {
  idle: { text: 'Ready to connect', color: 'bg-spiritual-brown/30' },
  connecting: { text: 'Connecting to AI...', color: 'bg-spiritual-saffron' },
  connected: { text: 'Live', color: 'bg-green-500' },
  error: { text: 'Connection error', color: 'bg-red-500' },
};

const TranscriptLine: React.FC<{ line: VoiceTranscriptLine }> = ({ line }) => {
  const isUser = line.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-slide-up`}>
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-spiritual-gold text-spiritual-darkBrown rounded-tr-sm'
              : 'bg-white border border-spiritual-gold/30 text-spiritual-brown rounded-tl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">
            {line.text}
            {!line.final && (
              <span className="inline-block w-2 h-4 ml-1 bg-spiritual-gold animate-pulse align-middle" />
            )}
          </p>
        </div>
        <div
          className={`text-xs text-spiritual-brown/50 mt-0.5 ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {isUser ? 'You' : 'AI'} · {formatTime(line.timestamp)}
        </div>
      </div>
    </div>
  );
};

export const VapiVoicePanel: React.FC = () => {
  const {
    connectionState,
    transcripts,
    error,
    isAssistantSpeaking,
    isMuted,
    audioLevel,
    connect,
    disconnect,
    interruptAssistant,
    toggleMute,
    clearTranscripts,
  } = useVapiVoice();

  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcripts]);

  const status = STATUS_LABELS[connectionState];
  const isConnected = connectionState === 'connected';
  const isBusy = connectionState === 'connecting';
  const configured = isVapiConfigured();

  return (
    <div className="flex flex-col h-[600px] bg-spiritual-cream rounded-2xl border border-spiritual-gold/20 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-spiritual-brown">
        <div className="flex items-center space-x-2">
          <Mic className="w-5 h-5 text-spiritual-gold" />
          <h3 className="text-lg font-heading font-bold text-spiritual-lightGold">
            Voice Assistant
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${status.color} ${
              isConnected ? 'animate-pulse' : ''
            }`}
          />
          <span className="text-sm text-spiritual-lightGold/70">{status.text}</span>
        </div>
      </div>

      {/* Visualizer + controls */}
      <div className="px-6 py-6 bg-gradient-to-b from-spiritual-lightGold/50 to-spiritual-cream border-b border-spiritual-gold/20">
        <div className="flex items-center justify-center mb-4">
          <div
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected
                ? isAssistantSpeaking
                  ? 'bg-spiritual-saffron/30 scale-110'
                  : 'bg-spiritual-gold/20'
                : 'bg-spiritual-brown/10'
            }`}
          >
            {isConnected ? (
              <Mic className="w-10 h-10 text-spiritual-brown" />
            ) : (
              <MicOff className="w-10 h-10 text-spiritual-brown/40" />
            )}
            {isAssistantSpeaking && (
              <span className="absolute inset-0 rounded-full border-2 border-spiritual-saffron animate-ping" />
            )}
          </div>
        </div>

        <VoiceVisualizer
          audioLevel={audioLevel}
          isActive={isConnected}
          isSpeaking={isAssistantSpeaking}
        />

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          {!isConnected ? (
            <button
              onClick={connect}
              disabled={isBusy || !configured}
              className="flex items-center space-x-2 bg-spiritual-gold text-spiritual-darkBrown font-semibold px-6 py-3 rounded-full hover:bg-spiritual-saffron transition-colors disabled:opacity-50 disabled:cursor-not-allowed lm-focus-ring"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <PhoneIcon />
                  <span>Start Voice Chat</span>
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={toggleMute}
                className={`flex items-center space-x-2 font-semibold px-5 py-3 rounded-full transition-colors lm-focus-ring ${
                  isMuted
                    ? 'bg-spiritual-brown text-spiritual-lightGold hover:bg-spiritual-darkBrown'
                    : 'bg-spiritual-lightGold text-spiritual-brown border border-spiritual-gold/40 hover:bg-spiritual-gold/20'
                }`}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-5 h-5" />
                    <span className="hidden sm:inline">Unmute</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    <span className="hidden sm:inline">Mute</span>
                  </>
                )}
              </button>

              {isAssistantSpeaking && (
                <button
                  onClick={interruptAssistant}
                  className="flex items-center space-x-2 bg-spiritual-saffron text-white font-semibold px-5 py-3 rounded-full hover:bg-spiritual-saffron/80 transition-colors lm-focus-ring"
                >
                  <Zap className="w-5 h-5" />
                  <span>Interrupt</span>
                </button>
              )}

              <button
                onClick={disconnect}
                className="flex items-center space-x-2 bg-red-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-red-600 transition-colors lm-focus-ring"
              >
                <PhoneOff className="w-5 h-5" />
                <span>End Call</span>
              </button>
            </>
          )}
        </div>

        {!configured && (
          <div className="flex items-start space-x-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700">Voice not configured</p>
              <p className="text-sm text-amber-600">
                Add VITE_VAPI_PUBLIC_KEY and VITE_VAPI_ASSISTANT_ID to enable voice conversations.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Live transcript */}
      <div className="flex-grow overflow-y-auto px-4 py-4 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-spiritual-brown/60 uppercase tracking-wide">
            Live Transcript
          </span>
          {transcripts.length > 0 && (
            <button
              onClick={clearTranscripts}
              className="text-spiritual-brown/50 hover:text-spiritual-gold transition-colors"
              aria-label="Clear transcript"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div
          ref={transcriptRef}
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(100% - 2rem)' }}
        >
          {transcripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Sparkles className="w-8 h-8 text-spiritual-gold/40 mb-3" />
              <p className="text-sm text-spiritual-brown/40 max-w-xs">
                {isConnected
                  ? 'Start speaking and your conversation will appear here in real time.'
                  : 'Press "Start Voice Chat" to begin a two-way voice conversation with the AI assistant.'}
              </p>
            </div>
          ) : (
            transcripts.map((t) => <TranscriptLine key={t.id} line={t} />)
          )}
        </div>
      </div>
    </div>
  );
};

const PhoneIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
