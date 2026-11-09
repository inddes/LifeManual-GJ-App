import { useCallback, useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';
import { getVapiInstance, VAPI_ASSISTANT_ID } from '../lib/vapi-client';

export type VoiceConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error';

export interface VoiceTranscriptLine {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  final: boolean;
  timestamp: number;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useVapiVoice() {
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>('idle');
  const [transcripts, setTranscripts] = useState<VoiceTranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const vapiRef = useRef<Vapi | null>(null);
  const listenersAttachedRef = useRef(false);
  const assistantLineIdRef = useRef<string | null>(null);
  const userLineIdRef = useRef<string | null>(null);

  const appendOrUpdateTranscript = useCallback(
    (role: 'user' | 'assistant', text: string, final: boolean) => {
      const ref = role === 'user' ? userLineIdRef : assistantLineIdRef;
      if (!ref.current || final) {
        const id = uid();
        ref.current = id;
        setTranscripts((prev) => [
          ...prev,
          { id, role, text, final, timestamp: Date.now() },
        ]);
        if (final) ref.current = null;
      } else {
        const id = ref.current;
        setTranscripts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, text, final } : t))
        );
      }
    },
    []
  );

  const attachListeners = useCallback(
    (vapi: Vapi) => {
      if (listenersAttachedRef.current) return;

      vapi.on('call-start', () => {
        setConnectionState('connected');
      });

      vapi.on('call-end', () => {
        setConnectionState('idle');
        setIsAssistantSpeaking(false);
        setAudioLevel(0);
        setIsMuted(false);
      });

      vapi.on('speech-start', () => {
        setIsAssistantSpeaking(true);
        if (assistantLineIdRef.current) {
          const id = assistantLineIdRef.current;
          setTranscripts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, final: true } : t))
          );
          assistantLineIdRef.current = null;
        }
      });

      vapi.on('speech-end', () => {
        setIsAssistantSpeaking(false);
      });

      vapi.on('volume-level', (volume: number) => {
        setAudioLevel(volume);
      });

      vapi.on('message', (message: Record<string, unknown>) => {
        const type = message.type as string | undefined;
        if (type === 'transcript') {
          const role = message.role as 'user' | 'assistant';
          const transcript = message.transcript as string | undefined;
          const isFinal = message.transcriptType === 'final';
          if (transcript && role) {
            appendOrUpdateTranscript(role, transcript, isFinal);
          }
        } else if (type === 'conversation-update') {
          const delta = message.delta as string | undefined;
          if (delta) {
            appendOrUpdateTranscript('assistant', delta, false);
          }
        }
      });

      vapi.on('error', (e: Record<string, unknown>) => {
        const errorType = e.type as string | undefined;
        const message =
          (e.message as string | undefined) ??
          errorType ??
          'Voice connection error.';

        if (
          errorType === 'microphone-permission-denied' ||
          errorType === 'mic-permission-denied' ||
          (typeof message === 'string' && message.toLowerCase().includes('microphone'))
        ) {
          setError(
            'Microphone access was denied. Please allow microphone permissions in your browser settings and try again.'
          );
        } else if (errorType === 'audio-start-failed') {
          setError(
            'Could not start audio playback. Make sure you interacted with the page (e.g. clicked a button) to allow audio, then try again.'
          );
        } else {
          setError(message);
        }
        setConnectionState('error');
      });

      listenersAttachedRef.current = true;
    },
    [appendOrUpdateTranscript]
  );

  const connect = useCallback(async () => {
    if (connectionState !== 'idle' && connectionState !== 'error') return;

    setError(null);
    setConnectionState('connecting');

    try {
      const vapi = getVapiInstance();
      vapiRef.current = vapi;
      attachListeners(vapi);

      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (err) {
      let message: string;
      if (err instanceof Error) {
        const lower = err.message.toLowerCase();
        if (lower.includes('microphone') || lower.includes('permission')) {
          message =
            'Microphone access was denied. Please allow microphone permissions in your browser settings and try again.';
        } else if (lower.includes('network') || lower.includes('connection')) {
          message =
            'Could not connect to the voice service. Please check your internet connection and try again.';
        } else {
          message = err.message;
        }
      } else {
        message = 'Failed to start voice session. Please try again.';
      }
      setError(message);
      setConnectionState('error');
    }
  }, [connectionState, attachListeners]);

  const disconnect = useCallback(() => {
    const vapi = vapiRef.current;
    if (vapi) {
      try {
        vapi.stop();
      } catch {
        // Ignore errors when stopping.
      }
    }
    setConnectionState('idle');
    setIsAssistantSpeaking(false);
    setAudioLevel(0);
    setIsMuted(false);
    assistantLineIdRef.current = null;
    userLineIdRef.current = null;
  }, []);

  const interruptAssistant = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    try {
      vapi.send({
        type: 'control',
        control: 'stop',
      } as never);
    } catch {
      // Vapi supports natural barge-in — this is a best-effort explicit stop.
    }
    setIsAssistantSpeaking(false);
    if (assistantLineIdRef.current) {
      const id = assistantLineIdRef.current;
      setTranscripts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, final: true } : t))
      );
      assistantLineIdRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    const newMuted = !isMuted;
    vapi.setMuted(newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    assistantLineIdRef.current = null;
    userLineIdRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      const vapi = vapiRef.current;
      if (vapi) {
        try {
          vapi.stop();
        } catch {
          // Ignore cleanup errors.
        }
      }
    };
  }, []);

  return {
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
  };
}
