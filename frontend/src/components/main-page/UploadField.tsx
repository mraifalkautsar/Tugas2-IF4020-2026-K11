import React, { useRef, useState } from 'react';
import { formatBytes, calculateBlocks } from '../../utils/cryptoHelpers';
import { UploadCloud, File as FileIcon, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadFieldProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  isDimmedDueToText: boolean;
}

export const UploadField: React.FC<UploadFieldProps> = ({
  file,
  onFileSelect,
  isDimmedDueToText,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDimmedDueToText) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isDimmedDueToText) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
          <UploadCloud className="w-4 h-4 stroke-[2.5]" />
          Drop file
        </label>
        {file && (
          <span className="text-xs font-bold text-green-700 bg-emerald-100 border border-black px-2 py-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Loaded
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        disabled={isDimmedDueToText}
        onChange={handleFileChange}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isDimmedDueToText && !file && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        className={`relative flex-1 flex flex-col justify-between border-[2.5px] border-black transition-all ${
          isDimmedDueToText
            ? 'opacity-40 bg-gray-100 cursor-not-allowed shadow-[4px_4px_0px_#000000]'
            : file
            ? 'bg-white shadow-[4px_4px_0px_#000000]'
            : isDragOver
            ? 'bg-[#DEC3A1]/50 border-dashed shadow-[4px_4px_0px_#000000] cursor-copy'
            : 'bg-[#F3F4F6] hover:bg-gray-100 cursor-pointer shadow-[4px_4px_0px_#000000]'
        }`}
      >
        {isDimmedDueToText ? (
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-8 h-8 text-gray-500 mb-2 stroke-[2]" />
            <p className="text-xs font-bold text-gray-700">Locked</p>
          </div>
        ) : file ? (
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 bg-amber-50 border-2 border-black p-3.5 shadow-[2px_2px_0px_#000000]">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded bg-[#4542E0] text-white flex items-center justify-center border-2 border-black shrink-0 font-bold">
                  <FileIcon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-black text-black truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[11px] font-mono text-gray-600 mt-0.5">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                title="Remove file"
                className="w-7 h-7 flex items-center justify-center bg-white border-2 border-black hover:bg-red-500 hover:text-white transition-colors shrink-0 shadow-[1px_1px_0px_#000000] cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#DEC3A1] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000000] mb-3">
              <UploadCloud className="w-6 h-6 stroke-[2.5] text-black" />
            </div>
            <p className="text-sm font-black text-black tracking-tight">Drop file or browse</p>
          </div>
        )}

        <div className="border-t-[2.5px] border-black bg-white px-3 py-2 flex items-center justify-end text-xs font-mono">
          <div className="font-bold text-black bg-[#DEC3A1] px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000000]">
            {file ? `${file.size} B | ${calculateBlocks(file.size, 16)} Blocks` : '0 B | 0 Blocks'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadField;
