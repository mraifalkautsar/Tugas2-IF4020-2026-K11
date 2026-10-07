import React, { useState } from 'react';
import { Copy, Check, Download, ArrowUpRight, Cpu, Sparkles } from 'lucide-react';

export interface CipherResult {
  action: 'encrypt' | 'decrypt';
  mode: string;
  padding: string;
  outputHex: string;
  outputBase64: string;
  plainTextPreview?: string;
  bytesCount: number;
  blocksCount: number;
  entropy?: number;
  elapsedMs?: number;
  timestamp: string;
}

interface CipherResultCardProps {
  result: CipherResult;
  onUseAsInput: (hexOrText: string) => void;
  onClose: () => void;
}

export const CipherResultCard: React.FC<CipherResultCardProps> = ({
  result,
  onUseAsInput,
  onClose,
}) => {
  const [copiedHex, setCopiedHex] = useState(false);
  const [copiedBase64, setCopiedBase64] = useState(false);
  const [activeView, setActiveView] = useState<'hex' | 'base64' | 'raw'>('hex');

  const copyToClipboard = (text: string, type: 'hex' | 'base64') => {
    navigator.clipboard.writeText(text);
    if (type === 'hex') {
      setCopiedHex(true);
      setTimeout(() => setCopiedHex(false), 2000);
    } else {
      setCopiedBase64(true);
      setTimeout(() => setCopiedBase64(false), 2000);
    }
  };

  const handleDownloadOutput = () => {
    const blob = new Blob([result.outputHex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainrot-${result.action}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isEncrypt = result.action === 'encrypt';

  return (
    <div className="bg-white border-[2.5px] border-black shadow-[6px_6px_0px_#000000] p-5 md:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-sm border-2 border-black flex items-center justify-center text-white font-bold shadow-[2px_2px_0px_#000000] ${
              isEncrypt ? 'bg-[#4542E0]' : 'bg-[#E75FA8]'
            }`}
          >
            <Cpu className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-black flex items-center gap-2">
              {isEncrypt ? 'Ciphertext Output' : 'Decrypted Plaintext Output'}
              <span
                className={`text-[10px] font-mono px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000000] ${
                  isEncrypt ? 'bg-[#DEC3A1] text-black' : 'bg-emerald-200 text-black'
                }`}
              >
                {result.mode} • {result.padding}
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 font-mono">
              Processed in {result.elapsedMs || 1.2} ms • Entropy: {result.entropy ?? 7.98} bits/byte
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadOutput}
            className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-black border-2 border-black font-bold text-xs shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Save File
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-black border-2 border-black font-bold text-xs shadow-[2px_2px_0px_#000000] transition-all"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Format Selector Pills */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveView('hex')}
            className={`px-3 py-1 text-xs font-mono font-bold border-2 border-black transition-all ${
              activeView === 'hex'
                ? 'bg-[#BE4BCE] text-white shadow-[2px_2px_0px_#000000]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Hex View
          </button>
          <button
            type="button"
            onClick={() => setActiveView('base64')}
            className={`px-3 py-1 text-xs font-mono font-bold border-2 border-black transition-all ${
              activeView === 'base64'
                ? 'bg-[#BE4BCE] text-white shadow-[2px_2px_0px_#000000]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Base64 View
          </button>
          {result.plainTextPreview && (
            <button
              type="button"
              onClick={() => setActiveView('raw')}
              className={`px-3 py-1 text-xs font-mono font-bold border-2 border-black transition-all ${
                activeView === 'raw'
                  ? 'bg-[#BE4BCE] text-white shadow-[2px_2px_0px_#000000]'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Plaintext String
            </button>
          )}
        </div>

        <div className="text-xs font-mono text-gray-700 bg-[#DEC3A1]/50 border border-black px-2 py-0.5">
          {result.bytesCount} Bytes | {result.blocksCount} Blocks
        </div>
      </div>

      {/* Output Content Area */}
      <div className="relative bg-gray-50 border-2 border-black p-4 font-mono text-xs text-black break-all shadow-[inset_2px_2px_0px_rgba(0,0,0,0.06)] min-h-[90px] max-h-[220px] overflow-y-auto">
        {activeView === 'hex' && (
          <div className="space-y-1">
            <span className="text-gray-400 select-none block text-[10px] uppercase font-bold">
              // Hex Stream ({result.outputHex.length / 2} Bytes)
            </span>
            <div className="leading-relaxed tracking-wider select-all">
              {result.outputHex}
            </div>
          </div>
        )}

        {activeView === 'base64' && (
          <div className="space-y-1">
            <span className="text-gray-400 select-none block text-[10px] uppercase font-bold">
              // Base64 Encoded
            </span>
            <div className="leading-relaxed break-all select-all">
              {result.outputBase64}
            </div>
          </div>
        )}

        {activeView === 'raw' && (
          <div className="space-y-1">
            <span className="text-gray-400 select-none block text-[10px] uppercase font-bold">
              // Decoded String
            </span>
            <div className="leading-relaxed whitespace-pre-wrap select-all font-sans font-medium text-black">
              {result.plainTextPreview}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              copyToClipboard(
                activeView === 'hex'
                  ? result.outputHex
                  : activeView === 'base64'
                  ? result.outputBase64
                  : result.plainTextPreview || result.outputHex,
                activeView === 'base64' ? 'base64' : 'hex'
              )
            }
            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-black border-2 border-black font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] flex items-center gap-1.5 transition-all"
          >
            {copiedHex || copiedBase64 ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Output
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              onUseAsInput(
                result.action === 'decrypt' && result.plainTextPreview
                  ? result.plainTextPreview
                  : result.outputHex
              )
            }
            className="px-3 py-1.5 bg-[#DEC3A1] hover:bg-[#d6b791] text-black border-2 border-black font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] flex items-center gap-1.5 transition-all"
          >
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            Send to Input
          </button>
        </div>

        <div className="text-[11px] font-mono font-bold text-black flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#BE4BCE]" />
          Brainrot SPN Pipeline Ready
        </div>
      </div>
    </div>
  );
};

export default CipherResultCard;
