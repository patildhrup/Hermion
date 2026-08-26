import React, { useEffect, useRef } from 'react';

export default function TranscriptStream({ transcripts = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="flex flex-col h-[400px] bg-[#161616] rounded-2xl border border-[#262626] overflow-hidden">
      <div className="px-5 py-3 border-b border-[#262626] bg-[#1A1A1A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#6AE301]" />
          <span className="font-mono text-xs uppercase tracking-wider text-[#A0A0A0]">
            Live Transcript Stream
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242424] text-[#888]">
          Agora RTC + FastMCP Grounding
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4">
        {transcripts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#555] font-mono text-sm">
            Say something to HERMION to start the live conversation...
          </div>
        ) : (
          transcripts.map((t, idx) => {
            const isAgent = t.speaker === 'hermion' || t.role === 'assistant';
            return (
              <div
                key={idx}
                className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} animate-fade-in`}
              >
                <span className="text-[11px] font-mono text-[#777] mb-1 px-1">
                  {isAgent ? 'HERMION AI' : 'Prospect (You)'}
                </span>
                <div
                  className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isAgent
                      ? 'bg-[#222222] text-[#F5F5F5] border border-[#333] rounded-tl-sm'
                      : 'bg-[#6AE301] text-black font-medium rounded-tr-sm shadow-[0_0_15px_rgba(106,227,1,0.2)]'
                  }`}
                >
                  {t.text || t.content}
                </div>
                {t.tools_used && t.tools_used.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {t.tools_used.map((tool, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#182B05] text-[#6AE301] border border-[#2B540A]"
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
