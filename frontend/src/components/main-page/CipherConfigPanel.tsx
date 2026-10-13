import React from 'react';
import { CipherMode, PaddingScheme } from '../../types/cipher';
import { getByteLength, generateRandom16BytesKey, generateRandom16BytesIV } from '../../utils/cryptoHelpers';
import { KeyRound, ShieldAlert, Sparkles, SlidersHorizontal, Lock, Unlock, Check, AlertCircle } from 'lucide-react';

interface CipherConfigPanelProps {
  keyStr: string;
  onKeyChange: (val: string) => void;
  ivStr: string;
  onIvChange: (val: string) => void;
  mode: CipherMode;
  onModeChange: (m: CipherMode) => void;
  padding: PaddingScheme;
  onPaddingChange: (p: PaddingScheme) => void;
  onEncrypt: () => void;
  onDecrypt: () => void;
  isLoading: boolean;
  canExecute: boolean;
}

const MODES: CipherMode[] = ['CBC', 'ECB', 'CFB', 'OFB', 'CTR'];

const PADDINGS: { label: string; value: PaddingScheme }[] = [
  { label: 'PKCS#7', value: 'PKCS7' },
  { label: 'Zero Padding', value: 'Zero' },
  { label: 'ANSI X.923', value: 'ANSI_X923' },
];

