import React, { useState, useEffect, useMemo } from 'react';
import FloatingBubbles from '../components/common/FloatingBubbles';
import RichTextField from '../components/main-page/RichTextField';
import UploadField from '../components/main-page/UploadField';
import CipherConfigPanel from '../components/main-page/CipherConfigPanel';
import CipherResultCard, { CipherResult } from '../components/main-page/CipherResultCard';
import CipherVisualizer from '../components/visualizer/CipherVisualizer';
import AvalancheBench from '../components/analytics/AvalancheBench';
import HistogramChart from '../components/analytics/HistogramChart';
import EntropyGauge from '../components/analytics/EntropyGauge';
import { CipherMode, PaddingScheme, CipherAction } from '../types/cipher';
import { cipherApi } from '../api/cipherApi';
import { 
  simulateLocalCipher, 
  getByteLength, 
  calculateBlocks, 
  hexToBytes 
} from '../utils/cryptoHelpers';
import { 
  ArrowLeft, 
  RefreshCw, 
  AlertTriangle, 
  BarChart2, 
  Zap, 
  Activity, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  SlidersHorizontal 
} from 'lucide-react';

export type AnalysisTabType = 'visualize' | 'avalanche' | 'histogram' | 'entropy';

interface MainPageProps {
  initialFile?: File | null;
  onBackToLanding: () => void;
  onNavigateToAnalyze?: (data: {
    plainBytes: Uint8Array;
    cipherBytes: Uint8Array;
    keyStr: string;
  }) => void;
}

