import React, { useRef, useState } from 'react';
import FloatingBubbles from '../components/common/FloatingBubbles';
import { UploadCloud, ArrowRight, ShieldCheck, Cpu, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onNavigateToMain: () => void;
  onFileDropToMain: (file: File) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToMain,
  onFileDropToMain,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      onFileDropToMain(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      onFileDropToMain(selectedFile);
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-black flex flex-col items-center justify-between px-4 py-8 md:py-12 selection:bg-[#EC8DD1] selection:text-black">
      <FloatingBubbles />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-[#4542E0] border-[2.5px] border-black flex items-center justify-center text-white font-mono font-black text-sm shadow-[2px_2px_0px_#000000]">
            67
          </div>
          <span className="font-mono text-xs font-black tracking-wider uppercase bg-[#DEC3A1] border-2 border-black px-2 py-1 shadow-[2px_2px_0px_#000000]">
            Brainrot Cipher
          </span>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-2xl my-auto py-8 flex flex-col items-center text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-black leading-[1.1] uppercase">
          Triple T has blessed you
        </h1>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full max-w-xl mx-auto rounded-none border-[3px] border-black p-10 md:p-14 text-center cursor-pointer transition-all duration-200 select-none ${
            isDragOver
              ? 'bg-[#DEC3A1] border-dashed shadow-[8px_8px_0px_#000000] scale-[1.02]'
              : 'bg-[#F3F4F6] hover:bg-gray-100 shadow-[6px_6px_0px_#000000]'
          }`}
        >
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full bg-[#DEC3A1] border-[2.5px] border-black flex items-center justify-center shadow-[3px_3px_0px_#000000] mb-5">
            <UploadCloud className="w-10 h-10 md:w-12 md:h-12 stroke-[2.5] text-black" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight">
            Drop your file here
          </h2>

          <p className="text-xs md:text-sm font-semibold text-gray-600 mt-2">
            Drag & drop any file (.txt, .bin, .jpg, .pdf) or{' '}
            <span className="underline decoration-2 font-black text-black">browse files</span>
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono font-black">
            <span className="bg-white border-2 border-black px-2 py-0.5 shadow-[1px_1px_0px_#000000]">
              .TXT
            </span>
            <span className="bg-white border-2 border-black px-2 py-0.5 shadow-[1px_1px_0px_#000000]">
              .BIN
            </span>
            <span className="bg-white border-2 border-black px-2 py-0.5 shadow-[1px_1px_0px_#000000]">
              .PNG
            </span>
          </div>
        </div>

        <div className="pt-2 w-full max-w-xl flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={onNavigateToMain}
            className="w-full sm:w-auto px-8 py-4 bg-[#4542E0] hover:bg-[#3835cb] text-white font-black text-sm uppercase tracking-wider border-[2.5px] border-black shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <span>Enter Studio Directly</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </main>

      <footer className="relative z-10 w-full max-w-4xl pt-6 border-t-2 border-black flex flex-wrap items-center justify-between gap-4 text-xs font-mono font-bold text-gray-700">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-black stroke-[2.5]" />
          <span>K11 - IF4020</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