export const CipherConfigPanel: React.FC<CipherConfigPanelProps> = ({
  keyStr,
  onKeyChange,
  ivStr,
  onIvChange,
  mode,
  onModeChange,
  padding,
  onPaddingChange,
  onEncrypt,
  onDecrypt,
  isLoading,
  canExecute,
}) => {
  const keyBytes = getByteLength(keyStr);
  const isKeyValid = keyBytes === 16;

  const isEcbMode = mode === 'ECB';
  const ivBytes = getByteLength(ivStr);
  const isIvValid = isEcbMode || ivBytes === 16;

  const handleGenerateKey = () => {
    onKeyChange(generateRandom16BytesKey());
  };

  const handleGenerateIV = () => {
    onIvChange(generateRandom16BytesIV());
  };

  return (
    <div className="bg-white border-[2.5px] border-black shadow-[4px_4px_0px_#000000] p-4 sm:p-5 md:p-6 space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 sm:pb-4 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-[#BE4BCE] border-2 border-black flex items-center justify-center text-white shadow-[1px_1px_0px_#000000]">
            <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-black uppercase tracking-wider text-black">
            Cipher Configuration
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 stroke-[2.5]" />
              Master Key
            </label>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 border-2 border-black flex items-center gap-1 ${
                isKeyValid
                  ? 'bg-emerald-200 text-emerald-950 shadow-[1px_1px_0px_#000000]'
                  : keyBytes > 0
                  ? 'bg-rose-200 text-rose-950 shadow-[1px_1px_0px_#000000]'
                  : 'bg-gray-100 text-gray-700 shadow-[1px_1px_0px_#000000]'
              }`}
            >
              {isKeyValid ? (
                <>
                  <Check className="w-3 h-3 stroke-[3]" /> 16 B
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 stroke-[3]" /> {keyBytes} / 16 B
                </>
              )}
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={keyStr}
              onChange={(e) => onKeyChange(e.target.value)}
              placeholder="16-byte key (e.g. BrainrotKey676767)"
              className={`min-w-0 flex-1 bg-white border-2 border-black px-2.5 sm:px-3 py-2 text-xs font-mono text-black focus:outline-none shadow-[2px_2px_0px_#000000] placeholder:text-gray-400 ${
                !isKeyValid && keyBytes > 0 ? 'border-rose-600' : ''
              }`}
            />
            <button
              type="button"
              onClick={handleGenerateKey}
              className="px-2.5 sm:px-3 py-2 bg-[#DEC3A1] hover:bg-[#d4b58e] text-black font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Random
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
              IV / Nonce
            </label>
            {isEcbMode ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 border-2 border-black bg-gray-200 text-gray-600">
                Not Used (ECB)
              </span>
            ) : (
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 border-2 border-black flex items-center gap-1 ${
                  isIvValid
                    ? 'bg-emerald-200 text-emerald-950 shadow-[1px_1px_0px_#000000]'
                    : ivBytes > 0
                    ? 'bg-rose-200 text-rose-950 shadow-[1px_1px_0px_#000000]'
                    : 'bg-gray-100 text-gray-700 shadow-[1px_1px_0px_#000000]'
                }`}
              >
                {isIvValid ? (
                  <>
                    <Check className="w-3 h-3 stroke-[3]" /> 16 B
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 stroke-[3]" /> {ivBytes} / 16 B
                  </>
                )}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={ivStr}
              disabled={isEcbMode}
              onChange={(e) => onIvChange(e.target.value)}
              placeholder={isEcbMode ? 'Not needed for ECB mode' : '16-byte IV (e.g. 0011223344556677)'}
              className={`min-w-0 flex-1 bg-white border-2 border-black px-2.5 sm:px-3 py-2 text-xs font-mono text-black focus:outline-none shadow-[2px_2px_0px_#000000] placeholder:text-gray-400 ${
                isEcbMode ? 'bg-gray-100 opacity-40 cursor-not-allowed shadow-none' : ''
              } ${!isIvValid && !isEcbMode && ivBytes > 0 ? 'border-rose-600' : ''}`}
            />
            <button
              type="button"
              disabled={isEcbMode}
              onClick={handleGenerateIV}
              className={`px-2.5 sm:px-3 py-2 bg-[#DEC3A1] hover:bg-[#d4b58e] text-black font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isEcbMode ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Random
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 border-t-2 border-black">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-black block">
            Mode of Operation
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {MODES.map((m) => {
              const isActive = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onModeChange(m)}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-mono font-black uppercase transition-all cursor-pointer text-center ${
                    isActive
                      ? 'bg-[#BE4BCE] text-white border-[2.5px] border-black shadow-[3px_3px_0px_#000000] -translate-y-0.5'
                      : 'bg-white text-black border-2 border-black hover:bg-[#DEC3A1]/40 shadow-[1px_1px_0px_#000000]'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-black block">
            Padding Scheme
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {PADDINGS.map((p) => {
              const isActive = padding === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onPaddingChange(p.value)}
                  className={`flex-1 sm:flex-none px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                    isActive
                      ? 'bg-[#EC8DD1] text-black border-[2.5px] border-black shadow-[3px_3px_0px_#000000] -translate-y-0.5'
                      : 'bg-white text-black border-2 border-black hover:bg-gray-100 shadow-[1px_1px_0px_#000000]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-3 sm:pt-4 border-t-[2.5px] border-black grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          disabled={!canExecute || !isKeyValid || (!isIvValid && !isEcbMode) || isLoading}
          onClick={onEncrypt}
          className="w-full py-3 sm:py-3.5 px-4 sm:px-6 bg-[#4542E0] hover:bg-[#3936cb] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-[2.5px] border-black shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[4px_4px_0px_#000000] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Lock className="w-4 h-4 stroke-[2.5]" />
          {isLoading ? 'Processing...' : 'Encrypt Payload'}
        </button>

        <button
          type="button"
          disabled={!canExecute || !isKeyValid || (!isIvValid && !isEcbMode) || isLoading}
          onClick={onDecrypt}
          className="w-full py-3 sm:py-3.5 px-4 sm:px-6 bg-[#E75FA8] hover:bg-[#d84e98] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-[2.5px] border-black shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[4px_4px_0px_#000000] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Unlock className="w-4 h-4 stroke-[2.5]" />
          {isLoading ? 'Processing...' : 'Decrypt Payload'}
        </button>
      </div>
    </div>
  );
};

export default CipherConfigPanel;
