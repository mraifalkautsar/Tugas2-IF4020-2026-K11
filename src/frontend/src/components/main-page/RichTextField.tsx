import React from 'react';
import { getByteLength, calculateBlocks } from '../../utils/cryptoHelpers';
import { FileText, Lock, Trash2 } from 'lucide-react';

interface RichTextFieldProps {
  value: string;
  onChange: (val: string) => void;
  isLockedDueToFile: boolean;
  filePreviewInfo?: string;
  onClearText: () => void;
}

export const RichTextField: React.FC<RichTextFieldProps> = ({
  value,
  onChange,
  isLockedDueToFile,
  filePreviewInfo,
  onClearText,
}) => {
  const byteCount = isLockedDueToFile ? 0 : getByteLength(value);
  const blockCount = isLockedDueToFile ? 0 : calculateBlocks(byteCount, 16);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 stroke-[2.5]" />
          Type your text here...
        </label>
        {value && !isLockedDueToFile && (
          <button
            type="button"
            onClick={onClearText}
            className="text-xs font-bold text-black hover:text-red-600 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded border border-transparent hover:border-black"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      <div
        className={`relative flex-1 flex flex-col bg-white border-[2.5px] border-black shadow-[4px_4px_0px_#000000] transition-all ${
          isLockedDueToFile ? 'bg-gray-100 opacity-80 cursor-not-allowed' : ''
        }`}
      >
        {isLockedDueToFile ? (
          <div className="p-4 flex-1 flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-800 bg-[#DEC3A1]/40 border-2 border-black p-2 rounded">
              <Lock className="w-4 h-4 shrink-0 text-black" />
              <span>Textarea is locked: File payload takes precedence</span>
            </div>
            <div className="bg-white border-2 border-dashed border-gray-400 p-3 rounded font-mono text-xs text-gray-700 whitespace-pre-wrap break-all max-h-[110px] overflow-y-auto">
              {filePreviewInfo || '[Binary or File Payload loaded]'}
            </div>
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter plaintext message or raw hex payload to process through Brainrot SPN..."
            rows={6}
            className="w-full h-full min-h-[160px] p-3.5 font-mono text-xs text-black placeholder:text-gray-400 focus:outline-none resize-none bg-transparent"
          />
        )}

        {/* Bottom Counter Bar */}
        <div className="border-t-[2.5px] border-black bg-white px-3 py-2 flex items-center justify-between text-xs font-mono">
          <span className="text-gray-500 font-medium">128-Bit / 16B Blocks</span>
          <div className="font-bold text-black bg-[#DEC3A1] px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000000]">
            {byteCount} Bytes | {blockCount} Blocks
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextField;
