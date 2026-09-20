import React, { useState, useRef } from 'react';
import { GitCompare, Upload, FileText, X, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import api, { getFriendlyErrorMessage } from '../api/client';
import VersionCompare from '../components/VersionCompare';
import SuggestionList from '../components/SuggestionList';
import InterviewQuestions from '../components/InterviewQuestions';

export default function ComparePage({ onNavigateToAuth }) {
  const [v1Text, setV1Text] = useState('');
  const [v1File, setV1File] = useState(null);
  const [v1FileName, setV1FileName] = useState('');
  const [isUploadingV1, setIsUploadingV1] = useState(false);
  const v1FileInputRef = useRef(null);

  const [v2Text, setV2Text] = useState('');
  const [v2File, setV2File] = useState(null);
  const [v2FileName, setV2FileName] = useState('');
  const [isUploadingV2, setIsUploadingV2] = useState(false);
  const v2FileInputRef = useRef(null);

  const [jdText, setJdText] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle Version 1 File Upload (PDF, DOCX, TXT)
  const handleV1FileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setV1File(file);
    setV1FileName(file.name);
    setIsUploadingV1(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/api/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setV1Text(res.data.rawText || '');
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsUploadingV1(false);
      if (e.target) e.target.value = '';
    }
  };

  // Remove Version 1 Uploaded File
  const handleRemoveV1File = () => {
    setV1File(null);
    setV1FileName('');
    setV1Text('');
    if (v1FileInputRef.current) {
      v1FileInputRef.current.value = '';
    }
  };

  // Handle Version 2 File Upload (PDF, DOCX, TXT)
  const handleV2FileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setV2File(file);
    setV2FileName(file.name);
    setIsUploadingV2(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/api/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setV2Text(res.data.rawText || '');
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsUploadingV2(false);
      if (e.target) e.target.value = '';
    }
  };

  // Remove Version 2 Uploaded File
  const handleRemoveV2File = () => {
    setV2File(null);
    setV2FileName('');
    setV2Text('');
    if (v2FileInputRef.current) {
      v2FileInputRef.current.value = '';
    }
  };

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
        resumeV1Title: v1FileName ? `Original (${v1FileName})` : 'Original Resume (v1)',
        resumeV2Title: v2FileName ? `Optimized (${v2FileName})` : 'Optimized Resume (v2)',
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
    setV1File(null);
    setV1FileName('');
    setV2File(null);
    setV2FileName('');
    if (v1FileInputRef.current) v1FileInputRef.current.value = '';
    if (v2FileInputRef.current) v2FileInputRef.current.value = '';
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
          {/* Version 1: Original Resume */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#9CA3AF]" />
                <span className="font-heading font-semibold text-xs text-[#9CA3AF] uppercase tracking-wide">
                  Original Resume (v1)
                </span>
              </div>
              {v1FileName && (
                <div className="flex items-center space-x-1.5 bg-[#1F2937] border border-[#374151] px-2 py-0.5 rounded-lg text-[11px] font-mono text-[#9CA3AF]">
                  <span className="truncate max-w-[110px] sm:max-w-[140px]">{v1FileName}</span>
                  <button
                    type="button"
                    onClick={handleRemoveV1File}
                    className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors p-0.5 cursor-pointer"
                    title="Remove uploaded file"
                    aria-label="Remove uploaded file for Version 1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* File Upload Area */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#374151] hover:border-[#10B981] rounded-xl p-3 cursor-pointer bg-[#0B0F19] transition-colors min-h-[52px]">
              <input
                ref={v1FileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleV1FileUpload}
                className="hidden"
              />
              <div className="flex items-center space-x-2 text-xs text-[#9CA3AF]">
                {isUploadingV1 ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                ) : (
                  <Upload className="w-4 h-4 text-[#10B981]" />
                )}
                <span>
                  {isUploadingV1
                    ? 'Extracting resume text...'
                    : v1FileName
                    ? 'Tap to replace file (PDF, DOCX, TXT)'
                    : 'Tap to upload PDF, DOCX, or TXT'}
                </span>
              </div>
            </label>

            <div className="flex items-center space-x-2 text-[10px] text-[#6B7280] justify-center">
              <span>— or paste/edit plain text below —</span>
            </div>

            <textarea
              rows={6}
              value={v1Text}
              onChange={(e) => setV1Text(e.target.value)}
              placeholder="Paste or edit original resume content..."
              className="w-full bg-[#0B0F19] border border-[#1E293B] focus:border-[#10B981] rounded-xl p-3 text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none font-sans resize-none"
            />
          </div>

          {/* Version 2: Optimized Resume */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#10B981]" />
                <span className="font-heading font-semibold text-xs text-[#10B981] uppercase tracking-wide">
                  Optimized Resume (v2)
                </span>
              </div>
              {v2FileName && (
                <div className="flex items-center space-x-1.5 bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[#10B981]">
                  <span className="truncate max-w-[110px] sm:max-w-[140px]">{v2FileName}</span>
                  <button
                    type="button"
                    onClick={handleRemoveV2File}
                    className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors p-0.5 cursor-pointer"
                    title="Remove uploaded file"
                    aria-label="Remove uploaded file for Version 2"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* File Upload Area */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#374151] hover:border-[#10B981] rounded-xl p-3 cursor-pointer bg-[#0B0F19] transition-colors min-h-[52px]">
              <input
                ref={v2FileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleV2FileUpload}
                className="hidden"
              />
              <div className="flex items-center space-x-2 text-xs text-[#9CA3AF]">
                {isUploadingV2 ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                ) : (
                  <Upload className="w-4 h-4 text-[#10B981]" />
                )}
                <span>
                  {isUploadingV2
                    ? 'Extracting resume text...'
                    : v2FileName
                    ? 'Tap to replace file (PDF, DOCX, TXT)'
                    : 'Tap to upload PDF, DOCX, or TXT'}
                </span>
              </div>
            </label>

            <div className="flex items-center space-x-2 text-[10px] text-[#6B7280] justify-center">
              <span>— or paste/edit plain text below —</span>
            </div>

            <textarea
              rows={6}
              value={v2Text}
              onChange={(e) => setV2Text(e.target.value)}
              placeholder="Paste or edit updated/tailored resume content..."
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
          disabled={isLoading || isUploadingV1 || isUploadingV2}
          className="w-full min-h-[48px] py-3 rounded-2xl font-heading font-bold text-sm bg-[#10B981] hover:bg-[#059669] active:scale-[0.99] text-[#0B0F19] flex items-center justify-center space-x-2 shadow-lg shadow-[#10B981]/20 transition-all disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI engine is starting or analyzing your resume. This may take a moment...</span>
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
          <VersionCompare compareResult={compareResult} compareData={compareResult} />

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
