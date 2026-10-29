import React from 'react';

interface BridgeVisualProps {
  completedSegments: number; // 0 to 5
  currentSegmentIndex?: number; // 0 to 4
  isFinalResult?: boolean;
}

export const BridgeVisual: React.FC<BridgeVisualProps> = ({
  completedSegments,
  currentSegmentIndex = -1,
  isFinalResult = false,
}) => {
  const totalSegments = 5;

  return (
    <div className="w-full max-w-xl mx-auto bg-gradient-to-b from-sky-50 via-amber-50/30 to-emerald-50/40 rounded-2xl p-4 sm:p-6 border border-stone-200/80 shadow-sm relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-2 left-6 text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
        Communication Bridge • {completedSegments}/5 Rebuilt
      </div>

      <div className="mt-4 sm:mt-3 relative h-36 sm:h-40 w-full flex items-end justify-between px-2 sm:px-6">
        {/* Left Cliff: Learner's side */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-1 text-center">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              You (학생)
            </span>
          </div>

          {/* Learner character avatar */}
          <div
            className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-blue-500 text-white flex flex-col items-center justify-center shadow-md border-2 border-white transition-all duration-500 ${
              isFinalResult ? 'translate-x-14 sm:translate-x-24 opacity-0 scale-90' : ''
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-amber-100 border border-blue-700 flex items-center justify-center text-xs">
              🧑
            </div>
            <span className="text-[10px] font-medium mt-1">Learner</span>
          </div>

          {/* Left Cliff Base */}
          <div className="w-16 sm:w-20 h-14 bg-stone-700 rounded-tl-xl rounded-tr-md shadow-inner flex flex-col items-center justify-center border-t-4 border-stone-500">
            <span className="text-[10px] text-stone-300 font-mono">Tired</span>
          </div>
        </div>

        {/* Center: The 5 Bridge Segments */}
        <div className="flex-1 flex items-end justify-center px-1 sm:px-3 h-14 relative z-0">
          {/* Valley / River below */}
          <div className="absolute -bottom-1 inset-x-0 h-6 bg-blue-100/70 rounded-full flex items-center justify-center text-[10px] text-blue-500/80 italic font-medium">
            🌊 Misunderstanding Valley
          </div>

          {/* 5 Segment slots */}
          <div className="w-full flex items-center justify-between gap-1 sm:gap-2 mb-2 z-10">
            {Array.from({ length: totalSegments }).map((_, idx) => {
              const isBuilt = idx < completedSegments;
              const isCurrent = idx === currentSegmentIndex && !isBuilt;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <div className="text-[9px] font-semibold text-stone-600 mb-1">
                    {idx + 1}
                  </div>
                  <div
                    className={`h-5 w-full rounded-md transition-all duration-500 flex items-center justify-center shadow-sm ${
                      isBuilt
                        ? 'bg-amber-600 border-b-4 border-amber-800 text-white ring-1 ring-amber-300'
                        : isCurrent
                        ? 'bg-amber-200/80 border-2 border-dashed border-amber-500 animate-pulse'
                        : 'bg-stone-200/70 border-b-2 border-stone-300 border-dashed'
                    }`}
                  >
                    {isBuilt ? (
                      <span className="text-[10px]">🪵</span>
                    ) : isCurrent ? (
                      <span className="text-[9px] font-bold text-amber-700">✍️</span>
                    ) : (
                      <span className="text-[8px] text-stone-400">·</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* When Final Result: Learner and Mom together in center! */}
          {isFinalResult && (
            <div className="absolute -top-16 z-20 flex items-center gap-2 bg-white/95 px-4 py-2 rounded-2xl shadow-lg border border-amber-200 animate-bounce duration-1000">
              <span className="text-xl">🧑</span>
              <span className="text-sm font-bold text-stone-800">Together</span>
              <span className="text-xl">👩</span>
              <span className="text-red-500 text-sm">❤️</span>
            </div>
          )}
        </div>

        {/* Right Cliff: Mom's side */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-1 text-center">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              Mom (엄마)
            </span>
          </div>

          {/* Mom character avatar */}
          <div
            className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-rose-500 text-white flex flex-col items-center justify-center shadow-md border-2 border-white transition-all duration-500 ${
              isFinalResult ? '-translate-x-14 sm:-translate-x-24 opacity-0 scale-90' : ''
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-amber-100 border border-rose-700 flex items-center justify-center text-xs">
              👩
            </div>
            <span className="text-[10px] font-medium mt-1">Mom</span>
          </div>

          {/* Right Cliff Base */}
          <div className="w-16 sm:w-20 h-14 bg-stone-700 rounded-tl-md rounded-tr-xl shadow-inner flex flex-col items-center justify-center border-t-4 border-stone-500">
            <span className="text-[10px] text-stone-300 font-mono">Worried</span>
          </div>
        </div>
      </div>
    </div>
  );
};
