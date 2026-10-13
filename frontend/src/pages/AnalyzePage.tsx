import React, { useState } from 'react';
import { ArrowLeft, Activity, BarChart2, Zap, Shield } from 'lucide-react';
import EntropyGauge from '../components/analytics/EntropyGauge';
import HistogramChart from '../components/analytics/HistogramChart';
import AvalancheBench from '../components/analytics/AvalancheBench';

export type AnalyzeTab = 'entropy' | 'histogram' | 'avalanche';

interface AnalyzePageProps {
  plainBytes?: Uint8Array;
  cipherBytes?: Uint8Array;
  keyStr?: string;
  onBackToMain: () => void;
  initialTab?: AnalyzeTab;
}

export const AnalyzePage: React.FC<AnalyzePageProps> = ({
  plainBytes = new Uint8Array(0),
  cipherBytes = new Uint8Array(0),
  keyStr = '00112233445566778899aabbccddeeff',
  onBackToMain,
  initialTab = 'entropy',
}) => {
  const [activeTab, setActiveTab] = useState<AnalyzeTab>(initialTab);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col selection:bg-[#EC8DD1] selection:text-black">
      <header className="w-full border-b-[2.5px] border-black bg-white px-4 md:px-8 py-4 sticky top-0 z-20 shadow-[0px_2px_0px_#000000]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToMain}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 border-2 border-black font-mono font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Return to Cipher Studio"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              Back to Studio
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black uppercase tracking-tight text-black">
                  Cryptographic Analysis Studio
                </h1>
                <span className="text-[11px] font-mono font-bold bg-[#DEC3A1] border-2 border-black px-2 py-0.5 shadow-[1px_1px_0px_#000000] hidden sm:inline-block">
                  [128-BIT SPN METRICS]
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-500">
                Evaluation of Shannon entropy, byte distribution frequency, and avalanche diffusion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('avalanche')}
              className={`px-3.5 py-2 font-mono font-black text-xs uppercase border-2 border-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'avalanche'
                  ? 'bg-[#BE4BCE] text-white shadow-[3px_3px_0px_#000000] -translate-y-0.5'
                  : 'bg-white text-black hover:bg-gray-100 shadow-[1px_1px_0px_#000000]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
              Avalanche
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('entropy')}
              className={`px-3.5 py-2 font-mono font-black text-xs uppercase border-2 border-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'entropy'
                  ? 'bg-[#4542E0] text-white shadow-[3px_3px_0px_#000000] -translate-y-0.5'
                  : 'bg-white text-black hover:bg-gray-100 shadow-[1px_1px_0px_#000000]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
              Entropy
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('histogram')}
              className={`px-3.5 py-2 font-mono font-black text-xs uppercase border-2 border-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'histogram'
                  ? 'bg-[#E75FA8] text-white shadow-[3px_3px_0px_#000000] -translate-y-0.5'
                  : 'bg-white text-black hover:bg-gray-100 shadow-[1px_1px_0px_#000000]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 stroke-[2.5]" />
              Histogram
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
        {activeTab === 'avalanche' && (
          <section className="animate-in fade-in duration-200">
            <AvalancheBench initialKey={keyStr} />
          </section>
        )}

        {activeTab === 'entropy' && (
          <section className="animate-in fade-in duration-200">
            <EntropyGauge plainBytes={plainBytes} cipherBytes={cipherBytes} />
          </section>
        )}

        {activeTab === 'histogram' && (
          <section className="animate-in fade-in duration-200">
            <HistogramChart plainBytes={plainBytes} cipherBytes={cipherBytes} />
          </section>
        )}
      </main>
    </div>
  );
};

export default AnalyzePage;
