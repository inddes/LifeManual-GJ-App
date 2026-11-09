import { useCallback, useState } from 'react';

export type MicPermissionState = 'unknown' | 'granted' | 'denied' | 'prompt' | 'unsupported';
export type MicCheckStatus = 'idle' | 'checking' | 'ok' | 'error';

export interface MicDiagnostic {
  isSecureContext: boolean;
  isInIframe: boolean;
  hasGetUserMedia: boolean;
  permissionState: MicPermissionState;
  checkStatus: MicCheckStatus;
  errorMessage: string | null;
  trackLabel: string | null;
  userTranscriptReceived: boolean;
}

const INITIAL_STATE: MicDiagnostic = {
  isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
  isInIframe: typeof window !== 'undefined' ? window.self !== window.top : false,
  hasGetUserMedia:
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function',
  permissionState: 'unknown',
  checkStatus: 'idle',
  errorMessage: null,
  trackLabel: null,
  userTranscriptReceived: false,
};

export function useMicDiagnostic() {
  const [diagnostic, setDiagnostic] = useState<MicDiagnostic>(INITIAL_STATE);

  const checkMicrophone = useCallback(async () => {
    setDiagnostic((prev) => ({ ...prev, checkStatus: 'checking', errorMessage: null }));

    const updates: Partial<MicDiagnostic> = {
      isSecureContext: window.isSecureContext,
      isInIframe: window.self !== window.top,
      hasGetUserMedia:
        !!navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function',
    };

    if (!updates.hasGetUserMedia) {
      updates.permissionState = 'unsupported';
      updates.checkStatus = 'error';
      updates.errorMessage =
        'This browser does not support microphone access. Try Chrome, Firefox, or Safari.';
      setDiagnostic((prev) => ({ ...prev, ...updates }));
      return;
    }

    if (!updates.isSecureContext) {
      updates.permissionState = 'unsupported';
      updates.checkStatus = 'error';
      updates.errorMessage =
        'Microphone requires a secure (HTTPS) connection. The current page is not served over HTTPS.';
      setDiagnostic((prev) => ({ ...prev, ...updates }));
      return;
    }

    try {
      const permissionResult = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      updates.permissionState = permissionResult.state as MicPermissionState;
    } catch {
      updates.permissionState = 'unknown';
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = stream.getAudioTracks()[0];
      updates.trackLabel = track?.label || 'Unknown device';
      updates.permissionState = 'granted';
      updates.checkStatus = 'ok';
      updates.errorMessage = null;
      track?.stop();
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      updates.checkStatus = 'error';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
          updates.permissionState = 'denied';
          if (updates.isInIframe) {
            updates.errorMessage =
              'Microphone access was blocked. This page is inside an embedded preview iframe that does not allow microphone access. Open the site in a new browser tab to use voice.';
          } else {
            updates.errorMessage =
              'Microphone permission was denied. Click the lock icon in your browser address bar, allow microphone access, and try again.';
          }
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          updates.permissionState = 'unsupported';
          updates.errorMessage =
            'No microphone device was found. Connect a microphone and try again.';
        } else if (err.name === 'NotReadableError') {
          updates.permissionState = 'unsupported';
          updates.errorMessage =
            'Your microphone is being used by another application. Close other apps that may be using it and try again.';
        } else {
          updates.permissionState = 'unknown';
          updates.errorMessage = err.message || 'Could not access the microphone.';
        }
      } else {
        updates.permissionState = 'unknown';
        updates.errorMessage = 'Could not access the microphone.';
      }
    }

    setDiagnostic((prev) => ({ ...prev, ...updates }));
  }, []);

  const setUserTranscriptReceived = useCallback((received: boolean) => {
    setDiagnostic((prev) => ({ ...prev, userTranscriptReceived: received }));
  }, []);

  const reset = useCallback(() => {
    setDiagnostic(INITIAL_STATE);
  }, []);

  return {
    diagnostic,
    checkMicrophone,
    setUserTranscriptReceived,
    reset,
  };
}
