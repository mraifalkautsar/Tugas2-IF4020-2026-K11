import React, { useState, useEffect } from 'react';
import { cipherApi } from '../../api/cipherApi';
import { AvalancheResponse } from '../../types/cipher';
import { Zap, Play, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface AvalancheBenchProps {
  initialKey?: string;
  initialBlockHex?: string;
}

export const AvalancheBench: React.FC<AvalancheBenchProps> = ({
  initialKey = '',
  initialBlockHex = '',
}) => {
  const [target, setTarget] = useState<'plaintext' | 'key'>('plaintext');
  const [flipBitIndex, setFlipBitIndex] = useState<number>(0);
  const [blockHex, setBlockHex] = useState<string>(initialBlockHex);
  const [keyHex, setKeyHex] = useState<string>(initialKey);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AvalancheResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBlockHex(initialBlockHex);
  }, [initialBlockHex]);

  useEffect(() => {
    if (initialKey) {
      if (initialKey.length === 32) {
        setKeyHex(initialKey);
      } else {
        const hex = Array.from(new TextEncoder().encode(initialKey))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        setKeyHex(hex.slice(0, 32).padEnd(32, '0'));
      }
    }
  }, [initialKey]);

  const handleRunAvalanche = async () => {
    setLoading(true);
    setError(null);

    try {
      const cleanBlock = blockHex.trim();
      const cleanKey = keyHex.trim();

      if (cleanBlock.length !== 32) {
        throw new Error('Block must be exactly 32 hex characters (16 bytes)');
      }
      if (cleanKey.length !== 32) {
        throw new Error('Key must be exactly 32 hex characters (16 bytes)');
      }

      const res = await cipherApi.testAvalanche({
        target,
        block_hex: cleanBlock,
        key_hex: cleanKey,
        flip_bit_index: flipBitIndex,
      });

      setResult(res);
    } catch (err: unknown) {
      console.error('Avalanche test failed:', err);
      const msg = err instanceof Error ? err.message : 'Avalanche test failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialBlockHex && initialBlockHex.length === 32) {
      handleRunAvalanche();
    }
  }, [initialBlockHex]);

  const handleRandomize = () => {
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    if (target === 'plaintext') {
      setBlockHex(randomHex);
    } else {
      setKeyHex(randomHex);
    }
  };

  if (!initialBlockHex || initialBlockHex.length !== 32) {
    return (
      <div className="bg-white border-[2.5px] border-black p-8 sm:p-12 text-center shadow-[4px_4px_0px_#000000]">
        <Zap className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-gray-400 mb-3 stroke-[2]" />
        <p className="font-mono text-sm font-bold text-gray-700 uppercase">No Avalanche Data</p>
      </div>
    );
  }

  const byteIndex = Math.floor(flipBitIndex / 8);
  const bitOffset = 7 - (flipBitIndex % 8);

  return (
    <div className="bg-white border-[2.5px] border-black shadow-[6px_6px_0px_#000000] p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 sm:pb-4 border-b-2 border-black">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm bg-[#BE4BCE] border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_#000000]">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-black">
            Avalanche Effect
          </h3>
        </div>

        <button
          type="button"
          onClick={handleRandomize}
          className="px-2.5 sm:px-3 py-1.5 bg-[#DEC3A1] hover:bg-[#d4b58e] text-black border-2 border-black font-bold text-xs shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Randomize
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-gray-50 border-2 border-black p-3.5 sm:p-5 shadow-[3px_3px_0px_#000000]">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-black block mb-2">
              Target
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTarget('plaintext')}
                className={`flex-1 py-1.5 sm:py-2 text-xs font-mono font-bold uppercase border-2 border-black transition-all cursor-pointer ${
                  target === 'plaintext'
                    ? 'bg-[#4542E0] text-white shadow-[2px_2px_0px_#000000]'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                Plaintext
              </button>
              <button
                type="button"
                onClick={() => setTarget('key')}
                className={`flex-1 py-1.5 sm:py-2 text-xs font-mono font-bold uppercase border-2 border-black transition-all cursor-pointer ${
                  target === 'key'
                    ? 'bg-[#E75FA8] text-white shadow-[2px_2px_0px_#000000]'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                Key
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 text-xs font-mono font-bold">
              <span>Flip Bit (0 - 127):</span>
              <span className="bg-[#DEC3A1] border border-black px-1.5 py-0.5 text-[11px]">
                Bit #{flipBitIndex} (B{byteIndex}.{bitOffset})
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={127}
              value={flipBitIndex}
              onChange={(e) => setFlipBitIndex(parseInt(e.target.value, 10))}
              className="w-full accent-[#BE4BCE] cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Plaintext Block (Hex):
            </label>
            <input
              type="text"
              value={blockHex}
              onChange={(e) => setBlockHex(e.target.value)}
              className="w-full bg-white border-2 border-black px-2.5 sm:px-3 py-1.5 font-mono text-xs text-black shadow-[1px_1px_0px_#000000] focus:outline-none break-all"
              placeholder="32 hex chars"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Master Key (Hex):
            </label>
            <input
              type="text"
              value={keyHex}
              onChange={(e) => setKeyHex(e.target.value)}
              className="w-full bg-white border-2 border-black px-2.5 sm:px-3 py-1.5 font-mono text-xs text-black shadow-[1px_1px_0px_#000000] focus:outline-none break-all"
              placeholder="32 hex chars"
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleRunAvalanche}
            className="w-full py-2.5 bg-black hover:bg-gray-800 text-white font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#DEC3A1] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Test Avalanche
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-100 border-2 border-black p-3 text-xs font-mono font-bold text-rose-950 flex items-center gap-2 shadow-[2px_2px_0px_#000000]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-4 sm:space-y-6 pt-2">
          <div className="border-[2.5px] border-black p-4 sm:p-5 bg-[#DEC3A1]/30 shadow-[4px_4px_0px_#000000] flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-mono font-bold uppercase text-gray-600 block">
                Total Avalanche (Round 10)
              </span>
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className="text-4xl sm:text-5xl font-black font-mono text-black">
                  {result.total_avalanche_percentage.toFixed(2)}%
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold text-gray-600">
                  ({Math.round((result.total_avalanche_percentage / 100) * 128)} / 128 b)
                </span>
              </div>
            </div>

            <div className="border-2 border-black p-2.5 sm:p-3 bg-white shadow-[2px_2px_0px_#000000] font-mono text-[11px] sm:text-xs space-y-1 w-full md:w-auto">
              <div className="break-all">
                <span className="text-gray-500 font-bold">Orig: </span>
                <code className="text-black font-black">{result.original_ciphertext_hex}</code>
              </div>
              <div className="break-all">
                <span className="text-gray-500 font-bold">Mod:  </span>
                <code className="text-[#E75FA8] font-black">{result.modified_ciphertext_hex}</code>
              </div>
            </div>
          </div>

          <div className="border-2 border-black bg-white shadow-[4px_4px_0px_#000000] overflow-hidden">
            <div className="bg-black text-white px-3 sm:px-4 py-2 font-mono font-black text-xs uppercase flex justify-between items-center">
              <span>Round Progression</span>
              <span className="text-emerald-400">Target: ~50%</span>
            </div>

            <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
              {result.round_progression.map((r) => {
                const isNearIdeal = Math.abs(r.percentage - 50) < 10;
                return (
                  <div key={r.round} className="flex items-center gap-2 sm:gap-3 font-mono text-xs">
                    <span className="w-14 sm:w-20 font-black text-black shrink-0 text-[11px] sm:text-xs">
                      Round {r.round}:
                    </span>

                    <div className="flex-1 h-4 sm:h-5 bg-gray-100 border-2 border-black overflow-hidden relative shadow-[1px_1px_0px_#000000]">
                      <div
                        className={`h-full border-r-2 border-black transition-all duration-300 ${
                          isNearIdeal
                            ? 'bg-emerald-400'
                            : r.percentage < 25
                            ? 'bg-amber-300'
                            : 'bg-[#BE4BCE]'
                        }`}
                        style={{ width: `${Math.min(100, r.percentage)}%` }}
                      />
                    </div>

                    <span className="w-16 sm:w-24 text-right font-black text-black shrink-0 text-[11px] sm:text-xs">
                      {r.percentage.toFixed(1)}%
                    </span>
                    <span className="w-20 text-right text-gray-500 text-[10px] shrink-0 hidden md:inline">
                      ({r.bits_flipped} / 128 b)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvalancheBench;
