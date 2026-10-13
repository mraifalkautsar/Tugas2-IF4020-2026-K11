import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import MainPage from './pages/MainPage';
import AnalyzePage from './pages/AnalyzePage';

interface AnalysisState {
  plainBytes: Uint8Array;
  cipherBytes: Uint8Array;
  keyStr: string;
}

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'main' | 'analyze'>('landing');
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisState>({
    plainBytes: new TextEncoder().encode('BrainrotCipherSPN128'),
    cipherBytes: new Uint8Array([
      0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0x01, 0x23,
      0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0x01, 0x23,
    ]),
    keyStr: '00112233445566778899aabbccddeeff',
  });

  const handleFileDropOnLanding = (file: File) => {
    setDroppedFile(file);
    setCurrentPage('main');
  };

  const handleNavigateToMain = () => {
    setDroppedFile(null);
    setCurrentPage('main');
  };

  const handleBackToLanding = () => {
    setCurrentPage('landing');
  };

  const handleNavigateToAnalyze = (data: AnalysisState) => {
    setAnalysisData(data);
    setCurrentPage('analyze');
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased selection:bg-[#EC8DD1] selection:text-black">
      {currentPage === 'landing' && (
        <LandingPage
          onNavigateToMain={handleNavigateToMain}
          onFileDropToMain={handleFileDropOnLanding}
        />
      )}

      {currentPage === 'main' && (
        <MainPage
          initialFile={droppedFile}
          onBackToLanding={handleBackToLanding}
          onNavigateToAnalyze={handleNavigateToAnalyze}
        />
      )}

      {currentPage === 'analyze' && (
        <AnalyzePage
          plainBytes={analysisData.plainBytes}
          cipherBytes={analysisData.cipherBytes}
          keyStr={analysisData.keyStr}
          onBackToMain={handleBackToMain}
        />
      )}
    </div>
  );
};

export default App;
