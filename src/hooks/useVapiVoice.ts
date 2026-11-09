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

  const connect = useCallback(async () => {
    if (connectionState !== 'idle' && connectionState !== 'error') return;

    setError(null);
    setConnectionState('connecting');

    try {
      const vapi = getVapiInstance();
      vapiRef.current = vapi;

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
        // Barge-in: user started speaking, finalize any partial assistant transcript.
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
          // Handle conversation-level transcript updates if available.
          const delta = message.delta as string | undefined;
          if (delta) {
            appendOrUpdateTranscript('assistant', delta, false);
          }
        }
      });

      vapi.on('error', (e: Record<string, unknown>) => {
        const message =
          (e.message as string | undefined) ??
          (e.type as string | undefined) ??
          'Voice connection error.';
        setError(message);
        setConnectionState('error');
      });

      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start voice session.';
      setError(message);
      setConnectionState('error');
    }
  }, [connectionState, appendOrUpdateTranscript]);

  const disconnect = useCallback(() => {
    const vapi = vapiRef.current;
    if (vapi) {
      vapi.stop();
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
    // Vapi handles barge-in natively; stop the assistant's current response.
    try {
      vapi.send({
        type: 'control',
        control: 'stop',
      } as never);
    } catch {
      // If control message fails, the SDK still supports natural barge-in.
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
        vapi.stop();
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
