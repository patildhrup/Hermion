import React, { useEffect, useRef } from 'react';

export default function WaveformCanvas({ isConnected, isSpeaking, agentStatus }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const bars = 36;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const barWidth = width / (bars * 1.8);
      const gap = barWidth * 0.8;
      const startX = (width - (bars * (barWidth + gap))) / 2;

      phase += 0.08;

      for (let i = 0; i < bars; i++) {
        let barHeight = 6;

        if (isConnected) {
          if (agentStatus === 'speaking' || isSpeaking) {
            // Dynamic waveform
            const sin1 = Math.sin(phase + i * 0.25);
            const sin2 = Math.cos(phase * 1.5 + i * 0.15);
            barHeight = 12 + Math.abs(sin1 * sin2) * 55;
          } else if (agentStatus === 'thinking') {
            // Thinking pulse wave
            barHeight = 10 + Math.sin(phase * 2 + i * 0.4) * 20;
          } else {
            // Idle ambient breathe
            barHeight = 6 + Math.sin(phase + i * 0.1) * 8;
          }
        }

        const x = startX + i * (barWidth + gap);
        const y = centerY - barHeight / 2;

        // Color coding
        let gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (agentStatus === 'speaking') {
          gradient.addColorStop(0, '#6AE301');
          gradient.addColorStop(1, '#95FF29');
        } else if (agentStatus === 'thinking') {
          gradient.addColorStop(0, '#F2D42C');
          gradient.addColorStop(1, '#FFE866');
        } else {
          gradient.addColorStop(0, '#444444');
          gradient.addColorStop(1, '#222222');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isConnected, isSpeaking, agentStatus]);

  return (
    <div className="relative w-full flex flex-col items-center justify-center p-6 bg-[#161616] rounded-2xl border border-[#262626] shadow-2xl">
      <canvas ref={canvasRef} width={600} height={120} className="w-full max-w-xl h-28" />

      <div className="mt-4 flex items-center gap-3">
        <span
          className={`w-3 h-3 rounded-full ${
            agentStatus === 'speaking'
              ? 'bg-[#6AE301] animate-ping'
              : agentStatus === 'thinking'
              ? 'bg-[#F2D42C] animate-pulse'
              : isConnected
              ? 'bg-[#6AE301]'
              : 'bg-red-500'
          }`}
        />
        <span className="font-mono text-xs uppercase tracking-widest text-[#A0A0A0]">
          {agentStatus === 'speaking'
            ? 'HERMION Speaking...'
            : agentStatus === 'thinking'
            ? 'HERMION Processing & MCP Tool Query...'
            : isConnected
            ? 'Listening (Barge-in active)...'
            : 'Disconnected'}
        </span>
      </div>
    </div>
  );
}
