import React from 'react';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export default function VersionCompare({ compareResult }) {
  if (!compareResult) return null;

  const { v1, v2, delta } = compareResult;

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-xl space-y-4">
      {/* Delta Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${
        delta.improved
          ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
          : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center border border-current">
            {delta.improved ? (
              <ArrowUpRight className="w-6 h-6 stroke-[2.5px]" />
            ) : (
              <ArrowDownRight className="w-6 h-6 stroke-[2.5px]" />
            )}
          </div>
          <div>
            <h4 className="font-heading font-bold text-base text-[#F9FAFB]">
              {delta.improved
                ? `Score Improved by +${delta.scoreDelta}%`
                : delta.scoreDelta === 0
                ? 'No Score Change Detected'
                : `Score Decreased by ${delta.scoreDelta}%`}
            </h4>
            <p className="text-xs text-[#9CA3AF]">
              Resolved {delta.resolvedCount} critical missing keyword gaps in Version 2.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Delta</span>
          <span className="font-mono text-xl font-bold">
            {delta.scoreDelta > 0 ? `+${delta.scoreDelta}%` : `${delta.scoreDelta}%`}
          </span>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Version 1 */}
        <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9CA3AF] uppercase">
              {v1.title}
            </span>
            <span className="font-mono text-lg font-bold text-[#F9FAFB]">
              {v1.matchScore}%
            </span>
          </div>
          <div className="text-xs text-[#9CA3AF] mb-3">
            Keyword Match: {v1.skillMatchRatio}% ({v1.matchedSkills.length} skills)
          </div>

          <span className="text-[10px] uppercase text-[#6B7280] font-bold block mb-1.5">
            Key Missing Keywords ({v1.missingSkills.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {v1.missingSkills.slice(0, 5).map((s) => (
              <span key={s.name} className="px-2 py-0.5 rounded bg-[#1F2937] text-[#9CA3AF] text-[11px] font-mono">
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {/* Version 2 */}
        <div className="bg-[#0B0F19] border border-[#10B981]/40 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#10B981] uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{v2.title}</span>
            </div>
            <span className="font-mono text-lg font-bold text-[#10B981]">
              {v2.matchScore}%
            </span>
          </div>
          <div className="text-xs text-[#9CA3AF] mb-3">
            Keyword Match: {v2.skillMatchRatio}% ({v2.matchedSkills.length} skills)
          </div>

          <span className="text-[10px] uppercase text-[#10B981] font-bold block mb-1.5">
            Newly Gained Keywords ({delta.resolvedCount}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {delta.newlyResolvedSkills.map((s) => (
              <span key={s.name} className="px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] text-[11px] font-mono border border-[#10B981]/30">
                +{s.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
