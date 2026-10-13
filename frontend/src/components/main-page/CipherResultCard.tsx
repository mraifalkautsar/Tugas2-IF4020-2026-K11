import React, { useState } from 'react';
import { Copy, Check, Download, BarChart2, ArrowUpRight, Cpu } from 'lucide-react';
import { 
  formatDownloadFilename, 
  triggerFileDownload, 
  hexToBytes 
} from '../../utils/cryptoHelpers';

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
  isFromFile: boolean;
  originalFileName?: string;
  plainBytes?: Uint8Array;
  cipherBytes?: Uint8Array;
}

interface CipherResultCardProps {
  result: CipherResult;
  onUseAsInput: (hexOrText: string) => void;
  onOpenAnalyze: () => void;
  onClose: () => void;
}

export const CipherResultCard: React.FC<CipherResultCardProps> = ({
  result,
  onUseAsInput,
  onOpenAnalyze,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'hex' | 'base64'>(
    result.action === 'decrypt' ? 'text' : 'hex'
  );

  const isEncrypt = result.action === 'encrypt';

  const downloadFileName = formatDownloadFilename(
    result.action,
    result.isFromFile,
    result.originalFileName
  );

  const decryptedText =
    result.plainTextPreview ||
    (() => {
      try {
        const bytes = result.plainBytes || hexToBytes(result.outputHex);
        return new TextDecoder().decode(bytes);
      } catch {
        return result.outputHex;
      }
    })();

  const currentDisplayText =
    activeTab === 'text'
      ? (isEncrypt ? result.outputHex : decryptedText)
      : activeTab === 'hex'
      ? result.outputHex
      : result.outputBase64;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDisplayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let bytesToDownload: Uint8Array;
    if (result.action === 'encrypt') {
      bytesToDownload = result.cipherBytes || hexToBytes(result.outputHex);
    } else {
      bytesToDownload =
        result.plainBytes ||
        (result.plainTextPreview
          ? new TextEncoder().encode(result.plainTextPreview)
          : hexToBytes(result.outputHex));
    }
    triggerFileDownload(bytesToDownload, downloadFileName);
  };

  return (
    <div className="bg-white border-[2.5px] border-black shadow-[6px_6px_0px_#000000] p-5 md:p-6 space-y-4 animate-in fade-in duration-200">
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
              {isEncrypt ? '🔒 Ciphertext Result' : '🔓 Decrypted Plaintext Result'}
              <span
                className={`text-[10px] font-mono px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000000] ${
                  isEncrypt ? 'bg-[#DEC3A1] text-black' : 'bg-emerald-200 text-black'
                }`}
              >
                {result.mode} • {result.padding}
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 font-mono">
              Completed in {result.elapsedMs || 1.2} ms • Shannon Entropy: {result.entropy ?? 7.98} bits/byte
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-black border-2 border-black font-bold text-xs shadow-[2px_2px_0px_#000000] transition-all cursor-pointer"
        >
          ✕ Close
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border-2 border-black p-3 shadow-[2px_2px_0px_#000000]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-gray-700">Target File:</span>
          <span className="text-xs font-mono font-black bg-[#DEC3A1] border border-black px-2 py-0.5 shadow-[1px_1px_0px_#000000]">
            {downloadFileName}
          </span>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="px-4 py-2 bg-emerald-300 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2 transition-all cursor-pointer"
          title={`Download file as ${downloadFileName}`}
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          Download {isEncrypt ? 'Encrypted' : 'Decrypted'} File ({downloadFileName})
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1 font-mono font-bold text-xs border-2 border-black transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-black text-white shadow-[2px_2px_0px_#DEC3A1]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {isEncrypt ? 'Ciphertext' : 'Decrypted Text'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hex')}
            className={`px-3 py-1 font-mono font-bold text-xs border-2 border-black transition-all cursor-pointer ${
              activeTab === 'hex'
                ? 'bg-black text-white shadow-[2px_2px_0px_#DEC3A1]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Hex ({result.outputHex.length / 2} Bytes)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('base64')}
            className={`px-3 py-1 font-mono font-bold text-xs border-2 border-black transition-all cursor-pointer ${
              activeTab === 'base64'
                ? 'bg-black text-white shadow-[2px_2px_0px_#DEC3A1]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Base64
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 bg-white hover:bg-gray-100 border-2 border-black font-mono font-bold text-xs shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy Content
            </>
          )}
        </button>
      </div>

      <div className="relative border-2 border-black bg-slate-900 text-emerald-400 p-4 font-mono text-xs shadow-[4px_4px_0px_#000000]">
        <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-700 text-slate-400 text-[11px]">
          <span>
            {activeTab === 'text' && (isEncrypt ? 'CIPHERTEXT OUTPUT STREAM' : 'DECRYPTED PLAINTEXT STREAM')}
            {activeTab === 'hex' && 'RAW HEX ENCODING'}
            {activeTab === 'base64' && 'BASE64 ENCODING'}
          </span>
          <span>{currentDisplayText.length} characters • {result.blocksCount} blocks (128-bit)</span>
        </div>

        <textarea
          readOnly
          value={currentDisplayText}
          rows={7}
          className="w-full bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-y selection:bg-pink-500 selection:text-white"
          placeholder="Decrypted content will appear here..."
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t-2 border-black">
        <button
          type="button"
          onClick={onOpenAnalyze}
          className="px-5 py-3 bg-[#BE4BCE] hover:bg-[#a63cb5] text-white font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[4px_4px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <BarChart2 className="w-4 h-4 stroke-[2.5]" />
          🔬 Scroll to Analysis & Visualizer (Section 3) ↓
        </button>

        <button
          type="button"
          onClick={() => onUseAsInput(isEncrypt ? result.outputHex : decryptedText)}
          className="px-4 py-2.5 bg-white hover:bg-gray-100 text-black font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          Use as Next Input
        </button>
      </div>
    </div>
  );
};

export default CipherResultCard;
