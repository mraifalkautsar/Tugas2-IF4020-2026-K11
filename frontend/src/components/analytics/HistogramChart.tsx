import React, { useState, useMemo, useRef } from 'react';
import { calculateHistogram } from '../../utils/cryptoHelpers';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

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

  const plainHist = useMemo(() => calculateHistogram(plainBytes), [plainBytes]);
  const cipherHist = useMemo(() => calculateHistogram(cipherBytes), [cipherBytes]);

  const nonZeroPlain = useMemo(() => {
    const list: { byte: number; count: number }[] = [];
    plainHist.forEach((count, byte) => {
      if (count > 0) list.push({ byte, count });
    });
    return list;
  }, [plainHist]);

  const nonZeroCipher = useMemo(() => {
    const list: { byte: number; count: number }[] = [];
    cipherHist.forEach((count, byte) => {
      if (count > 0) list.push({ byte, count });
    });
    return list;
  }, [cipherHist]);

  const maxPlain = useMemo(
    () => (nonZeroPlain.length > 0 ? Math.max(...nonZeroPlain.map((b) => b.count)) : 1),
    [nonZeroPlain]
  );
  const maxCipher = useMemo(
    () => (nonZeroCipher.length > 0 ? Math.max(...nonZeroCipher.map((b) => b.count)) : 1),
    [nonZeroCipher]
  );

  const plainScrollRef = useRef<HTMLDivElement>(null);
  const cipherScrollRef = useRef<HTMLDivElement>(null);

  const scrollSide = (side: 'plain' | 'cipher', delta: number) => {
    const ref = side === 'plain' ? plainScrollRef : cipherScrollRef;
    if (ref.current) {
      ref.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const isEmpty = plainBytes.length === 0 && cipherBytes.length === 0;

  if (isEmpty) {
    return (
      <div className="bg-white border-[2.5px] border-black p-8 sm:p-12 text-center shadow-[4px_4px_0px_#000000]">
        <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-gray-400 mb-3 stroke-[2]" />
        <p className="font-mono text-sm font-bold text-gray-700 uppercase">No Histogram Data</p>
      </div>
    );
  }

  const renderSingleHistogram = (
    items: { byte: number; count: number }[],
    maxVal: number,
    barColor: string,
    title: string,
    side: 'plain' | 'cipher',
    scrollRef: React.RefObject<HTMLDivElement | null>
  ) => {
    return (
      <div className="flex-1 bg-white border-[2.5px] border-black p-3.5 sm:p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-3 sm:space-y-4 overflow-hidden">
        <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b-2 border-black">
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">{title}</h4>
            <span className="text-[10px] sm:text-[11px] font-mono text-gray-500">
              {items.length} non-zero symbols • Peak: {maxVal}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => scrollSide(side, -240)}
              className="p-1 bg-white hover:bg-gray-100 border border-black shadow-[1px_1px_0px_#000000] cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollSide(side, 240)}
              className="p-1 bg-white hover:bg-gray-100 border border-black shadow-[1px_1px_0px_#000000] cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="relative h-64 sm:h-72 bg-gray-50 border-2 border-black p-2.5 sm:p-3 overflow-x-auto overflow-y-hidden shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)] select-none"
        >
          {items.length === 0 ? (
            <div className="h-full flex items-center justify-center font-mono text-xs text-gray-400">
              No non-zero bytes
            </div>
          ) : (
            <div className="flex items-end gap-2 sm:gap-2.5 h-full min-w-max pb-7">
              {items.map(({ byte, count }) => {
                const heightPct = maxVal > 0 ? (count / maxVal) * 100 : 0;
                const isHovered = hoveredByte?.side === side && hoveredByte?.byte === byte;
                const isPrintable = byte >= 32 && byte <= 126;
                const hexStr = byte.toString(16).padStart(2, '0').toUpperCase();

                return (
                  <div
                    key={byte}
                    onMouseEnter={() => setHoveredByte({ side, byte, count })}
                    onMouseLeave={() => setHoveredByte(null)}
                    className="flex flex-col items-center justify-end h-full transition-all cursor-pointer relative w-10 min-w-[40px] sm:w-12 sm:min-w-[48px]"
                  >
                    <span
                      className={`text-[9px] sm:text-[10px] font-mono font-bold mb-1 transition-opacity ${
                        isHovered ? 'opacity-100 text-black font-black' : 'opacity-70 text-gray-700'
                      }`}
                    >
                      {count}
                    </span>

                    <div
                      className={`w-full border-2 border-black transition-all ${
                        isHovered
                          ? 'bg-black shadow-[2px_2px_0px_#000000]'
                          : `${barColor} shadow-[1px_1px_0px_#000000]`
                      }`}
                      style={{
                        height: `${Math.max(14, heightPct * 0.78)}%`,
                      }}
                    />

                    <div className="absolute bottom-0 flex flex-col items-center leading-none">
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-gray-700">
                        {hexStr}
                      </span>
                      {isPrintable && (
                        <span className="text-[8px] sm:text-[9px] font-mono font-black text-black">
                          '{String.fromCharCode(byte)}'
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border-2 border-black p-2 sm:p-2.5 font-mono text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 shadow-[2px_2px_0px_#000000]">
          {hoveredByte && hoveredByte.side === side ? (
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-black text-black">
                0x{hoveredByte.byte.toString(16).padStart(2, '0').toUpperCase()}
              </span>
              {hoveredByte.byte >= 32 && hoveredByte.byte <= 126 && (
                <span className="bg-[#DEC3A1] border border-black px-1 text-[10px] font-black text-black">
                  '{String.fromCharCode(hoveredByte.byte)}'
                </span>
              )}
              <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 border border-black">
                Count: {hoveredByte.count}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 text-[10px] sm:text-[11px]">Hover over bar for details</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
      {renderSingleHistogram(
        nonZeroPlain,
        maxPlain,
        'bg-[#4542E0]',
        'Plaintext Histogram',
        'plain',
        plainScrollRef
      )}

      {renderSingleHistogram(
        nonZeroCipher,
        maxCipher,
        'bg-[#E75FA8]',
        'Ciphertext Histogram',
        'cipher',
        cipherScrollRef
      )}
    </div>
  );
};

export default HistogramChart;
