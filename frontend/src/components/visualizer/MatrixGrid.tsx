import React from 'react';
import { Matrix4x4 } from '../../types/cipher';

interface MatrixGridProps {
  title: string;
  subtitle?: string;
  matrix: Matrix4x4;
  prevMatrix?: Matrix4x4;
  accentColor?: 'emerald' | 'cyan' | 'violet' | 'amber';
}

export const MatrixGrid: React.FC<MatrixGridProps> = ({
  title,
  subtitle,
  matrix,
  prevMatrix,
  accentColor = 'emerald',
}) => {
  const accentBorder = {
    emerald: 'border-emerald-500/40 text-emerald-400',
    cyan: 'border-cyan-500/40 text-cyan-400',
    violet: 'border-violet-500/40 text-violet-400',
    amber: 'border-amber-500/40 text-amber-400',
  }[accentColor];

  const toHex = (val: number) => (val ?? 0).toString(16).padStart(2, '0').toUpperCase();

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-bold font-mono ${accentBorder.split(' ')[1]}`}>
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-500 font-mono">{subtitle}</span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5 font-mono text-center my-3">
          {matrix.map((row, rIdx) =>
            row.map((val, cIdx) => {
              const hasChanged = prevMatrix ? prevMatrix[rIdx][cIdx] !== val : false;
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`p-2 rounded text-xs transition-colors duration-200 border ${
                    hasChanged
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                  title={`Row: ${rIdx}, Col: ${cIdx} | Dec: ${val}`}
                >
                  {toHex(val)}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="text-[10px] text-slate-500 font-mono text-right">
        4x4 State (16 Bytes)
      </div>
    </div>
  );
};
