import React from 'react';
import { calculateDetailedEntropy } from '../../utils/cryptoHelpers';
import { Activity, ShieldCheck, AlertTriangle, Info, Zap } from 'lucide-react';

interface EntropyGaugeProps {
  plainBytes?: Uint8Array;
  cipherBytes?: Uint8Array;
}

export const EntropyGauge: React.FC<EntropyGaugeProps> = ({
  plainBytes = new Uint8Array(0),
  cipherBytes = new Uint8Array(0),
}) => {
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
              Shannon Information Entropy Analysis
            </h3>
            <p className="text-xs text-gray-600 font-mono">
              Empirical randomness and byte distribution density assessment
            </p>
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
                <ShieldCheck className="w-4 h-4" /> Strong Randomness
              </>
            ) : isModerate ? (
              <>
                <Zap className="w-4 h-4" /> Moderate Diffusion
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" /> Low Entropy / Biased
              </>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-black p-5 bg-[#DEC3A1]/30 shadow-[3px_3px_0px_#000000] space-y-3">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-gray-700 uppercase">
            <span>Ciphertext Entropy</span>
            <span className="font-black text-black">Target: 8.000 bits/byte</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black font-mono text-black">
              {cipherStats.entropy.toFixed(4)}
            </span>
            <span className="text-sm font-mono font-bold text-gray-600">/ 8.0000</span>
          </div>

          <div className="space-y-1">
            <div className="w-full h-4 bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_#000000]">
              <div
                className={`h-full border-r-2 border-black transition-all duration-500 ${
                  isStrong ? 'bg-emerald-400' : isModerate ? 'bg-amber-400' : 'bg-rose-400'
                }`}
                style={{ width: `${Math.min(100, cipherStats.percentageOfMax)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-gray-600">
              <span>0% (0.0 bits)</span>
              <span className="font-black text-black">{cipherStats.percentageOfMax}% of Maximum</span>
              <span>100% (8.0 bits)</span>
            </div>
          </div>
        </div>

        <div className="border-2 border-black p-5 bg-gray-50 shadow-[3px_3px_0px_#000000] space-y-3">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-gray-700 uppercase">
            <span>Plaintext Baseline Entropy</span>
            <span className="font-bold text-gray-600">Typical Natural Text: ~3.5 - 4.5</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black font-mono text-gray-700">
              {plainStats.entropy.toFixed(4)}
            </span>
            <span className="text-sm font-mono font-bold text-gray-500">/ 8.0000</span>
          </div>

          <div className="space-y-1">
            <div className="w-full h-4 bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_#000000]">
              <div
                className="h-full bg-slate-400 border-r-2 border-black transition-all duration-500"
                style={{ width: `${Math.min(100, plainStats.percentageOfMax)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-gray-600">
              <span>0%</span>
              <span className="font-bold">{plainStats.percentageOfMax}% of Maximum</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000000]">
          <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block">Total Bytes</span>
          <span className="text-lg font-black font-mono text-black">{cipherBytes.length} B</span>
        </div>

        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000000]">
          <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block">Unique Byte Symbols</span>
          <span className="text-lg font-black font-mono text-black">{cipherStats.uniqueBytes} / 256</span>
        </div>

        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000000]">
          <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block">Mean Byte Value</span>
          <span className="text-lg font-black font-mono text-black">{cipherStats.mean}</span>
          <span className="text-[9px] font-mono text-gray-500 block">(Ideal: 127.5)</span>
        </div>

        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000000]">
          <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block">Standard Deviation</span>
          <span className="text-lg font-black font-mono text-black">{cipherStats.stdDev}</span>
          <span className="text-[9px] font-mono text-gray-500 block">(Ideal: ~73.9)</span>
        </div>

        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000000]">
          <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block">Min Frequency</span>
          <span className="text-lg font-black font-mono text-black">{cipherStats.minFreq}</span>
        </div>

        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000000]">
          <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block">Max Frequency</span>
          <span className="text-lg font-black font-mono text-black">{cipherStats.maxFreq}</span>
        </div>
      </div>

      <div className="border-2 border-black p-4 bg-gray-50 shadow-[3px_3px_0px_#000000] space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono font-black uppercase text-black">
          <Info className="w-4 h-4 stroke-[2.5]" />
          <span>Chi-Square Test (χ²) for Goodness-of-Fit</span>
        </div>
        <p className="text-xs font-mono text-gray-700 leading-relaxed">
          <strong>χ² Statistic:</strong> <code className="bg-white px-1.5 py-0.5 border border-black font-bold">{cipherStats.chiSquare}</code> (Expected degrees of freedom for 256 byte buckets is 255).
          {cipherStats.entropy > 7.0
            ? ' The byte frequencies closely follow an ideal discrete uniform distribution, which is the hallmark of secure Substitution-Permutation Networks.'
            : ' Larger input sample sizes yield higher entropy convergence.'}
        </p>
      </div>
    </div>
  );
};

export default EntropyGauge;
