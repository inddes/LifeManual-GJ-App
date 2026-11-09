import React, { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  audioLevel: number; // 0 to 1
  isActive: boolean;
  isSpeaking: boolean;
}

/**
 * A live voice-activity visualizer that renders a row of animated bars.
 * Bar heights are driven by the current microphone audio level.
 */
export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  audioLevel,
  isActive,
  isSpeaking,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelsRef = useRef<number[]>(new Array(40).fill(0));
  const audioLevelRef = useRef(audioLevel);
  const isActiveRef = useRef(isActive);
  const isSpeakingRef = useRef(isSpeaking);

  // Keep refs in sync so the animation loop reads current values.
  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bars = levelsRef.current;
      const barWidth = w / bars.length;
      const gap = barWidth * 0.3;
      const drawWidth = barWidth - gap;
      const centerY = h / 2;
      const active = isActiveRef.current;
      const speaking = isSpeakingRef.current;
      const level = audioLevelRef.current;

      // Shift levels left and add new value at the end.
      const target = active ? level * 0.8 + (speaking ? 0.2 : 0) : 0;
      bars.shift();
      bars.push(target);

      for (let i = 0; i < bars.length; i++) {
        const normalized = Math.min(bars[i], 1);
        // Idle gentle breathing when active but silent.
        const idlePulse = active
          ? 0.08 + 0.04 * Math.sin(Date.now() / 400 + i * 0.3)
          : 0.03;
        const barHeight = Math.max(normalized, Math.abs(idlePulse)) * h * 0.8;

        const x = i * barWidth + gap / 2;
        const y = centerY - barHeight / 2;

        const colorBase = speaking ? '#FF9933' : '#FFD700';
        const alpha = active ? 0.4 + normalized * 0.6 : 0.15;
        ctx.fillStyle = colorBase;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        const radius = drawWidth / 2;
        const r = Math.min(radius, barHeight / 2);
        ctx.roundRect(x, y, drawWidth, barHeight, r);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={120}
      className="w-full h-24"
      aria-hidden="true"
    />
  );
};
