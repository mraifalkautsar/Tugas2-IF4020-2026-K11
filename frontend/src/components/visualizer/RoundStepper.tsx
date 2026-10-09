import React from 'react';

interface RoundStepperProps {
  currentRound: number;
  totalRounds: number;
  isPlaying: boolean;
  onSelectRound: (round: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
}

export const RoundStepper: React.FC<RoundStepperProps> = ({
  currentRound,
  totalRounds,
  isPlaying,
  onSelectRound,
  onPrev,
  onNext,
  onTogglePlay,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <span className="text-xs font-medium text-slate-400 mr-2">Round:</span>
        {Array.from({ length: totalRounds + 1 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => onSelectRound(idx)}
            className={`px-2.5 py-1 text-xs font-mono rounded transition ${
              currentRound === idx
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {idx === 0 ? 'Input' : `R${idx}`}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={currentRound === 0}
          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-mono transition"
        >
          ⏮ Prev
        </button>
        <button
          onClick={onTogglePlay}
          className="px-3 py-1.5 rounded bg-emerald-600/30 border border-emerald-500/50 hover:bg-emerald-600/40 text-emerald-300 text-xs font-mono transition"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={onNext}
          disabled={currentRound === totalRounds}
          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-mono transition"
        >
          ⏭ Next
        </button>
      </div>
    </div>
  );
};
