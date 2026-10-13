import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import MainPage from './pages/MainPage';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'main'>('landing');
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

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
        />
      )}
    </div>
  );
};

export default App;
