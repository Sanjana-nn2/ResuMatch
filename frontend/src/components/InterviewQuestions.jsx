import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Star } from 'lucide-react';

export default function InterviewQuestions({ questions = [] }) {
  const [expandedIndex, setExpandedIndex] = useState(0); // expand first by default

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-xl">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4]">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-lg text-[#F9FAFB]">
            Interview Preparation Angle
          </h3>
          <p className="text-xs text-[#9CA3AF]">
            Anticipated technical questions interviewers will probe based on your missing keywords.
          </p>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {questions.map((q, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div
              key={idx}
              className="bg-[#0B0F19] border border-[#1E293B] rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#151D30] transition-colors"
              >
                <div className="flex items-center space-x-3 pr-2">
                  <span className="font-mono text-xs font-bold text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/20 flex-shrink-0">
                    {q.skill}
                  </span>
                  <p className="text-xs font-semibold text-[#F9FAFB] line-clamp-1">
                    {q.question}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 space-y-2 border-t border-[#1E293B]/60 text-xs">
                  <div className="bg-[#151D30] p-3 rounded-lg border border-[#1E293B]">
                    <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block mb-1">
                      Full Interviewer Question:
                    </span>
                    <p className="text-xs text-[#F9FAFB] font-medium leading-relaxed">
                      "{q.question}"
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0B0F19] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-[#F59E0B] uppercase block mb-1">
                      Why They Probe This:
                    </span>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">
                      {q.probe_reason}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
                    <div className="flex items-center space-x-1 text-[10px] font-bold text-[#10B981] uppercase mb-1">
                      <Star className="w-3 h-3 fill-[#10B981]" />
                      <span>STAR Framework Answering Strategy:</span>
                    </div>
                    <p className="text-xs text-[#E2E8F0] leading-relaxed">
                      {q.star_advice}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
