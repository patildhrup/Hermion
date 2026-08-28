import React from 'react';

export default function HermionLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-[#95FF29] text-xl font-black text-black shadow-[0_0_20px_rgba(106,227,1,0.4)]">
        H
      </div>
      <div>
        <p className="font-heading text-lg font-black tracking-[0.18em] text-white">HERMION</p>
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent">Voice Work Assistant</p>
      </div>
    </div>
  );
}
