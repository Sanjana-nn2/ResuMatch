import React, { useState } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import AnalyzerPage from './pages/AnalyzerPage';
import ComparePage from './pages/ComparePage';
import HistoryPage from './pages/HistoryPage';
import ObservabilityPage from './pages/ObservabilityPage';
import AuthPage from './pages/AuthPage';
import api, { getFriendlyErrorMessage } from './api/client';
import { useAuth } from './context/AuthContext';

export default function App() {
  // App opens directly to the Match/Analyzer page so any recruiter/guest immediately sees the core product
  const [activeTab, setActiveTab] = useState('analyze');
  const [quickDemoResult, setQuickDemoResult] = useState(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [authRegisterMode, setAuthRegisterMode] = useState(false);
  const [demoNotice, setDemoNotice] = useState(null);

  // Navigate to Account tab in either Sign In or Create Account mode
  const handleNavigateToAuth = (registerMode = false) => {
    setAuthRegisterMode(registerMode);
    setActiveTab('account');
  };

  // Instant 10-second demo trigger accessible to all users (including guests)
  const handleTriggerQuickDemo = async () => {
    setActiveTab('analyze');
    setIsDemoLoading(true);
    setDemoNotice(null);
    try {
      const res = await api.post('/api/analyze/demo');
      setQuickDemoResult(res.data);
    } catch (err) {
      setDemoNotice(getFriendlyErrorMessage(err));
      // Auto-clear notification after 5 seconds
      setTimeout(() => setDemoNotice(null), 5000);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] flex flex-col font-sans">
      {/* Mobile-First Sticky Header */}
      <Navbar
        onQuickDemo={handleTriggerQuickDemo}
        isAnalyzing={isDemoLoading}
        onNavigateToAccount={() => setActiveTab('account')}
      />

      {/* Global unobtrusive demo notification */}
      {demoNotice && (
        <div className="max-w-md mx-auto w-full px-4 pt-2">
          <div className="bg-[#1F2937] border border-[#374151] text-[#9CA3AF] text-xs px-3 py-2 rounded-xl text-center shadow-lg">
            {demoNotice}
          </div>
        </div>
      )}

      {/* Main View Container with safe bottom padding for Android BottomNav */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5">
        {activeTab === 'analyze' && (
          <AnalyzerPage
            quickDemoResult={quickDemoResult}
            isAnalyzing={isDemoLoading}
            setIsAnalyzing={setIsDemoLoading}
            onNavigateToAuth={handleNavigateToAuth}
          />
        )}
        {activeTab === 'compare' && <ComparePage onNavigateToAuth={handleNavigateToAuth} />}
        {activeTab === 'history' && (
          <HistoryPage
            onSelectAnalysis={(res) => {
              setQuickDemoResult(res);
              setActiveTab('analyze');
            }}
            onNavigateToAuth={handleNavigateToAuth}
          />
        )}
        {activeTab === 'admin' && <ObservabilityPage />}
        {activeTab === 'account' && (
          <AuthPage
            initialRegisterMode={authRegisterMode}
            onAuthSuccess={() => setActiveTab('analyze')}
          />
        )}
      </main>

      {/* Touch-Friendly Android Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
