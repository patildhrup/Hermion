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
            barHeight = 12 + Math.abs(sin1 * sin2) * 65;
          } else if (agentStatus === 'thinking') {
            // Thinking pulse wave
            barHeight = 10 + Math.sin(phase * 2 + i * 0.4) * 25;
          } else {
            // Idle ambient breathe
            barHeight = 6 + Math.sin(phase + i * 0.1) * 10;
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
          gradient.addColorStop(0, '#555555');
          gradient.addColorStop(1, '#333333');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 5);
        ctx.fill();
        
        // Add glow effect if active
        if (isConnected) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = agentStatus === 'speaking' ? 'rgba(106, 227, 1, 0.4)' : agentStatus === 'thinking' ? 'rgba(242, 212, 44, 0.4)' : 'transparent';
        } else {
          ctx.shadowBlur = 0;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isConnected, isSpeaking, agentStatus]);

  return (
    <div className="relative w-full flex flex-col items-center justify-center p-8 glass-panel animate-fade-in-up" style={{animationDelay: '100ms'}}>
      <canvas ref={canvasRef} width={600} height={140} className="w-full max-w-xl h-32" />

      <div className="mt-6 flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-full border border-white/5 shadow-inner backdrop-blur-md">
        <span
          className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${
            agentStatus === 'speaking'
              ? 'bg-accent text-accent animate-ping'
              : agentStatus === 'thinking'
              ? 'bg-highlight text-highlight animate-pulse'
              : isConnected
              ? 'bg-accent text-accent'
              : 'bg-red-500 text-red-500'
          }`}
        />
        <span className="font-mono text-xs uppercase tracking-widest text-textMuted font-bold">
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
