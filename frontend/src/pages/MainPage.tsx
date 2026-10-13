import React, { useState, useEffect, useMemo } from 'react';
import FloatingBubbles from '../components/common/FloatingBubbles';
import RichTextField from '../components/main-page/RichTextField';
import UploadField from '../components/main-page/UploadField';
import CipherConfigPanel from '../components/main-page/CipherConfigPanel';
import CipherResultCard, { CipherResult } from '../components/main-page/CipherResultCard';
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
  BarChart2, 
  Zap, 
  Activity, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

export type AnalysisTabType = 'avalanche' | 'histogram' | 'entropy';

interface MainPageProps {
  initialFile?: File | null;
  onBackToLanding: () => void;
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

  const [activeAnalysisTab, setActiveAnalysisTab] = useState<AnalysisTabType>('avalanche');

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
              ? `${content.substring(0, 300)}...\n[Truncated: ${content.length} chars]`
              : content
          );
        };
        reader.readAsText(selectedFile);
      } else {
        setFilePreview(
          `[${selectedFile.name} | ${selectedFile.size} B | ~${calculateBlocks(
            selectedFile.size,
            16
          )} Blocks]`
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
              plainDecoded = '[Decrypted Payload]';
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

          setTimeout(() => scrollToSection('section-2'), 100);
        }
      }
    } catch (err) {
      console.error('Cipher operation error:', err);
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
    scrollToSection('section-1');
  };

  const effectivePlainBytes = useMemo(() => {
    if (result?.plainBytes && result.plainBytes.length > 0) {
      return result.plainBytes;
    }
    return new Uint8Array(0);
  }, [result]);

  const effectiveCipherBytes = useMemo(() => {
    if (result?.cipherBytes && result.cipherBytes.length > 0) {
      return result.cipherBytes;
    }
    return new Uint8Array(0);
  }, [result]);

  const previewBlockHex = useMemo(() => {
    if (result?.outputHex && result.outputHex.length >= 32) {
      return result.outputHex.slice(0, 32);
    }
    return '';
  }, [result]);

  return (
    <div className="h-screen overflow-y-auto snap-y snap-proximity md:snap-mandatory scroll-smooth relative bg-white text-black selection:bg-[#EC8DD1] selection:text-black">
      <FloatingBubbles />

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
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-5 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 font-mono text-xs font-black uppercase text-black">
            <span className="w-2.5 h-2.5 bg-[#4542E0] inline-block border border-black" />
            <span>Section 01: Input</span>
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
            onClick={() => scrollToSection(result ? 'section-2' : 'section-3')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border-2 border-black font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>{result ? 'Scroll Down to Result (Section 2)' : 'Scroll Down to Analysis (Section 3)'}</span>
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </section>

      {result && (
        <section
          id="section-2"
          className="min-h-screen snap-start flex flex-col justify-between py-8 px-4 md:px-8 max-w-6xl mx-auto w-full relative z-10"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-black uppercase text-black">
                <span className="w-2.5 h-2.5 bg-[#E75FA8] inline-block border border-black" />
                <span>Section 02: Result</span>
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

            <CipherResultCard
              result={result}
              onUseAsInput={handleUseResultAsInput}
              onOpenAnalyze={() => scrollToSection('section-3')}
            />
          </div>

          <div className="pt-4 pb-2 flex justify-center">
            <button
              type="button"
              onClick={() => scrollToSection('section-3')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border-2 border-black font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Scroll Down to Analysis (Section 3)</span>
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </section>
      )}

      <section
        id="section-3"
        className="min-h-screen snap-start flex flex-col justify-start py-8 px-4 md:px-8 max-w-6xl mx-auto w-full space-y-6 relative z-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3">
          <div className="flex items-center gap-2 font-mono text-xs font-black uppercase text-black">
            <span className="w-2.5 h-2.5 bg-[#BE4BCE] inline-block border border-black" />
            <span>Section 03: Analysis</span>
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
