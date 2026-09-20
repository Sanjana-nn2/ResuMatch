import React from 'react';
import { Download, Zap, Compass, CheckCircle } from 'lucide-react';

export default function MatchScoreCard({
  matchScore = 0,
  cosineSimilarity = 0,
  skillMatchRatio = 0,
  totalJdSkills = 0,
  totalMatched = 0,
  latencyMs = 0,
  onDownloadReport,
  isDownloading,
}) {
  // Determine color status based on score threshold
  const getScoreTheme = (score) => {
    if (score >= 75) return { text: 'text-[#10B981]', border: 'border-[#10B981]', bg: 'bg-[#10B981]/10', label: 'Strong Fit' };
    if (score >= 50) return { text: 'text-[#F59E0B]', border: 'border-[#F59E0B]', bg: 'bg-[#F59E0B]/10', label: 'Moderate Fit' };
    return { text: 'text-[#EF4444]', border: 'border-[#EF4444]', bg: 'bg-[#EF4444]/10', label: 'Significant Gap' };
  };

  const theme = getScoreTheme(matchScore);

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Match Score Display */}
        <div className="flex items-center space-x-4">
          <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 ${theme.border} ${theme.bg}`}>
            <span className={`font-mono font-bold text-2xl ${theme.text}`}>
              {Math.round(matchScore)}%
            </span>
            <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
              Match
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${theme.bg} ${theme.text}`}>
                {theme.label}
              </span>
              <span className="text-xs text-[#9CA3AF] font-mono">
                {latencyMs}ms inference
              </span>
            </div>
            <h3 className="font-heading font-semibold text-lg text-[#F9FAFB] mt-1">
              Semantic Alignment
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Calculated via sentence-transformers dense embeddings.
            </p>
          </div>
        </div>

        {/* Export PDF Button */}
        <button
          onClick={onDownloadReport}
          disabled={isDownloading}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#1F2937] hover:bg-[#374151] active:scale-95 text-xs font-semibold text-[#F9FAFB] border border-[#374151] transition-all disabled:opacity-50 min-h-[44px]"
        >
          <Download className="w-4 h-4 text-[#10B981]" />
          <span>{isDownloading ? 'Generating...' : 'Export PDF Report'}</span>
        </button>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1E293B]">
        <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B]">
          <div className="flex items-center space-x-1.5 text-xs text-[#9CA3AF] mb-1">
            <Compass className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Cosine Sim</span>
          </div>
          <span className="font-mono text-base font-bold text-[#F9FAFB]">
            {cosineSimilarity}
          </span>
          <span className="text-[10px] text-[#6B7280] block">Scale: -1.0 to 1.0</span>
        </div>

        <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B]">
          <div className="flex items-center space-x-1.5 text-xs text-[#9CA3AF] mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Keyword Ratio</span>
          </div>
          <span className="font-mono text-base font-bold text-[#F9FAFB]">
            {skillMatchRatio}%
          </span>
          <span className="text-[10px] text-[#6B7280] block">{totalMatched} of {totalJdSkills} JD skills</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B]">
          <div className="flex items-center space-x-1.5 text-xs text-[#9CA3AF] mb-1">
            <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Embedding Model</span>
          </div>
          <span className="font-mono text-xs font-semibold text-[#F9FAFB] block truncate">
            all-MiniLM-L6-v2
          </span>
          <span className="text-[10px] text-[#6B7280] block">384 Dense Vectors</span>
        </div>
      </div>
    </div>
  );
}
