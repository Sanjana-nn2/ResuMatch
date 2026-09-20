import React, { useEffect, useState } from 'react';
import { History, Calendar, Award, Loader2, AlertCircle, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import api, { getFriendlyErrorMessage } from '../api/client';
import ScoreTrendChart from '../components/ScoreTrendChart';
import { useAuth } from '../context/AuthContext';

export default function HistoryPage({ onSelectAnalysis, onNavigateToAuth }) {
  const { isAuthenticated } = useAuth();
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/api/analyze/history');
        setHistoryData(res.data);
      } catch (err) {
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [isAuthenticated]);

  // Guest State: Polished callout inviting the user to Sign In or Create Account
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center space-y-6 pb-24 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] mx-auto flex items-center justify-center shadow-lg shadow-[#10B981]/10">
          <History className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="font-heading font-bold text-2xl text-[#F9FAFB]">
            Save & Track Your Analyses
          </h3>
          <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-sm mx-auto">
            Sign in to automatically save your resume match records, observe semantic score progression over time, and revisit previous job matches.
          </p>
        </div>

        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 text-left space-y-2.5 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">
            Member Benefits
          </span>
          <div className="space-y-2 text-xs text-[#D1D5DB]">
            <p className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>Historical record of every job description analyzed</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>Semantic match score progression & trend graphs</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>Archived keyword gaps and interview prep questions</span>
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => onNavigateToAuth && onNavigateToAuth(false)}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl font-heading font-bold text-sm bg-[#10B981] hover:bg-[#059669] text-[#0B0F19] flex items-center justify-center space-x-2 transition-all shadow-lg shadow-[#10B981]/20 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to ResuMatch</span>
          </button>

          <button
            onClick={() => onNavigateToAuth && onNavigateToAuth(true)}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-semibold text-xs bg-[#1F2937] hover:bg-[#374151] text-[#F9FAFB] border border-[#374151] flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Free Account</span>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
        <span className="text-xs text-[#9CA3AF]">Loading your match history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div>
        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#F9FAFB] tracking-tight">
          Analysis History & Metrics
        </h2>
        <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
          Review past job description matches and observe score progression over time.
        </p>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] p-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recharts Score Trend Line Chart */}
      <ScoreTrendChart
        trendData={historyData?.trendData || []}
        averageScore={historyData?.averageScore || 0}
      />

      {/* History List */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-xl">
        <h3 className="font-heading font-semibold text-lg text-[#F9FAFB] mb-3">
          Past Match Records ({historyData?.totalAnalyses || 0})
        </h3>

        {(!historyData?.analyses || historyData.analyses.length === 0) ? (
          <p className="text-xs text-[#9CA3AF] py-8 text-center">
            No analyses saved yet. Run a match to begin tracking your scores!
          </p>
        ) : (
          <div className="space-y-3">
            {historyData.analyses.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectAnalysis && onSelectAnalysis(item)}
                className="bg-[#0B0F19] border border-[#1E293B] hover:border-[#374151] rounded-xl p-4 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-[#F9FAFB]">
                      {item.jd_title}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">at {item.company}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-[#6B7280]">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </span>
                    <span>•</span>
                    <span className="font-mono">{item.latency_ms}ms</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-1 text-sm font-mono font-bold text-[#10B981]">
                    <Award className="w-4 h-4" />
                    <span>{Math.round(item.match_score)}%</span>
                  </div>
                  <span className="text-[10px] text-[#9CA3AF]">Match Score</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
