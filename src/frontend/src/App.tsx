import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import MainPage from './pages/MainPage';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'main'>('landing');
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  // Smooth transition when a file is dropped directly on the landing page
  const handleFileDropOnLanding = (file: File) => {
    setDroppedFile(file);
    setCurrentPage('main');
  };

  // Direct navigation from landing to main page
  const handleNavigateToMain = () => {
    setDroppedFile(null);
    setCurrentPage('main');
  };

  // Back navigation to landing page
  const handleBackToLanding = () => {
    setCurrentPage('landing');
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased selection:bg-[#EC8DD1] selection:text-black">
      {currentPage === 'landing' ? (
        <LandingPage
          onNavigateToMain={handleNavigateToMain}
          onFileDropToMain={handleFileDropOnLanding}
        />
      ) : (
        <MainPage
          initialFile={droppedFile}
          onBackToLanding={handleBackToLanding}
        />
      )}
    </div>
  );
};

export default App;
