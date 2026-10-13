import React from 'react';
import { calculateDetailedEntropy } from '../../utils/cryptoHelpers';
import { Activity, ShieldCheck, AlertTriangle, Zap } from 'lucide-react';

interface EntropyGaugeProps {
  plainBytes?: Uint8Array;
  cipherBytes?: Uint8Array;
}

export const EntropyGauge: React.FC<EntropyGaugeProps> = ({
  plainBytes = new Uint8Array(0),
  cipherBytes = new Uint8Array(0),
}) => {
  if (cipherBytes.length === 0) {
    return (
      <div className="bg-white border-[2.5px] border-black p-12 text-center shadow-[4px_4px_0px_#000000]">
        <Activity className="w-10 h-10 mx-auto text-gray-400 mb-3 stroke-[2]" />
        <p className="font-mono text-sm font-bold text-gray-700 uppercase">No Entropy Data</p>
      </div>
    );
  }

  const plainStats = calculateDetailedEntropy(plainBytes);
  const cipherStats = calculateDetailedEntropy(cipherBytes);

  const isStrong = cipherStats.entropy >= 7.2;
  const isModerate = cipherStats.entropy >= 5.5 && cipherStats.entropy < 7.2;

  return (
    <div className="bg-white border-[2.5px] border-black shadow-[6px_6px_0px_#000000] p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-black">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-[#4542E0] border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_#000000]">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-black">
              Shannon Entropy
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-black uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 ${
              isStrong
                ? 'bg-emerald-300 text-black'
                : isModerate
                ? 'bg-amber-300 text-black'
                : 'bg-rose-300 text-black'
            }`}
          >
            {isStrong ? (
              <>
                <ShieldCheck className="w-4 h-4" /> High Entropy
              </>
            ) : isModerate ? (
              <>
                <Zap className="w-4 h-4" /> Moderate Entropy
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" /> Low Entropy
              </>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-black p-5 bg-[#DEC3A1]/30 shadow-[3px_3px_0px_#000000] space-y-3">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-gray-700 uppercase">
            <span>Ciphertext Entropy</span>
            <span className="font-mono text-xs">{cipherStats.percentageOfMax}%</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black font-mono text-black">
              {cipherStats.entropy.toFixed(4)}
            </span>
            <span className="text-sm font-mono font-bold text-gray-600">/ 8.0000</span>
          </div>

          <div className="w-full h-4 bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_#000000]">
            <div
              className={`h-full border-r-2 border-black transition-all duration-500 ${
                isStrong ? 'bg-emerald-400' : isModerate ? 'bg-amber-400' : 'bg-rose-400'
              }`}
              style={{ width: `${Math.min(100, cipherStats.percentageOfMax)}%` }}
            />
          </div>
        </div>

        <div className="border-2 border-black p-5 bg-gray-50 shadow-[3px_3px_0px_#000000] space-y-3">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-gray-700 uppercase">
            <span>Plaintext Entropy</span>
            <span className="font-mono text-xs">{plainStats.percentageOfMax}%</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black font-mono text-gray-700">
              {plainStats.entropy.toFixed(4)}
            </span>
            <span className="text-sm font-mono font-bold text-gray-500">/ 8.0000</span>
          </div>

          <div className="w-full h-4 bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_#000000]">
            <div
              className="h-full bg-slate-400 border-r-2 border-black transition-all duration-500"
              style={{ width: `${Math.min(100, plainStats.percentageOfMax)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000000]">
          <span className="text-[10px] font-bold uppercase text-gray-500 block">Total Bytes</span>
          <span className="text-lg font-black text-black">{cipherBytes.length} B</span>
        </div>

        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000000]">
          <span className="text-[10px] font-bold uppercase text-gray-500 block">Unique Symbols</span>
          <span className="text-lg font-black text-black">{cipherStats.uniqueBytes} / 256</span>
        </div>

        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000000]">
          <span className="text-[10px] font-bold uppercase text-gray-500 block">Mean Value</span>
          <span className="text-lg font-black text-black">{cipherStats.mean}</span>
        </div>

        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000000]">
          <span className="text-[10px] font-bold uppercase text-gray-500 block">Chi-Square (χ²)</span>
          <span className="text-lg font-black text-black">{cipherStats.chiSquare}</span>
        </div>
      </div>
    </div>
  );
};

export default EntropyGauge;
