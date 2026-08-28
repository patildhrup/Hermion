import React, { useEffect, useRef } from 'react';

export default function TranscriptStream({ transcripts = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="flex flex-col h-[450px] glass-panel overflow-hidden animate-fade-in-up" style={{animationDelay: '200ms'}}>
      <div className="px-6 py-4 border-b border-glassBorder bg-black/40 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent shadow-[0_0_8px_rgba(106,227,1,0.8)]"></span>
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-textMuted font-bold">
            Live Transcript Stream
          </span>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-accent/10 text-accent border border-accent/20">
          Agora RTC + FastAPI Agent
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth bg-black/20">
        {transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-textMuted font-mono text-sm opacity-50">
            <div className="text-3xl mb-3">💬</div>
            Say something to HERMION to start the live conversation...
          </div>
        ) : (
          transcripts.map((t, idx) => {
            const isAgent = t.speaker === 'hermion' || t.role === 'assistant';
            return (
              <div
                key={idx}
                className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} animate-fade-in-up`}
              >
                <span className="text-[10px] font-mono text-textMuted/60 mb-1.5 px-2 uppercase tracking-wider">
                  {isAgent ? 'HERMION AI' : 'You'}
                </span>
                <div
                  className={`max-w-[85%] px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-lg ${
                    isAgent
                      ? 'bg-surface/80 text-white border border-white/10 rounded-tl-sm backdrop-blur-md'
                      : 'bg-accent/90 text-black font-semibold rounded-tr-sm shadow-[0_5px_20px_rgba(106,227,1,0.25)] border border-accent/50'
                  }`}
                >
                  {t.text || t.content}
                </div>
                {t.tools_used && t.tools_used.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 px-1">
                    {t.tools_used.map((tool, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-mono px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/30 shadow-[0_0_10px_rgba(106,227,1,0.15)] flex items-center gap-1"
                      >
                        ⚡ FastMCP: {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
