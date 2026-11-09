import { useCallback, useEffect, useRef, useState } from 'react';
import { getRealtimeSessionEndpoint, getAuthHeaders } from '../lib/ai-client';

export type VoiceConnectionState =
  | 'idle'
  | 'requesting-mic'
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

const EphemeralKey = 'ACTUAL_KEY'; // placeholder, replaced below

interface RealtimeSessionResponse {
  client_secret_value: string;
  expires_at: string;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const OPENAI_REALTIME_MODEL = 'gpt-4o-realtime-preview-2024-12-17';

export function useOpenAIRealtime() {
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>('idle');
  const [transcripts, setTranscripts] = useState<VoiceTranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Track the current assistant transcript id so partial deltas update it.
  const assistantLineIdRef = useRef<string | null>(null);
  const userLineIdRef = useRef<string | null>(null);

  // --- Helpers ---------------------------------------------------------------

  const createRemoteAudio = useCallback(() => {
    const el = new Audio();
    el.autoplay = true;
    remoteAudioRef.current = el;
    return el;
  }, []);

  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      // Average of frequency bins, normalized 0-1.
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const avg = sum / dataArray.length / 255;
      setAudioLevel(avg);
      animationFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const appendOrUpdateTranscript = useCallback(
    (role: 'user' | 'assistant', text: string, final: boolean) => {
      const ref = role === 'user' ? userLineIdRef : assistantLineIdRef;
      if (!ref.current || final) {
        // Start a new line.
        const id = uid();
        ref.current = id;
        setTranscripts((prev) => [
          ...prev,
          { id, role, text, final, timestamp: Date.now() },
        ]);
        if (final) ref.current = null;
      } else {
        // Update the existing partial line.
        const id = ref.current;
        setTranscripts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, text, final } : t))
        );
      }
    },
    []
  );

  const cleanup = useCallback(() => {
    stopAudioLevelMonitoring();

    if (dataChannelRef.current) {
      dataChannelRef.current.onmessage = null;
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    assistantLineIdRef.current = null;
    userLineIdRef.current = null;
  }, [stopAudioLevelMonitoring]);

  // --- Connect ----------------------------------------------------------------

  const connect = useCallback(async () => {
    if (connectionState !== 'idle' && connectionState !== 'error') return;

    setError(null);
    setConnectionState('requesting-mic');

    // 1. Get microphone access.
    let localStream: MediaStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = localStream;
    } catch {
      setError(
        'Microphone access was denied. Please allow microphone permissions and try again.'
      );
      setConnectionState('error');
      return;
    }

    setConnectionState('connecting');

    try {
      // 2. Create an ephemeral Realtime session token via our Edge Function.
      const sessionRes = await fetch(getRealtimeSessionEndpoint(), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });

      if (!sessionRes.ok) {
        let detail = `Session request failed (${sessionRes.status})`;
        try {
          const body = await sessionRes.json();
          if (body?.error) detail = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const sessionData: RealtimeSessionResponse = await sessionRes.json();
      const ephemeralKey = sessionData.client_secret_value;
      if (!ephemeralKey || ephemeralKey === EphemeralKey) {
        throw new Error('No ephemeral key returned from session endpoint.');
      }

      // 3. Create a WebRTC peer connection and connect to OpenAI Realtime.
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Set up the remote audio output.
      const remoteAudio = createRemoteAudio();
      pc.ontrack = (e) => {
        if (e.streams[0]) {
          remoteAudio.srcObject = e.streams[0];
        }
      };

      // Add the local mic track.
      localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Create a data channel for events (transcripts, interrupts, etc).
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          handleRealtimeEvent(event);
        } catch {
          /* ignore malformed events */
        }
      };

      // 4. SDP offer/answer exchange via OpenAI's WebRTC endpoint.
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`,
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            'Content-Type': 'application/sdp',
          },
        }
      );

      if (!sdpResponse.ok) {
        const errText = await sdpResponse.text();
        throw new Error(`WebRTC negotiation failed (${sdpResponse.status}): ${errText.slice(0, 200)}`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      // Monitor connection state.
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          setError('Voice connection was lost.');
          setConnectionState('error');
        }
      };

      // Start monitoring the local mic audio level for visualization.
      startAudioLevelMonitoring(localStream);
      setConnectionState('connected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start voice session.';
      setError(message);
      setConnectionState('error');
      cleanup();
    }
  }, [connectionState, createRemoteAudio, startAudioLevelMonitoring, cleanup]);

  // --- Realtime event handler -------------------------------------------------

  const handleRealtimeEvent = useCallback((event: Record<string, unknown>) {
    const type = event.type as string | undefined;

    switch (type) {
      case 'conversation.item.input_audio_transcription.completed': {
        const transcript = event.transcript as string | undefined;
        if (transcript) {
          appendOrUpdateTranscript('user', transcript, true);
        }
        break;
      }
      case 'input_audio_buffer.speech_started': {
        // Barge-in: the user started speaking, interrupt the assistant.
        setIsAssistantSpeaking(false);
        // Finalize any partial assistant transcript.
        if (assistantLineIdRef.current) {
          const id = assistantLineIdRef.current;
          setTranscripts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, final: true } : t))
          );
          assistantLineIdRef.current = null;
        }
        break;
      }
      case 'input_audio_buffer.speech_stopped': {
        break;
      }
      case 'response.output_audio.delta': {
        // Assistant is producing audio.
        setIsAssistantSpeaking(true);
        break;
      }
      case 'response.output_audio.done': {
        setIsAssistantSpeaking(false);
        break;
      }
      case 'response.audio_transcript.delta': {
        const delta = event.delta as string | undefined;
        if (delta) {
          const id = assistantLineIdRef.current;
          if (id) {
            setTranscripts((prev) =>
              prev.map((t) =>
                t.id === id ? { ...t, text: t.text + delta } : t
              )
            );
          } else {
            const newId = uid();
            assistantLineIdRef.current = newId;
            setTranscripts((prev) => [
              ...prev,
              { id: newId, role: 'assistant', text: delta, final: false, timestamp: Date.now() },
            ]);
          }
        }
        break;
      }
      case 'response.audio_transcript.done': {
        if (assistantLineIdRef.current) {
          const id = assistantLineIdRef.current;
          setTranscripts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, final: true } : t))
          );
          assistantLineIdRef.current = null;
        }
        setIsAssistantSpeaking(false);
        break;
      }
      case 'error': {
        const message = (event.error as { message?: string } | undefined)?.message ?? 'Realtime error.';
        setError(message);
        break;
      }
      default:
        break;
    }
  }, [appendOrUpdateTranscript]);

  // --- Barge-in (manual interrupt) --------------------------------------------

  const interruptAssistant = useCallback(() => {
    const dc = dataChannelRef.current;
    if (!dc || dc.readyState !== 'open') return;

    dc.send(JSON.stringify({ type: 'response.cancel' }));
    setIsAssistantSpeaking(false);

    if (assistantLineIdRef.current) {
      const id = assistantLineIdRef.current;
      setTranscripts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, final: true } : t))
      );
      assistantLineIdRef.current = null;
    }
  }, []);

  // --- Disconnect --------------------------------------------------------------

  const disconnect = useCallback(() => {
    const dc = dataChannelRef.current;
    if (dc && dc.readyState === 'open') {
      try {
        dc.send(JSON.stringify({ type: 'response.cancel' }));
      } catch {
        /* ignore */
      }
    }
    cleanup();
    setConnectionState('idle');
    setIsAssistantSpeaking(false);
  }, [cleanup]);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    assistantLineIdRef.current = null;
    userLineIdRef.current = null;
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    connectionState,
    transcripts,
    error,
    isAssistantSpeaking,
    audioLevel,
    connect,
    disconnect,
    interruptAssistant,
    clearTranscripts,
  };
}
