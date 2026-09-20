import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';

export default function SuggestionList({ suggestions = [] }) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-xl">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-lg text-[#F9FAFB]">
            Actionable Optimization Recommendations
          </h3>
          <p className="text-xs text-[#9CA3AF]">
            Specific resume revisions to close the keyword gap before applying.
          </p>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {suggestions.map((item, index) => (
          <div
            key={index}
            className="bg-[#0B0F19] border border-[#1E293B] hover:border-[#374151] rounded-xl p-4 transition-all"
          >
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-[#1F2937] text-xs font-mono font-bold text-[#F9FAFB] flex items-center justify-center flex-shrink-0 mt-0.5">
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                    {item.skill}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] font-sans">
                    {item.category}
                  </span>
                  {item.importance === 'High' && (
                    <span className="text-[10px] font-semibold text-[#EF4444] bg-[#EF4444]/10 px-1.5 py-0.5 rounded">
                      High Priority
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#F9FAFB] font-medium leading-relaxed mb-1">
                  {item.action}
                </p>

                <div className="flex items-center space-x-1.5 text-[11px] text-[#9CA3AF]">
                  <ArrowRight className="w-3 h-3 text-[#F59E0B] flex-shrink-0" />
                  <span>{item.reason}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
