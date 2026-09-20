import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Filter } from 'lucide-react';

export default function GapAnalysis({ matchedSkills = [], missingSkills = [] }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const categories = ['all', 'Languages', 'Frontend', 'Backend', 'Databases', 'DevOps & Cloud', 'Architecture'];

  const filterList = (list) => {
    if (activeFilter === 'all') return list;
    return list.filter((s) => s.category === activeFilter);
  };

  const filteredMatched = filterList(matchedSkills);
  const filteredMissing = filterList(missingSkills);

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-heading font-semibold text-lg text-[#F9FAFB]">
            Keyword & Skill Gap Analysis
          </h3>
          <p className="text-xs text-[#9CA3AF]">
            Diff between Job Description expectations and your resume.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-sans whitespace-nowrap transition-colors min-h-[32px] ${
                activeFilter === cat
                  ? 'bg-[#10B981] text-[#0B0F19] font-bold'
                  : 'bg-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Missing Keywords (Critical Gap) */}
        <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#F59E0B]">
              <AlertCircle className="w-4 h-4" />
              <span>Missing from Resume ({filteredMissing.length})</span>
            </div>
            <span className="text-[10px] text-[#6B7280]">ATS Filter Risk</span>
          </div>

          {filteredMissing.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#9CA3AF]">
              No missing keywords in this category!
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredMissing.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center space-x-1.5 bg-[#1F2937] border border-[#374151] px-2.5 py-1.5 rounded-lg text-xs"
                >
                  <span className="font-mono text-[#F9FAFB] font-medium">{skill.name}</span>
                  <span className="text-[10px] px-1 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-mono">
                    {skill.jd_count}x in JD
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matched Keywords (Present) */}
        <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#10B981]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Matched & Present ({filteredMatched.length})</span>
            </div>
            <span className="text-[10px] text-[#6B7280]">Verified Keywords</span>
          </div>

          {filteredMatched.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#9CA3AF]">
              No matched keywords in this category.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredMatched.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center space-x-1.5 bg-[#10B981]/10 border border-[#10B981]/30 px-2.5 py-1.5 rounded-lg text-xs"
                >
                  <span className="font-mono text-[#F9FAFB] font-medium">{skill.name}</span>
                  <span className="text-[10px] px-1 rounded bg-[#10B981]/20 text-[#10B981] font-mono">
                    {skill.resume_count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
