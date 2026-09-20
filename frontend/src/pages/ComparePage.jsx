import React, { useState } from 'react';
import { GitCompare, Send, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import api, { getFriendlyErrorMessage } from '../api/client';
import VersionCompare from '../components/VersionCompare';
import SuggestionList from '../components/SuggestionList';
import InterviewQuestions from '../components/InterviewQuestions';

export default function ComparePage({ onNavigateToAuth }) {
  const [v1Text, setV1Text] = useState('');
  const [v2Text, setV2Text] = useState('');
  const [jdText, setJdText] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!v1Text.trim() || !v2Text.trim() || !jdText.trim()) {
      setError('Please provide Version 1, Version 2, and the target Job Description.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/api/analyze/compare', {
        resumeV1Text: v1Text,
        resumeV2Text: v2Text,
        jobDescriptionText: jdText,
        resumeV1Title: 'Original Resume (v1)',
        resumeV2Title: 'Optimized Resume (v2)',
      });
      setCompareResult(res.data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Preload comparison example for recruiters / guests
  const loadExampleComparison = () => {
    setV1Text(`B.E. student. Built web apps with JavaScript, HTML, CSS. Did basic university projects in web development and database management.`);
    setV2Text(`Final-year Information Science Engineer. Architected full-stack systems using TypeScript, React.js, Node.js, Express, and PostgreSQL. Containerized multi-service apps with Docker and automated testing via GitHub Actions CI/CD.`);
    setJdText(`Full Stack Engineer Requirements: React.js, Node.js, PostgreSQL, Docker, Kubernetes, CI/CD pipelines, and REST API design.`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#F9FAFB] tracking-tight">
            Resume Version Comparison
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
            Compare two versions of your resume against the same Job Description to measure score delta.
          </p>
        </div>

        <button
          type="button"
          onClick={loadExampleComparison}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1F2937] hover:bg-[#374151] text-[#10B981] border border-[#374151] transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Sample Diff</span>
        </button>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] p-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Form */}
      <form onSubmit={handleCompare} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Version 1 */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 space-y-2">
            <span className="font-heading font-semibold text-xs text-[#9CA3AF] block">
              Original Resume (v1)
            </span>
            <textarea
              rows={6}
              value={v1Text}
              onChange={(e) => setV1Text(e.target.value)}
              placeholder="Paste your original resume text..."
              className="w-full bg-[#0B0F19] border border-[#1E293B] focus:border-[#10B981] rounded-xl p-3 text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none font-sans resize-none"
            />
          </div>

          {/* Version 2 */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 space-y-2">
            <span className="font-heading font-semibold text-xs text-[#10B981] block">
              Optimized Resume (v2)
            </span>
            <textarea
              rows={6}
              value={v2Text}
              onChange={(e) => setV2Text(e.target.value)}
              placeholder="Paste your updated/tailored resume text..."
              className="w-full bg-[#0B0F19] border border-[#1E293B] focus:border-[#10B981] rounded-xl p-3 text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none font-sans resize-none"
            />
          </div>
        </div>

        {/* Target Job Description */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 space-y-2">
          <span className="font-heading font-semibold text-xs text-[#06B6D4] block">
            Target Job Description (Baseline Benchmark)
          </span>
          <textarea
            rows={5}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the job description both resumes are targeting..."
            className="w-full bg-[#0B0F19] border border-[#1E293B] focus:border-[#06B6D4] rounded-xl p-3 text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none font-sans resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[48px] py-3 rounded-2xl font-heading font-bold text-sm bg-[#10B981] hover:bg-[#059669] active:scale-[0.99] text-[#0B0F19] flex items-center justify-center space-x-2 shadow-lg shadow-[#10B981]/20 transition-all disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Calculating Embedding Similarity & Deltas...</span>
            </>
          ) : (
            <>
              <GitCompare className="w-4 h-4" />
              <span>Compare Resume Versions</span>
            </>
          )}
        </button>
      </form>

      {/* Comparison Results */}
      {compareResult && (
        <div className="space-y-6 pt-4 animate-in fade-in duration-300">
          <VersionCompare compareData={compareResult} />

          {compareResult.v2Result?.actionableSuggestions && (
            <SuggestionList
              suggestions={compareResult.v2Result.actionableSuggestions}
            />
          )}

          {compareResult.v2Result?.interviewQuestions && (
            <InterviewQuestions
              questions={compareResult.v2Result.interviewQuestions}
            />
          )}
        </div>
      )}
    </div>
  );
}
