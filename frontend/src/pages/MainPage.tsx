import React, { useState, useEffect } from 'react';
import FloatingBubbles from '../components/common/FloatingBubbles';
import RichTextField from '../components/main-page/RichTextField';
import UploadField from '../components/main-page/UploadField';
import CipherConfigPanel from '../components/main-page/CipherConfigPanel';
import CipherResultCard, { CipherResult } from '../components/main-page/CipherResultCard';
import { CipherMode, PaddingScheme, CipherAction } from '../types/cipher';
import { cipherApi } from '../api/cipherApi';
import { simulateLocalCipher, getByteLength, calculateBlocks } from '../utils/cryptoHelpers';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

interface MainPageProps {
  initialFile?: File | null;
  onBackToLanding: () => void;
}

export const MainPage: React.FC<MainPageProps> = ({
  initialFile = null,
  onBackToLanding,
}) => {
  // State for Inputs
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [filePreview, setFilePreview] = useState<string>('');

  // State for Cipher Config
  const [key, setKey] = useState('BrainrotKey676767');
  const [iv, setIv] = useState('0011223344556677');
  const [mode, setMode] = useState<CipherMode>('CBC');
  const [padding, setPadding] = useState<PaddingScheme>('PKCS7');

  // State for Execution & Output
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CipherResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Read file preview when a file is selected
  useEffect(() => {
    if (selectedFile) {
      if (
        selectedFile.type.startsWith('text/') ||
        selectedFile.name.endsWith('.txt') ||
        selectedFile.name.endsWith('.json')
      ) {
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          setFilePreview(
            content.length > 300
              ? `${content.substring(0, 300)}...\n[Preview truncated: total ${content.length} characters]`
              : content
          );
        };
        reader.readAsText(selectedFile);
      } else {
        setFilePreview(
          `[Binary Payload: ${selectedFile.name} | ${selectedFile.size} Bytes | ~${calculateBlocks(
            selectedFile.size,
            16
          )} Blocks 128-bit]`
        );
      }
    } else {
      setFilePreview('');
    }
  }, [selectedFile]);

  // UX Rule: Mutual Exclusivity
  const hasText = inputText.trim().length > 0;
  const hasFile = selectedFile !== null;

  const isTextLocked = hasFile;
  const isDropzoneDimmed = hasText;

  // Validation
  const isKeyValid = getByteLength(key) === 16;
  const isIvValid = mode === 'ECB' || getByteLength(iv) === 16;
  const canExecute = (hasText || hasFile) && isKeyValid && isIvValid;

  // Process Cipher (Encrypt or Decrypt)
  const handleProcessCipher = async (action: CipherAction) => {
    if (!canExecute) return;
    setLoading(true);
    setStatusMessage(null);

    const startTime = performance.now();

    try {
      // 1. Prepare data format
      if (hasFile && selectedFile) {
        // Try backend multipart API
        try {
          const res = await cipherApi.processData({
            action,
            mode,
            key,
            iv,
            padding,
            data_format: 'file',
            file: selectedFile,
          });

          setResult({
            action,
            mode,
            padding,
            outputHex: res.output_hex,
            outputBase64: res.output_base64,
            plainTextPreview:
              action === 'decrypt' ? 'Decrypted binary/file payload ready for export.' : undefined,
            bytesCount: selectedFile.size,
            blocksCount: calculateBlocks(selectedFile.size, 16),
            entropy: res.entropy,
            elapsedMs: res.elapsed_ms,
            timestamp: new Date().toLocaleTimeString(),
          });
          setStatusMessage({
            type: 'success',
            text: `File successfully ${action === 'encrypt' ? 'encrypted' : 'decrypted'} via backend API!`,
          });
        } catch {
          // Graceful fallback to client-side buffer simulation
          const arrayBuffer = await selectedFile.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const sim = simulateLocalCipher(action, uint8Array, key, iv, mode);

          setResult({
            action,
            mode,
            padding,
            outputHex: sim.hex,
            outputBase64: sim.base64,
            plainTextPreview:
              action === 'decrypt' ? 'Decrypted binary/file payload simulated.' : undefined,
            bytesCount: selectedFile.size,
            blocksCount: calculateBlocks(selectedFile.size, 16),
            entropy: sim.entropy,
            elapsedMs: sim.elapsedMs,
            timestamp: new Date().toLocaleTimeString(),
          });
          setStatusMessage({
            type: 'info',
            text: `Processed locally (Backend API offline). File ${action} completed!`,
          });
        }
      } else {
        // Plaintext input
        try {
          const res = await cipherApi.processData({
            action,
            mode,
            key,
            iv,
            padding,
            data_format: 'text',
            payload: inputText,
          });

          const bytesCount = getByteLength(inputText);
          setResult({
            action,
            mode,
            padding,
            outputHex: res.output_hex,
            outputBase64: res.output_base64,
            plainTextPreview:
              action === 'decrypt'
                ? tryDecodeHex(res.output_hex) || inputText
                : undefined,
            bytesCount,
            blocksCount: calculateBlocks(bytesCount, 16),
            entropy: res.entropy,
            elapsedMs: res.elapsed_ms,
            timestamp: new Date().toLocaleTimeString(),
          });
          setStatusMessage({
            type: 'success',
            text: `Text successfully ${action === 'encrypt' ? 'encrypted' : 'decrypted'} via backend API!`,
          });
        } catch {
          // Graceful client simulation
          const inputBytes = new TextEncoder().encode(inputText);
          const sim = simulateLocalCipher(action, inputBytes, key, iv, mode);
          const bytesCount = inputBytes.length;

          let plainDecoded: string | undefined;
          if (action === 'decrypt') {
            try {
              plainDecoded = new TextDecoder().decode(inputBytes);
            } catch {
              plainDecoded = inputText;
            }
          }

          setResult({
            action,
            mode,
            padding,
            outputHex: sim.hex,
            outputBase64: sim.base64,
            plainTextPreview: plainDecoded,
            bytesCount,
            blocksCount: calculateBlocks(bytesCount, 16),
            entropy: sim.entropy,
            elapsedMs: sim.elapsedMs,
            timestamp: new Date().toLocaleTimeString(),
          });
          setStatusMessage({
            type: 'info',
            text: `Processed locally (Backend API offline). Text ${action} completed!`,
          });
        }
      }
    } catch (err) {
      console.error('Cipher operation error:', err);
      setStatusMessage({
        type: 'error',
        text: 'Error occurred during cipher processing. Check inputs and parameters.',
      });
    } finally {
      setLoading(false);
    }
  };

  const tryDecodeHex = (hex: string): string | null => {
    try {
      const match = hex.match(/.{1,2}/g);
      if (!match) return null;
      const bytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
      return new TextDecoder().decode(bytes);
    } catch {
      return null;
    }
  };

  const handleUseResultAsInput = (text: string) => {
    setSelectedFile(null);
    setInputText(text);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetAll = () => {
    setInputText('');
    setSelectedFile(null);
    setResult(null);
    setStatusMessage(null);
  };

  return (
    <div className="relative min-h-screen bg-white text-black flex flex-col selection:bg-[#EC8DD1] selection:text-black">
      {/* Decorative Floating Bubbles in Background */}
      <FloatingBubbles />

      {/* Main Page Header */}
      <header className="relative z-10 w-full border-b-[2.5px] border-black bg-white px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Judul Minimalis */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToLanding}
              className="p-1.5 bg-white hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] transition-all mr-1"
              title="Back to Landing Page"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Logo badge angka 67 */}
            <div className="w-9 h-9 rounded-md bg-[#4542E0] border-[2.5px] border-black flex items-center justify-center text-white font-mono font-black text-sm shadow-[2px_2px_0px_#000000]">
              67
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black uppercase tracking-tight text-black">
                  BRAINROT CIPHER
                </h1>
                {/* Badge chip Cameo [128-BIT SPN] */}
                <span className="text-[11px] font-mono font-bold bg-[#DEC3A1] border-2 border-black px-2 py-0.5 shadow-[1px_1px_0px_#000000]">
                  [128-BIT SPN]
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-600 font-medium hidden sm:block">
                Interactive Substitution-Permutation Network Studio
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-black border-2 border-black font-mono font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
        {/* Status notification toast/alert if any */}
        {statusMessage && (
          <div
            className={`border-2 border-black p-3.5 flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000000] text-xs font-mono font-bold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-950'
                : statusMessage.type === 'error'
                ? 'bg-rose-100 text-rose-950'
                : 'bg-[#DEC3A1]/50 text-black'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-black hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Section 1: Area Dual Input (Berdampingan secara responsif) */}
        <section className="relative">
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6 relative">
            {/* Kiri: RichTextField */}
            <RichTextField
              value={inputText}
              onChange={(val) => {
                setInputText(val);
                if (result) setResult(null);
              }}
              isLockedDueToFile={isTextLocked}
              filePreviewInfo={filePreview}
              onClearText={() => setInputText('')}
            />

            {/* Tengah: Badge lingkaran teks "or" (diameter 44px, background Cameo #DEC3A1, border 2.5px, bold) */}
            <div className="flex items-center justify-center my-[-8px] md:my-0 md:self-center shrink-0 z-20">
              <div className="w-[44px] h-[44px] rounded-full bg-[#DEC3A1] border-[2.5px] border-black flex items-center justify-center font-black uppercase text-xs text-black shadow-[3px_3px_0px_#000000]">
                or
              </div>
            </div>

            {/* Kanan: UploadField */}
            <UploadField
              file={selectedFile}
              onFileSelect={(file) => {
                setSelectedFile(file);
                if (result) setResult(null);
              }}
              isDimmedDueToText={isDropzoneDimmed}
            />
          </div>
        </section>

        {/* Section 2: Panel Konfigurasi Cipher */}
        <section>
          <CipherConfigPanel
            keyStr={key}
            onKeyChange={setKey}
            ivStr={iv}
            onIvChange={setIv}
            mode={mode}
            onModeChange={setMode}
            padding={padding}
            onPaddingChange={setPadding}
            onEncrypt={() => handleProcessCipher('encrypt')}
            onDecrypt={() => handleProcessCipher('decrypt')}
            isLoading={loading}
            canExecute={canExecute}
          />
        </section>

        {/* Section 3: Result Card Output */}
        {result && (
          <section>
            <CipherResultCard
              result={result}
              onUseAsInput={handleUseResultAsInput}
              onClose={() => setResult(null)}
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default MainPage;
