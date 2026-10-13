import React, { useState, useMemo, useRef } from 'react';
import { calculateHistogram } from '../../utils/cryptoHelpers';
import { BarChart3, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface HistogramChartProps {
  plainBytes?: Uint8Array;
  cipherBytes?: Uint8Array;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
  plainBytes = new Uint8Array(0),
  cipherBytes = new Uint8Array(0),
}) => {
  const [hoveredByte, setHoveredByte] = useState<{
    side: 'plain' | 'cipher';
    byte: number;
    count: number;
  } | null>(null);

  const [barWidth, setBarWidth] = useState<'normal' | 'wide'>('normal');

  const plainHist = useMemo(() => calculateHistogram(plainBytes), [plainBytes]);
  const cipherHist = useMemo(() => calculateHistogram(cipherBytes), [cipherBytes]);

  const maxPlain = useMemo(() => Math.max(...plainHist, 1), [plainHist]);
  const maxCipher = useMemo(() => Math.max(...cipherHist, 1), [cipherHist]);

  const plainScrollRef = useRef<HTMLDivElement>(null);
  const cipherScrollRef = useRef<HTMLDivElement>(null);

  const scrollSide = (side: 'plain' | 'cipher', delta: number) => {
    const ref = side === 'plain' ? plainScrollRef : cipherScrollRef;
    if (ref.current) {
      ref.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const jumpToByte = (side: 'plain' | 'cipher', targetByte: number) => {
    const ref = side === 'plain' ? plainScrollRef : cipherScrollRef;
    if (ref.current) {
      const itemWidth = barWidth === 'normal' ? 24 : 36;
      ref.current.scrollTo({ left: targetByte * itemWidth, behavior: 'smooth' });
    }
  };

  const renderSingleHistogram = (
    hist: number[],
    maxVal: number,
    barColor: string,
    title: string,
    subtitle: string,
    side: 'plain' | 'cipher',
    scrollRef: React.RefObject<HTMLDivElement | null>
  ) => {
    const widthClass = barWidth === 'normal' ? 'w-5 min-w-[20px]' : 'w-7 min-w-[28px]';

    return (
      <div className="flex-1 bg-white border-[2.5px] border-black p-4 md:p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-black">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-black">{title}</h4>
            <p className="text-[11px] font-mono text-gray-500">{subtitle}</p>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[10px] font-bold bg-[#DEC3A1] border border-black px-2 py-0.5">
              Peak: {maxVal}
            </span>
            <button
              type="button"
              onClick={() => scrollSide(side, -300)}
              className="p-1 bg-white hover:bg-gray-100 border border-black shadow-[1px_1px_0px_#000000] cursor-pointer"
              title="Scroll Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollSide(side, 300)}
              className="p-1 bg-white hover:bg-gray-100 border border-black shadow-[1px_1px_0px_#000000] cursor-pointer"
              title="Scroll Right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <span className="font-bold text-gray-500">Jump To:</span>
          <button
            type="button"
            onClick={() => jumpToByte(side, 0)}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 border border-black font-bold cursor-pointer"
          >
            0x00 (Null)
          </button>
          <button
            type="button"
            onClick={() => jumpToByte(side, 32)}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 border border-black font-bold cursor-pointer"
          >
            0x20 (Space)
          </button>
          <button
            type="button"
            onClick={() => jumpToByte(side, 65)}
            className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 border border-black font-bold text-emerald-950 cursor-pointer"
          >
            0x41 ('A')
          </button>
          <button
            type="button"
            onClick={() => jumpToByte(side, 97)}
            className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 border border-black font-bold text-emerald-950 cursor-pointer"
          >
            0x61 ('a')
          </button>
          <button
            type="button"
            onClick={() => jumpToByte(side, 128)}
            className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 border border-black font-bold text-amber-950 cursor-pointer"
          >
            0x80 (Mid)
          </button>
          <button
            type="button"
            onClick={() => jumpToByte(side, 255)}
            className="px-1.5 py-0.5 bg-rose-100 hover:bg-rose-200 border border-black font-bold text-rose-950 cursor-pointer"
          >
            0xFF (End)
          </button>
        </div>

        <div
          ref={scrollRef}
          className="relative h-72 bg-gray-50 border-2 border-black p-3 overflow-x-auto overflow-y-hidden shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)] select-none"
        >
          <div className="flex items-end gap-1 h-full min-w-max pb-7">
            {hist.map((count, byteVal) => {
              const heightPct = maxVal > 0 ? (count / maxVal) * 100 : 0;
              const isHovered = hoveredByte?.side === side && hoveredByte?.byte === byteVal;
              const isPrintable = byteVal >= 32 && byteVal <= 126;
              const hexStr = byteVal.toString(16).padStart(2, '0').toUpperCase();

              return (
                <div
                  key={byteVal}
                  onMouseEnter={() => setHoveredByte({ side, byte: byteVal, count })}
                  onMouseLeave={() => setHoveredByte(null)}
                  className={`flex flex-col items-center justify-end h-full transition-all cursor-pointer relative group ${widthClass}`}
                >
                  {count > 0 && (
                    <span
                      className={`text-[9px] font-mono font-bold mb-1 transition-opacity ${
                        isHovered ? 'opacity-100 text-black font-black' : 'opacity-60 text-gray-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}

                  <div
                    className={`w-full border-2 border-black transition-all ${
                      count === 0
                        ? 'h-1.5 bg-gray-200 border-gray-400'
                        : isHovered
                        ? 'bg-black shadow-[2px_2px_0px_#000000] scale-x-[1.05]'
                        : `${barColor} shadow-[1px_1px_0px_#000000]`
                    }`}
                    style={{
                      height: count === 0 ? '6px' : `${Math.max(12, heightPct * 0.78)}%`,
                    }}
                  />

                  <div className="absolute bottom-0 flex flex-col items-center leading-none">
                    <span className="text-[9px] font-mono font-bold text-gray-600">
                      {hexStr}
                    </span>
                    {isPrintable && (
                      <span className="text-[8px] font-mono font-black text-black">
                        {String.fromCharCode(byteVal)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border-2 border-black p-3 font-mono text-xs flex justify-between items-center shadow-[2px_2px_0px_#000000]">
          {hoveredByte && hoveredByte.side === side ? (
            <div>
              <span className="font-black text-black">
                Byte 0x{hoveredByte.byte.toString(16).padStart(2, '0').toUpperCase()} ({hoveredByte.byte})
              </span>
              {hoveredByte.byte >= 32 && hoveredByte.byte <= 126 && (
                <span className="ml-1.5 bg-[#DEC3A1] border border-black px-1.5 py-0.2 text-[10px] font-black text-black">
                  '{String.fromCharCode(hoveredByte.byte)}'
                </span>
              )}
              <span className="ml-2.5 font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 border border-black">
                Count: {hoveredByte.count} (
                {maxVal > 0 ? ((hoveredByte.count / Math.max(1, hist.reduce((a, b) => a + b, 0))) * 100).toFixed(2) : 0}%)
              </span>
            </div>
          ) : (
            <span className="text-gray-500 text-[11px]">
              Scroll horizontally (side to side) to inspect all 256 individual byte frequencies
            </span>
          )}
          <span className="text-[10px] font-bold text-gray-600">
            256 Buckets (0x00 - 0xFF)
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#DEC3A1]/30 border-[2.5px] border-black p-4 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 shrink-0 stroke-[2.5] text-black mt-0.5" />
          <div className="text-xs font-mono text-black leading-relaxed">
            <p className="font-bold uppercase tracking-wider mb-0.5">
              Side-by-Side Horizontal Scrollable Byte Histograms
            </p>
            <p className="text-gray-700">
              Plaintext (Left) displays language clustering and ASCII frequency spikes. Ciphertext (Right) diffuses
              uniformly across all 256 byte positions through Brainrot SPN rounds. Scroll side-to-side to inspect each bar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="font-bold text-black uppercase text-[11px]">Bar Width:</span>
          <button
            type="button"
            onClick={() => setBarWidth('normal')}
            className={`px-2.5 py-1 border-2 border-black text-xs font-bold transition-all cursor-pointer ${
              barWidth === 'normal'
                ? 'bg-black text-white shadow-[2px_2px_0px_#DEC3A1]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            20px
          </button>
          <button
            type="button"
            onClick={() => setBarWidth('wide')}
            className={`px-2.5 py-1 border-2 border-black text-xs font-bold transition-all cursor-pointer ${
              barWidth === 'wide'
                ? 'bg-black text-white shadow-[2px_2px_0px_#DEC3A1]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            28px (Wide)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {renderSingleHistogram(
          plainHist,
          maxPlain,
          'bg-[#4542E0]',
          'Plaintext Byte Histogram (Left)',
          'Natural language character distribution (ASCII clusters)',
          'plain',
          plainScrollRef
        )}

        {renderSingleHistogram(
          cipherHist,
          maxCipher,
          'bg-[#E75FA8]',
          'Ciphertext Byte Histogram (Right)',
          'High-diffusion discrete uniform distribution from SPN',
          'cipher',
          cipherScrollRef
        )}
      </div>
    </div>
  );
};

export default HistogramChart;
