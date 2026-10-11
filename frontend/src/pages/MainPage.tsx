import React, { useState, useEffect } from 'react';
import FloatingBubbles from '../components/common/FloatingBubbles';
import RichTextField from '../components/main-page/RichTextField';
import UploadField from '../components/main-page/UploadField';
import CipherConfigPanel from '../components/main-page/CipherConfigPanel';
import CipherResultCard, { CipherResult } from '../components/main-page/CipherResultCard';
import { CipherMode, PaddingScheme, CipherAction } from '../types/cipher';
import { cipherApi } from '../api/cipherApi';
import { 
  simulateLocalCipher, 
  getByteLength, 
  calculateBlocks, 
  hexToBytes 
} from '../utils/cryptoHelpers';
import { ArrowLeft, RefreshCw, AlertTriangle, BarChart2 } from 'lucide-react';

interface MainPageProps {
  initialFile?: File | null;
  onBackToLanding: () => void;
  onNavigateToAnalyze: (data: {
    plainBytes: Uint8Array;
    cipherBytes: Uint8Array;
    keyStr: string;
  }) => void;
}

export const MainPage: React.FC<MainPageProps> = ({
  initialFile = null,
  onBackToLanding,
  onNavigateToAnalyze,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [filePreview, setFilePreview] = useState<string>('');

  const [key, setKey] = useState('BrainrotKey676767');
  const [iv, setIv] = useState('0011223344556677');
  const [mode, setMode] = useState<CipherMode>('CBC');
  const [padding, setPadding] = useState<PaddingScheme>('PKCS7');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CipherResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

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

  const hasText = inputText.trim().length > 0;
  const hasFile = selectedFile !== null;

  const isTextLocked = hasFile;
  const isDropzoneDimmed = hasText;

  const isKeyValid = getByteLength(key) === 16;
  const isIvValid = mode === 'ECB' || getByteLength(iv) === 16;
  const canExecute = (hasText || hasFile) && isKeyValid && isIvValid;

  const handleProcessCipher = async (action: CipherAction) => {
    if (!canExecute) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      if (hasFile && selectedFile) {
        const fileBuffer = await selectedFile.arrayBuffer();
        const fileBytes = new Uint8Array(fileBuffer);

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

          const outBytes = hexToBytes(res.output_hex);
          let plainDecoded: string | undefined;
          if (action === 'decrypt') {
            try {
              plainDecoded = new TextDecoder().decode(outBytes);
            } catch {
              plainDecoded = '[Binary Payload Decrypted Successfully]';
            }
          }

          setResult({
            action,
            mode,
            padding,
            outputHex: res.output_hex,
            outputBase64: res.output_base64,
            plainTextPreview: plainDecoded,
            bytesCount: selectedFile.size,
            blocksCount: calculateBlocks(selectedFile.size, 16),
            entropy: res.entropy,
            elapsedMs: res.elapsed_ms,
            timestamp: new Date().toLocaleTimeString(),
            isFromFile: true,
            originalFileName: selectedFile.name,
            plainBytes: action === 'encrypt' ? fileBytes : outBytes,
            cipherBytes: action === 'encrypt' ? outBytes : fileBytes,
          });

          setStatusMessage({
            type: 'success',
            text: `File successfully ${action === 'encrypt' ? 'encrypted' : 'decrypted'} via backend API!`,
          });
        } catch (apiErr) {
          console.warn('Backend API offline, using fallback', apiErr);
          const sim = simulateLocalCipher(action, fileBytes, key, iv, mode);
          const simBytes = hexToBytes(sim.hex);

          setResult({
            action,
            mode,
            padding,
            outputHex: sim.hex,
            outputBase64: sim.base64,
            plainTextPreview:
              action === 'decrypt' ? 'Decrypted binary payload simulated.' : undefined,
            bytesCount: selectedFile.size,
            blocksCount: calculateBlocks(selectedFile.size, 16),
            entropy: sim.entropy,
            elapsedMs: sim.elapsedMs,
            timestamp: new Date().toLocaleTimeString(),
            isFromFile: true,
            originalFileName: selectedFile.name,
            plainBytes: action === 'encrypt' ? fileBytes : simBytes,
            cipherBytes: action === 'encrypt' ? simBytes : fileBytes,
          });

          setStatusMessage({
            type: 'info',
            text: `Processed locally (Backend API offline). File ${action} completed!`,
          });
        }
      } else {
        const textBytes = new TextEncoder().encode(inputText);

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

          const outBytes = hexToBytes(res.output_hex);
          let plainDecoded: string | undefined;
          if (action === 'decrypt') {
            try {
              plainDecoded = new TextDecoder().decode(outBytes);
            } catch {
              plainDecoded = inputText;
            }
          }

          const bytesCount = textBytes.length;
          setResult({
            action,
            mode,
            padding,
            outputHex: res.output_hex,
            outputBase64: res.output_base64,
            plainTextPreview: plainDecoded,
            bytesCount,
            blocksCount: calculateBlocks(bytesCount, 16),
            entropy: res.entropy,
            elapsedMs: res.elapsed_ms,
            timestamp: new Date().toLocaleTimeString(),
            isFromFile: false,
            originalFileName: undefined,
            plainBytes: action === 'encrypt' ? textBytes : outBytes,
            cipherBytes: action === 'encrypt' ? outBytes : textBytes,
          });

          setStatusMessage({
            type: 'success',
            text: `Text successfully ${action === 'encrypt' ? 'encrypted' : 'decrypted'} via backend API!`,
          });
        } catch (apiErr) {
          console.warn('Backend API offline, using fallback', apiErr);
          const sim = simulateLocalCipher(action, textBytes, key, iv, mode);
          const simBytes = hexToBytes(sim.hex);

          let plainDecoded: string | undefined;
          if (action === 'decrypt') {
            try {
              plainDecoded = new TextDecoder().decode(simBytes);
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
            bytesCount: textBytes.length,
            blocksCount: calculateBlocks(textBytes.length, 16),
            entropy: sim.entropy,
            elapsedMs: sim.elapsedMs,
            timestamp: new Date().toLocaleTimeString(),
            isFromFile: false,
            originalFileName: undefined,
            plainBytes: action === 'encrypt' ? textBytes : simBytes,
            cipherBytes: action === 'encrypt' ? simBytes : textBytes,
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

  const handleOpenAnalyze = () => {
    const plain =
      result?.plainBytes ||
      new TextEncoder().encode(inputText || 'BrainrotCipherSample123');
    const cipher =
      result?.cipherBytes ||
      (result ? hexToBytes(result.outputHex) : new Uint8Array([0x45, 0x67, 0x89]));

    onNavigateToAnalyze({
      plainBytes: plain,
      cipherBytes: cipher,
      keyStr: key,
    });
  };

  return (
    <div className="relative min-h-screen bg-white text-black flex flex-col selection:bg-[#EC8DD1] selection:text-black">
      <FloatingBubbles />

      <header className="relative z-10 w-full border-b-[2.5px] border-black bg-white px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToLanding}
              className="p-1.5 bg-white hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] transition-all mr-1 cursor-pointer"
              title="Back to Landing Page"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="w-9 h-9 rounded-md bg-[#4542E0] border-[2.5px] border-black flex items-center justify-center text-white font-mono font-black text-sm shadow-[2px_2px_0px_#000000]">
              67
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black uppercase tracking-tight text-black">
                  BRAINROT CIPHER
                </h1>
                <span className="text-[11px] font-mono font-bold bg-[#DEC3A1] border-2 border-black px-2 py-0.5 shadow-[1px_1px_0px_#000000]">
                  [128-BIT SPN]
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-600 font-medium hidden sm:block">
                Interactive Substitution-Permutation Network Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAnalyze}
              className="px-3 py-1.5 bg-[#BE4BCE] hover:bg-[#a63cb5] text-white border-2 border-black font-mono font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Analyze
            </button>

            <button
              type="button"
              onClick={handleResetAll}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-black border-2 border-black font-mono font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
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
              className="text-black hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="relative">
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6 relative">
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

            <div className="flex items-center justify-center my-[-8px] md:my-0 md:self-center shrink-0 z-20">
              <div className="w-[44px] h-[44px] rounded-full bg-[#DEC3A1] border-[2.5px] border-black flex items-center justify-center font-black uppercase text-xs text-black shadow-[3px_3px_0px_#000000]">
                or
              </div>
            </div>

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

        {result && (
          <section className="animate-in fade-in duration-300">
            <CipherResultCard
              result={result}
              onUseAsInput={handleUseResultAsInput}
              onOpenAnalyze={handleOpenAnalyze}
              onClose={() => setResult(null)}
            />
          </section>
        )}

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
      </main>
    </div>
  );
};

export default MainPage;
