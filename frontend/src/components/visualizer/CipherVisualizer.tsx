import React, { useState, useEffect } from 'react';
import { cipherApi } from '../../api/cipherApi';
import { Matrix4x4, TraceResponse } from '../../types/cipher';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Sparkles, 
  Key, 
  Table, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';

interface CipherVisualizerProps {
  initialKey?: string;
  initialBlockHex?: string;
}

export const CipherVisualizer: React.FC<CipherVisualizerProps> = ({
  initialKey = 'BrainrotKey676767',
  initialBlockHex = '427261696E726F744369706865723132',
}) => {
  const [keyInput, setKeyInput] = useState<string>(initialKey);
  const [blockInput, setBlockInput] = useState<string>(initialBlockHex);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentStage, setCurrentStage] = useState<'sub_bytes' | 'shift_rows' | 'mix_columns' | 'add_round_key'>('add_round_key');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [traceData, setTraceData] = useState<TraceResponse | null>(null);
  const [showKeySchedule, setShowKeySchedule] = useState<boolean>(false);
  const [showSBoxTable, setShowSBoxTable] = useState<boolean>(false);

  const normalizeTo32Hex = (str: string): string => {
    const clean = str.replace(/\s+/g, '');
    if (/^[0-9a-fA-F]{32}$/.test(clean)) {
      return clean.toLowerCase();
    }
    const bytes = new TextEncoder().encode(str);
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    return hex.slice(0, 32).padEnd(32, '0').toLowerCase();
  };

  const loadTrace = async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanBlock = normalizeTo32Hex(blockInput);
      const cleanKey = normalizeTo32Hex(keyInput);
      const res = await cipherApi.fetchTrace({
        block_hex: cleanBlock,
        key_hex: cleanKey,
        action: 'encrypt',
      });
      setTraceData(res);
    } catch (err: unknown) {
      console.warn('API trace fetch failed, generating offline visualizer mock', err);
      const mockSbox: number[][] = Array.from({ length: 16 }, (_, r) =>
        Array.from({ length: 16 }, (_, c) => (r * 16 + c * 7 + 0x67) % 256)
      );
      const mockRoundKeys: Matrix4x4[] = Array.from({ length: 11 }, (_, round) =>
        Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 4 }, (_, c) => (round * 23 + r * 17 + c * 31 + 0x42) % 256)
        )
      );
      const mockRounds = Array.from({ length: 10 }, (_, idx) => {
        const roundNum = idx + 1;
        const base = (roundNum * 19) % 256;
        return {
          round: roundNum,
          start_state: Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => (base + r * 4 + c) % 256)
          ),
          after_sub_bytes: Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => (base + r * 4 + c + 13) % 256)
          ),
          after_shift_rows: Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => (base + r * 4 + c + 27) % 256)
          ),
          after_mix_columns: Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => (base + r * 4 + c + 41) % 256)
          ),
          after_add_round_key: Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => (base + r * 4 + c + 67) % 256)
          ),
        };
      });

      setTraceData({
        sbox: mockSbox,
        round_keys: mockRoundKeys,
        rounds: mockRounds,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrace();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentRound((prev) => {
          if (prev >= 10) {
            setIsPlaying(false);
            return 1;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleRandomizeInputs = () => {
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    setBlockInput(randomHex);
  };

  const roundData = traceData?.rounds.find((r) => r.round === currentRound);
  const roundKey = traceData?.round_keys[currentRound] || [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  const getMatrixForStage = (stage: typeof currentStage): { current: Matrix4x4; prev: Matrix4x4; name: string } => {
    if (!roundData) {
      const empty: Matrix4x4 = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      return { current: empty, prev: empty, name: 'State Matrix' };
    }

    switch (stage) {
      case 'sub_bytes':
        return {
          current: roundData.after_sub_bytes,
          prev: roundData.start_state,
          name: 'SubBytes67 (S-Box Non-Linear Layer)',
        };
      case 'shift_rows':
        return {
          current: roundData.after_shift_rows,
          prev: roundData.after_sub_bytes,
          name: 'ShiftRows67 (Row Permutation Diffusion)',
        };
      case 'mix_columns':
        return {
          current: roundData.after_mix_columns,
          prev: roundData.after_shift_rows,
          name: currentRound === 10 ? 'MixColumns67 (Skipped in Round 10)' : 'MixColumns67 (MDS Matrix Diffusion)',
        };
      case 'add_round_key':
      default:
        return {
          current: roundData.after_add_round_key,
          prev: roundData.after_mix_columns,
          name: 'AddRoundKey67 (Round Key XOR Mixing)',
        };
    }
  };

  const activeStageMatrix = getMatrixForStage(currentStage);

  const renderMatrix = (matrix: Matrix4x4, prev?: Matrix4x4, accentBg = 'bg-white') => {
    return (
      <div className={`border-2 border-black p-3.5 shadow-[3px_3px_0px_#000000] ${accentBg}`}>
        <div className="grid grid-cols-4 gap-2">
          {matrix.map((row, rIdx) =>
            row.map((val, cIdx) => {
              const prevVal = prev ? prev[rIdx]?.[cIdx] : undefined;
              const hasChanged = prevVal !== undefined && prevVal !== val;
              const hexVal = (val ?? 0).toString(16).padStart(2, '0').toUpperCase();
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`h-11 flex flex-col items-center justify-center border-2 border-black font-mono transition-all ${
                    hasChanged
                      ? 'bg-[#E75FA8] text-white font-black shadow-[1px_1px_0px_#000000] scale-[1.03]'
                      : 'bg-white text-black font-bold'
                  }`}
                  title={`[Row ${rIdx}, Col ${cIdx}] Hex: 0x${hexVal} | Dec: ${val}`}
                >
                  <span className="text-xs leading-none">{hexVal}</span>
                  <span className="text-[9px] opacity-70 leading-none mt-0.5">{val}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border-[2.5px] border-black shadow-[6px_6px_0px_#000000] p-5 md:p-7 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-black">
        <div>
          <h3 className="text-lg font-black uppercase tracking-wider text-black flex items-center gap-2">
            128-Bit SPN State Transformation Visualizer
            <span className="text-[11px] font-mono font-bold bg-[#DEC3A1] border border-black px-2 py-0.5">
              10 ROUNDS
            </span>
          </h3>
          <p className="text-xs text-gray-600 font-mono">
            Interactive step-by-step matrix progression through Substitution-Permutation layers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowKeySchedule(!showKeySchedule)}
            className={`px-3 py-1.5 border-2 border-black font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer ${
              showKeySchedule ? 'bg-[#BE4BCE] text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Key Schedule ({traceData?.round_keys.length || 11})
          </button>

          <button
            type="button"
            onClick={() => setShowSBoxTable(!showSBoxTable)}
            className={`px-3 py-1.5 border-2 border-black font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer ${
              showSBoxTable ? 'bg-[#4542E0] text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            S-Box (16×16)
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border-2 border-black p-4 shadow-[2px_2px_0px_#000000] flex flex-wrap items-end gap-3 font-mono text-xs">
        <div className="flex-1 min-w-[200px]">
          <label className="font-bold text-black block mb-1 uppercase tracking-wider">
            Block Payload (16B Hex):
          </label>
          <input
            type="text"
            value={blockInput}
            onChange={(e) => setBlockInput(e.target.value)}
            className="w-full bg-white border-2 border-black px-3 py-1.5 text-xs text-black shadow-[1px_1px_0px_#000000] focus:outline-none"
            placeholder="32 hex characters"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="font-bold text-black block mb-1 uppercase tracking-wider">
            Master Secret Key:
          </label>
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className="w-full bg-white border-2 border-black px-3 py-1.5 text-xs text-black shadow-[1px_1px_0px_#000000] focus:outline-none"
            placeholder="16-byte key"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRandomizeInputs}
            className="px-3 py-1.5 bg-[#DEC3A1] hover:bg-[#cfb492] text-black border-2 border-black font-bold uppercase shadow-[2px_2px_0px_#000000] flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Rand
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={loadTrace}
            className="px-4 py-1.5 bg-black hover:bg-gray-800 text-white font-bold uppercase shadow-[2px_2px_0px_#DEC3A1] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Trace
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-100 border-2 border-black text-xs font-mono font-bold text-rose-950 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs font-black font-mono uppercase text-black mr-1">Rounds:</span>
            {Array.from({ length: 10 }).map((_, idx) => {
              const rNum = idx + 1;
              return (
                <button
                  key={rNum}
                  type="button"
                  onClick={() => setCurrentRound(rNum)}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-black transition-all cursor-pointer ${
                    currentRound === rNum
                      ? 'bg-[#4542E0] text-white shadow-[2px_2px_0px_#000000] -translate-y-0.5'
                      : 'bg-white text-black hover:bg-gray-100 shadow-[1px_1px_0px_#000000]'
                  }`}
                >
                  R{rNum}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentRound <= 1}
              onClick={() => setCurrentRound((p) => Math.max(1, p - 1))}
              className="p-1.5 bg-white hover:bg-gray-100 border-2 border-black text-black shadow-[2px_2px_0px_#000000] disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1 font-mono font-bold text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 cursor-pointer ${
                isPlaying ? 'bg-amber-300 text-black' : 'bg-emerald-300 text-black'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Auto Play
                </>
              )}
            </button>

            <button
              type="button"
              disabled={currentRound >= 10}
              onClick={() => setCurrentRound((p) => Math.min(10, p + 1))}
              className="p-1.5 bg-white hover:bg-gray-100 border-2 border-black text-black shadow-[2px_2px_0px_#000000] disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentRound(1)}
              className="p-1.5 bg-white hover:bg-gray-100 border-2 border-black text-black shadow-[2px_2px_0px_#000000] cursor-pointer"
              title="Reset to Round 1"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'sub_bytes', label: '1. SubBytes67', color: 'bg-[#DEC3A1]' },
            { id: 'shift_rows', label: '2. ShiftRows67', color: 'bg-[#EC8DD1]' },
            { id: 'mix_columns', label: '3. MixColumns67', color: 'bg-[#E75FA8]' },
            { id: 'add_round_key', label: '4. AddRoundKey67', color: 'bg-[#BE4BCE]' },
          ].map((op) => (
            <button
              key={op.id}
              type="button"
              onClick={() => setCurrentStage(op.id as typeof currentStage)}
              className={`py-2 px-2.5 font-mono font-black text-xs uppercase border-2 border-black transition-all cursor-pointer ${
                currentStage === op.id
                  ? 'bg-black text-white shadow-[3px_3px_0px_#DEC3A1] -translate-y-0.5'
                  : 'bg-white text-black hover:bg-gray-100 shadow-[1px_1px_0px_#000000]'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono font-bold">
              <span className="text-gray-600 uppercase">Input to Operation:</span>
              <span className="bg-gray-200 border border-black px-1.5 py-0.5 text-[10px]">PREV STATE</span>
            </div>
            {renderMatrix(activeStageMatrix.prev, undefined, 'bg-gray-50')}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono font-bold">
              <span className="text-gray-600 uppercase">
                {currentStage === 'add_round_key' ? `Round Key K${currentRound}:` : 'Transformation:'}
              </span>
              <span className="bg-[#DEC3A1] border border-black px-1.5 py-0.5 text-[10px]">
                {currentStage === 'add_round_key' ? 'KEY EXPANSION' : 'OPERATOR'}
              </span>
            </div>
            {currentStage === 'add_round_key' ? (
              renderMatrix(roundKey, undefined, 'bg-[#DEC3A1]/30')
            ) : (
              <div className="border-2 border-black p-4 bg-[#DEC3A1]/20 shadow-[3px_3px_0px_#000000] h-full flex flex-col justify-center items-center text-center font-mono text-xs">
                <span className="font-black text-sm uppercase text-black mb-1">{activeStageMatrix.name}</span>
                <p className="text-[11px] text-gray-700 leading-relaxed">
                  {currentStage === 'sub_bytes' && 'Each byte substituted non-linearly using the Brainrot S-Box.'}
                  {currentStage === 'shift_rows' && 'Cyclic left shifting: Row 0 by 0, Row 1 by 1, Row 2 by 2, Row 3 by 3.'}
                  {currentStage === 'mix_columns' && (currentRound === 10 ? 'MixColumns is bypassed in the final Round 10.' : 'Linear transformation over GF(2^8) multiplying each 4-byte column.')}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono font-bold">
              <span className="text-black font-black uppercase">Resulting State:</span>
              <span className="bg-emerald-200 border border-black px-1.5 py-0.5 text-[10px] font-black">
                UPDATED (PINK = CHANGED)
              </span>
            </div>
            {renderMatrix(activeStageMatrix.current, activeStageMatrix.prev, 'bg-white')}
          </div>
        </div>
      </div>

      {showKeySchedule && traceData && (
        <div className="p-4 bg-gray-50 border-2 border-black shadow-[3px_3px_0px_#000000] space-y-3 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <h4 className="text-xs font-mono font-black uppercase text-black">
              Key Schedule: 11 Expanded Round Keys (K0 - K10)
            </h4>
            <button
              type="button"
              onClick={() => setShowKeySchedule(false)}
              className="text-xs font-bold text-black hover:underline cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {traceData.round_keys.map((rk, idx) => (
              <div
                key={idx}
                className={`border-2 border-black p-2 font-mono text-[10px] ${
                  idx === currentRound ? 'bg-[#BE4BCE] text-white shadow-[2px_2px_0px_#000000]' : 'bg-white text-black'
                }`}
              >
                <div className="font-black mb-1">K{idx} {idx === 0 ? '(Whitening)' : idx === 10 ? '(Final)' : ''}</div>
                <div className="grid grid-cols-4 gap-0.5">
                  {rk.map((row) =>
                    row.map((val, c) => (
                      <div key={c} className="text-center">
                        {(val ?? 0).toString(16).padStart(2, '0').toUpperCase()}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSBoxTable && traceData && (
        <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] space-y-3 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <h4 className="text-xs font-mono font-black uppercase text-black">
              Substitution Box (S-Box 16×16 Hex Table)
            </h4>
            <button
              type="button"
              onClick={() => setShowSBoxTable(false)}
              className="text-xs font-bold text-black hover:underline cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[11px] border-collapse text-center">
              <thead>
                <tr className="bg-black text-white font-black">
                  <th className="p-1 border border-black">H\L</th>
                  {Array.from({ length: 16 }).map((_, c) => (
                    <th key={c} className="p-1 border border-black">
                      {c.toString(16).toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {traceData.sbox.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="font-black bg-black text-white p-1 border border-black">
                      {rIdx.toString(16).toUpperCase()}
                    </td>
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className="p-1 border border-gray-300 hover:bg-[#E75FA8] hover:text-white transition-colors cursor-pointer"
                        title={`S-Box[0x${rIdx.toString(16).toUpperCase()}${cIdx.toString(16).toUpperCase()}] = 0x${val.toString(16).padStart(2, '0').toUpperCase()}`}
                      >
                        {val.toString(16).padStart(2, '0').toUpperCase()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CipherVisualizer;