export const MainPage: React.FC<MainPageProps> = ({
  initialFile = null,
  onBackToLanding,
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

  const [activeAnalysisTab, setActiveAnalysisTab] = useState<AnalysisTabType>('visualize');

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

  const isKeyValid = getByteLength(key) === 16;
  const isIvValid = mode === 'ECB' || getByteLength(iv) === 16;
  const canExecute = (hasText || hasFile) && isKeyValid && isIvValid;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

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
          setTimeout(() => scrollToSection('section-2'), 100);
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
          setTimeout(() => scrollToSection('section-2'), 100);
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
          setTimeout(() => scrollToSection('section-2'), 100);
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
          setTimeout(() => scrollToSection('section-2'), 100);
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
    scrollToSection('section-1');
  };

  const handleResetAll = () => {
    setInputText('');
    setSelectedFile(null);
    setResult(null);
    setStatusMessage(null);
    scrollToSection('section-1');
  };

  const effectivePlainBytes = useMemo(() => {
    if (result?.plainBytes && result.plainBytes.length > 0) {
      return result.plainBytes;
    }
    if (inputText.trim().length > 0) {
      return new TextEncoder().encode(inputText);
    }
    return new TextEncoder().encode('BrainrotCipherSPN128TestPayload67');
  }, [result, inputText]);

  const effectiveCipherBytes = useMemo(() => {
    if (result?.cipherBytes && result.cipherBytes.length > 0) {
      return result.cipherBytes;
    }
    const sample = new Uint8Array(effectivePlainBytes.length);
    for (let i = 0; i < sample.length; i++) {
      sample[i] = (effectivePlainBytes[i] * 7 + i * 13 + 0x67) & 0xff;
    }
    return sample;
  }, [result, effectivePlainBytes]);

  const previewBlockHex = useMemo(() => {
    if (result?.outputHex && result.outputHex.length >= 32) {
      return result.outputHex.slice(0, 32);
    }
    return '427261696E726F744369706865723132';
  }, [result]);

  return (
    <div className="h-screen overflow-y-auto snap-y snap-proximity md:snap-mandatory scroll-smooth relative bg-white text-black selection:bg-[#EC8DD1] selection:text-black">
      <FloatingBubbles />

      <nav className="fixed top-3 right-4 md:right-8 z-40 bg-white/95 backdrop-blur-sm border-2 border-black p-1.5 shadow-[3px_3px_0px_#000000] flex items-center gap-1 text-[11px] font-mono font-bold">
        <button
          type="button"
          onClick={() => scrollToSection('section-1')}
          className="px-2 py-1 hover:bg-[#DEC3A1]/40 border border-transparent hover:border-black transition-all cursor-pointer"
        >
          1. Input & Config
        </button>
        <span className="text-gray-400">|</span>
        <button
          type="button"
          onClick={() => scrollToSection('section-2')}
          className="px-2 py-1 hover:bg-[#E75FA8]/30 border border-transparent hover:border-black transition-all cursor-pointer flex items-center gap-1"
        >
          2. Result
          {result && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
        </button>
        <span className="text-gray-400">|</span>
        <button
          type="button"
          onClick={() => scrollToSection('section-3')}
          className="px-2 py-1 hover:bg-[#BE4BCE]/30 border border-transparent hover:border-black transition-all cursor-pointer"
        >
          3. Analysis
        </button>
      </nav>

      <section
        id="section-1"
        className="min-h-screen snap-start flex flex-col justify-between py-6 px-4 md:px-8 max-w-6xl mx-auto w-full relative z-10"
      >
        <header className="w-full border-b-[2.5px] border-black bg-white pb-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
                onClick={() => scrollToSection('section-3')}
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

        <div className="space-y-5 flex-1 flex flex-col justify-center">
          {statusMessage && (
            <div
              className={`border-2 border-black p-3 flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000000] text-xs font-mono font-bold ${
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

          <div className="flex items-center gap-2 font-mono text-xs font-black uppercase text-black">
            <span className="w-2.5 h-2.5 bg-[#4542E0] inline-block border border-black" />
            <span>Section 01: Payload Input & Parameters</span>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6 relative">
            {!hasFile && (
              <RichTextField
                value={inputText}
                onChange={(val) => {
                  setInputText(val);
                  if (result) setResult(null);
                }}
                isLockedDueToFile={false}
                filePreviewInfo={filePreview}
                onClearText={() => setInputText('')}
              />
            )}

            {!hasText && !hasFile && (
              <div className="flex items-center justify-center my-[-8px] md:my-0 md:self-center shrink-0 z-20">
                <div className="w-[44px] h-[44px] rounded-full bg-[#DEC3A1] border-[2.5px] border-black flex items-center justify-center font-black uppercase text-xs text-black shadow-[3px_3px_0px_#000000]">
                  or
                </div>
              </div>
            )}

            {!hasText && (
              <UploadField
                file={selectedFile}
                onFileSelect={(file) => {
                  setSelectedFile(file);
                  if (result) setResult(null);
                }}
                isDimmedDueToText={false}
              />
            )}
          </div>

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
        </div>

        <div className="pt-4 pb-2 flex justify-center">
          <button
            type="button"
            onClick={() => scrollToSection('section-2')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border-2 border-black font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Scroll Down to Result (Section 2)</span>
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </section>

      <section
        id="section-2"
        className="min-h-screen snap-start flex flex-col justify-between py-8 px-4 md:px-8 max-w-6xl mx-auto w-full relative z-10"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center gap-2 font-mono text-xs font-black uppercase text-black">
              <span className="w-2.5 h-2.5 bg-[#E75FA8] inline-block border border-black" />
              <span>Section 02: Cipher Execution Result</span>
            </div>
            <button
              type="button"
              onClick={() => scrollToSection('section-1')}
              className="text-xs font-mono font-bold text-gray-600 hover:text-black hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              Back to Input
            </button>
          </div>

          {result ? (
            <CipherResultCard
              result={result}
              onUseAsInput={handleUseResultAsInput}
              onOpenAnalyze={() => scrollToSection('section-3')}
              onClose={() => setResult(null)}
            />
          ) : (
            <div className="bg-white border-[2.5px] border-black p-8 md:p-12 shadow-[6px_6px_0px_#000000] text-center space-y-4 my-auto">
              <div className="w-14 h-14 rounded-full bg-[#DEC3A1] border-2 border-black mx-auto flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                <Cpu className="w-7 h-7 text-black stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-black uppercase tracking-wider text-black">
                  No Cipher Result Generated Yet
                </h3>
                <p className="text-xs font-mono text-gray-600 max-w-md mx-auto mt-1">
                  Configure your text or file payload and execute Encrypt or Decrypt in Section 1 to view formatted ciphertext, raw hex streams, and direct file downloads here.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => scrollToSection('section-1')}
                  className="px-4 py-2 bg-[#4542E0] hover:bg-[#3936cb] text-white font-bold uppercase border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer"
                >
                  ↑ Go to Input & Config
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('section-3')}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-black font-bold uppercase border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer"
                >
                  Explore Analysis (Section 3) ↓
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 pb-2 flex justify-center">
          <button
            type="button"
            onClick={() => scrollToSection('section-3')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border-2 border-black font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Scroll Down to Analysis & Visualizer (Section 3)</span>
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </section>

      <section
        id="section-3"
        className="min-h-screen snap-start flex flex-col justify-start py-8 px-4 md:px-8 max-w-6xl mx-auto w-full space-y-6 relative z-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3">
          <div className="flex items-center gap-2 font-mono text-xs font-black uppercase text-black">
            <span className="w-2.5 h-2.5 bg-[#BE4BCE] inline-block border border-black" />
            <span>Section 03: Cryptographic Metrics & State Visualizer</span>
          </div>

          <button
            type="button"
            onClick={() => scrollToSection('section-1')}
            className="text-xs font-mono font-bold text-gray-600 hover:text-black hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            Back to Top (Section 1)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-gray-100 border-2 border-black p-2 shadow-[3px_3px_0px_#000000]">
          <button
            type="button"
            onClick={() => setActiveAnalysisTab('visualize')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 font-mono font-black text-xs uppercase border-2 border-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeAnalysisTab === 'visualize'
                ? 'bg-[#DEC3A1] text-black shadow-[3px_3px_0px_#000000] -translate-y-0.5'
                : 'bg-white text-black hover:bg-gray-50'
            }`}
          >
            <Eye className="w-4 h-4 stroke-[2.5]" />
            Visualize
          </button>

          <button
            type="button"
            onClick={() => setActiveAnalysisTab('avalanche')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 font-mono font-black text-xs uppercase border-2 border-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeAnalysisTab === 'avalanche'
                ? 'bg-[#BE4BCE] text-white shadow-[3px_3px_0px_#000000] -translate-y-0.5'
                : 'bg-white text-black hover:bg-gray-50'
            }`}
          >
            <Zap className="w-4 h-4 stroke-[2.5]" />
            Avalanche
          </button>

          <button
            type="button"
            onClick={() => setActiveAnalysisTab('histogram')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 font-mono font-black text-xs uppercase border-2 border-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeAnalysisTab === 'histogram'
                ? 'bg-[#E75FA8] text-white shadow-[3px_3px_0px_#000000] -translate-y-0.5'
                : 'bg-white text-black hover:bg-gray-50'
            }`}
          >
            <BarChart2 className="w-4 h-4 stroke-[2.5]" />
            Histogram
          </button>

          <button
            type="button"
            onClick={() => setActiveAnalysisTab('entropy')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 font-mono font-black text-xs uppercase border-2 border-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeAnalysisTab === 'entropy'
                ? 'bg-[#4542E0] text-white shadow-[3px_3px_0px_#000000] -translate-y-0.5'
                : 'bg-white text-black hover:bg-gray-50'
            }`}
          >
            <Activity className="w-4 h-4 stroke-[2.5]" />
            Entropy
          </button>
        </div>

        <div className="flex-1 pb-12">
          {activeAnalysisTab === 'visualize' && (
            <div className="animate-in fade-in duration-200">
              <CipherVisualizer
                initialKey={key}
                initialBlockHex={previewBlockHex}
              />
            </div>
          )}

          {activeAnalysisTab === 'avalanche' && (
            <div className="animate-in fade-in duration-200">
              <AvalancheBench
                initialKey={key}
                initialBlockHex={previewBlockHex}
              />
            </div>
          )}

          {activeAnalysisTab === 'histogram' && (
            <div className="animate-in fade-in duration-200">
              <HistogramChart
                plainBytes={effectivePlainBytes}
                cipherBytes={effectiveCipherBytes}
              />
            </div>
          )}

          {activeAnalysisTab === 'entropy' && (
            <div className="animate-in fade-in duration-200">
              <EntropyGauge
                plainBytes={effectivePlainBytes}
                cipherBytes={effectiveCipherBytes}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MainPage;
