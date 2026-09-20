import React, { useState } from 'react';
import { Upload, FileText, Send, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import api, { getFriendlyErrorMessage } from '../api/client';
import MatchScoreCard from '../components/MatchScoreCard';
import GapAnalysis from '../components/GapAnalysis';
import SuggestionList from '../components/SuggestionList';
import InterviewQuestions from '../components/InterviewQuestions';

export default function AnalyzerPage({ quickDemoResult, isAnalyzing, setIsAnalyzing, onNavigateToAuth }) {
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdTitle, setJdTitle] = useState('');
  const [jdCompany, setJdCompany] = useState('');
  const [analysisResult, setAnalysisResult] = useState(quickDemoResult || null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Sync quick demo results if triggered from Navbar
  React.useEffect(() => {
    if (quickDemoResult) {
      setAnalysisResult(quickDemoResult);
      setError(null);
    }
  }, [quickDemoResult]);

  // Handle Resume File Upload (Mobile & Desktop file picker)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeFile(file);
    setFileName(file.name);
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/api/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResumeText(res.data.rawText);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  // Run Semantic Match Pipeline
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() || !jdText.trim()) {
      setError('Please provide both your resume (upload or text) and a job description.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await api.post('/api/analyze/match', {
        resumeText,
        jobDescriptionText: jdText,
        jdTitle: jdTitle || 'Target Role',
        jdCompany: jdCompany || 'Target Company',
      });
      setAnalysisResult(res.data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Download PDF Report
  const handleDownloadReport = async () => {
    if (!analysisResult) return;
    setIsDownloadingPdf(true);
    try {
      const response = await api.post(
        '/api/reports/generate-pdf',
        {
          candidateName: 'Candidate',
          jobTitle: jdTitle || 'Software Engineer',
          company: jdCompany || 'Target Company',
          matchScore: analysisResult.matchScore,
          cosineSimilarity: analysisResult.cosineSimilarity,
          matchedSkills: analysisResult.matchedSkills,
          missingSkills: analysisResult.missingSkills,
          actionableSuggestions: analysisResult.actionableSuggestions,
          interviewQuestions: analysisResult.interviewQuestions,
        },
        { responseType: 'blob' }
      );

      // Create download link in browser
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `ResuMatch_Report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Page Title & Intro */}
      <div>
        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#F9FAFB] tracking-tight">
          AI Resume & Job Match
        </h2>
        <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
          Upload your resume and paste a job description for semantic embeddings similarity, keyword gap diffing, and interview preparation.
        </p>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] p-3.5 rounded-xl flex items-center space-x-2.5 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Section (Form) */}
      <form onSubmit={handleAnalyze} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resume Upload / Input Card */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#10B981]" />
                <span className="font-heading font-semibold text-sm text-[#F9FAFB]">
                  1. Your Resume
                </span>
              </div>
              {fileName && (
                <span className="text-[11px] font-mono text-[#10B981] truncate max-w-[140px]">
                  {fileName}
                </span>
              )}
            </div>

            {/* Mobile File Picker Upload Area */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#374151] hover:border-[#10B981] rounded-xl p-3 cursor-pointer bg-[#0B0F19] transition-colors min-h-[56px]">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center space-x-2 text-xs text-[#9CA3AF]">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                ) : (
                  <Upload className="w-4 h-4 text-[#10B981]" />
                )}
                <span>
                  {isUploading ? 'Extracting text...' : 'Tap to upload PDF or DOCX'}
                </span>
              </div>
            </label>

            <div className="flex items-center space-x-2 text-[10px] text-[#6B7280] justify-center">
              <span>— or paste plain text below —</span>
            </div>

            {/* Plain text fallback */}
            <textarea
              rows={6}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content, projects, and skills here..."
              className="w-full bg-[#0B0F19] border border-[#1E293B] focus:border-[#10B981] rounded-xl p-3 text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none font-sans resize-none"
            />
          </div>

          {/* Job Description Card */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#06B6D4]" />
                <span className="font-heading font-semibold text-sm text-[#F9FAFB]">
                  2. Target Job Description
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={jdTitle}
                onChange={(e) => setJdTitle(e.target.value)}
                placeholder="Role (e.g. Backend Dev)"
                className="bg-[#0B0F19] border border-[#1E293B] focus:border-[#06B6D4] rounded-xl px-3 py-2 text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none font-sans"
              />
              <input
                type="text"
                value={jdCompany}
                onChange={(e) => setJdCompany(e.target.value)}
                placeholder="Company (e.g. Google)"
                className="bg-[#0B0F19] border border-[#1E293B] focus:border-[#06B6D4] rounded-xl px-3 py-2 text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none font-sans"
              />
            </div>

            <textarea
              rows={8}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the target job description, responsibilities, and required qualifications..."
              className="w-full bg-[#0B0F19] border border-[#1E293B] focus:border-[#06B6D4] rounded-xl p-3 text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none font-sans resize-none flex-1"
            />
          </div>
        </div>

        {/* Big Touch-Friendly Submit Button (Min 48px height) */}
        <button
          type="submit"
          disabled={isAnalyzing}
          className="w-full min-h-[48px] py-3 px-6 rounded-2xl font-heading font-bold text-sm bg-[#10B981] hover:bg-[#059669] active:scale-[0.99] text-[#0B0F19] flex items-center justify-center space-x-2 shadow-lg shadow-[#10B981]/20 transition-all disabled:opacity-60 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI engine is starting or analyzing your resume. This may take a moment...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Run Semantic Match & Gap Analysis</span>
            </>
          )}
        </button>
      </form>

      {/* Results View */}
      {analysisResult && (
        <div className="space-y-6 pt-4 animate-in fade-in duration-300">
          <MatchScoreCard
            matchScore={analysisResult.matchScore}
            cosineSimilarity={analysisResult.cosineSimilarity}
            skillMatchRatio={analysisResult.skillMatchRatio}
            totalJdSkills={analysisResult.totalJdSkills}
            totalMatched={analysisResult.totalMatchedSkills}
            latencyMs={analysisResult.latencyMs}
            onDownloadReport={handleDownloadReport}
            isDownloading={isDownloadingPdf}
          />

          <GapAnalysis
            matchedSkills={analysisResult.matchedSkills}
            missingSkills={analysisResult.missingSkills}
          />

          <SuggestionList
            suggestions={analysisResult.actionableSuggestions}
          />

          <InterviewQuestions
            questions={analysisResult.interviewQuestions}
          />
        </div>
      )}
    </div>
  );
}
