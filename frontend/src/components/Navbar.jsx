import React from 'react';
import { Sparkles, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onQuickDemo, isAnalyzing, onNavigateToAccount }) {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-[#1E293B] px-4 py-3 safe-pt">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand & Badge */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg text-[#F9FAFB] tracking-tight leading-none">
              ResuMatch
            </h1>
            <span className="text-[10px] text-[#9CA3AF] font-sans">
              NLP Semantic ATS Analyzer
            </span>
          </div>
        </div>

        {/* Action Header Items */}
        <div className="flex items-center space-x-2">
          {/* Quick Demo Button (Accessible to everyone, including guests/recruiters) */}
          <button
            onClick={onQuickDemo}
            disabled={isAnalyzing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1F2937] hover:bg-[#374151] active:scale-95 text-[#F9FAFB] border border-[#374151] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>10s Demo</span>
          </button>

          {/* User state indicator: Clickable to view Account */}
          {isAuthenticated ? (
            <button
              onClick={onNavigateToAccount}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#111827] hover:bg-[#1F2937] border border-[#1E293B] text-xs text-[#10B981] transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[90px]">
                {(user?.fullName || user?.full_name || 'Member').split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={onNavigateToAccount}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#111827] hover:bg-[#1F2937] border border-[#1E293B] text-xs text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span className="text-[11px]">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
