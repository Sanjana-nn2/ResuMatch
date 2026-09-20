const express = require('express');
const db = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { demoRateLimiter } = require('../middleware/rateLimiter');
const { callAnalyze } = require('../utils/mlClient');
const { normalizeText } = require('../utils/parser');

const router = express.Router();

// Built-in high-quality sample data for instant 10-second recruiter demo
const DEMO_RESUME = `
ALEX CHEN
Full Stack Software Engineer | minchu.portfolio.dev | Bengaluru, India

SUMMARY
Final-Year Information Science and Engineering student with strong hands-on experience building full-stack web applications, REST APIs, and microservices. Proficient in JavaScript, TypeScript, React.js, Node.js, Express, and PostgreSQL.

EDUCATION
B.E. in Information Science and Engineering | 2021 – 2025 | CGPA: 8.8/10

TECHNICAL SKILLS
- Languages: JavaScript, TypeScript, Python, SQL
- Frontend: React.js, Tailwind CSS, HTML5, CSS3
- Backend: Node.js, Express.js, PostgreSQL, REST API Design, JWT Authentication
- Developer Tools: Git, GitHub, Postman, Linux

PROJECTS
1. ResuMatch — AI Resume-to-Job-Description Match & Gap Analyzer
- Built a mobile-first hybrid Android application and web platform using React and Capacitor.
- Engineered a dual-service architecture: Node.js/Express API communicating with a Python FastAPI microservice.
- Integrated sentence-transformers (all-MiniLM-L6-v2) for 384-dimensional dense semantic similarity.
- Extracted and diffed technical keywords using custom regex taxonomies and spaCy NER.

2. Cloud Inventory Management Platform
- Architected RESTful backend with Express.js and PostgreSQL connection pooling.
- Designed relational schemas with foreign key constraints, B-Tree indexes, and ACID transactions.
`;

const DEMO_JOB_DESCRIPTION = `
Position: Associate Software Engineer (Backend & Cloud Platform)
Company: NexaTech Solutions
Location: Remote / Hybrid

About the Role:
We are looking for a motivated Software Engineer to join our core backend and platform engineering team. You will build resilient microservices, design scalable REST APIs, and deploy cloud infrastructure.

Key Responsibilities:
- Design, test, and maintain backend microservices using Node.js and TypeScript.
- Build high-throughput data access layers with PostgreSQL and Redis caching.
- Package services into Docker containers and automate deployments using CI/CD pipelines via GitHub Actions.
- Collaborate with frontend engineers to integrate React applications with backend services.

Requirements & Qualifications:
- Proficiency in Node.js, TypeScript, and React.js.
- Strong understanding of REST API design, relational databases (PostgreSQL), and SQL query optimization.
- Experience with Docker containerization and Kubernetes cluster concepts.
- Familiarity with Redis caching strategies and CI/CD automation.
- Excellent problem-solving and system design fundamentals.
`;

/**
 * POST /api/analyze/match
 * Perform full semantic match and gap analysis between Resume & Job Description
 */
router.post('/match', optionalAuth, async (req, res) => {
  const { resumeText, jobDescriptionText, jdTitle, jdCompany, resumeId } = req.body;

  if (!resumeText || !jobDescriptionText) {
    return res.status(400).json({
      error: 'Both resumeText and jobDescriptionText are required for analysis.',
    });
  }

  const cleanResume = normalizeText(resumeText);
  const cleanJD = normalizeText(jobDescriptionText);

  if (cleanResume.length < 30 || cleanJD.length < 30) {
    return res.status(400).json({
      error: 'Resume or Job Description text is too short to perform meaningful NLP analysis.',
    });
  }

  try {
    // 1. Call Python ML Microservice
    const mlResult = await callAnalyze(cleanResume, cleanJD);

    const userId = req.user ? req.user.id : null;
    let analysisId = null;
    let jdId = null;

    // 2. If authenticated, persist Job Description and Analysis record
    if (userId) {
      const title = jdTitle || 'Target Job Description';
      const company = jdCompany || 'Company';

      const jdResult = await db.query(
        `INSERT INTO job_descriptions (user_id, title, company, raw_text, parsed_skills)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [userId, title, company, cleanJD, JSON.stringify(mlResult.matched_skills.concat(mlResult.missing_skills))]
      );
      jdId = jdResult.rows[0].id;

      const analysisResult = await db.query(
        `INSERT INTO analyses (
           user_id, resume_id, job_description_id, match_score,
           matched_skills, missing_skills, actionable_suggestions,
           interview_questions, latency_ms
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, created_at`,
        [
          userId,
          resumeId || null,
          jdId,
          mlResult.match_score,
          JSON.stringify(mlResult.matched_skills),
          JSON.stringify(mlResult.missing_skills),
          JSON.stringify(mlResult.actionable_suggestions),
          JSON.stringify(mlResult.interview_questions),
          mlResult.latency_ms,
        ]
      );
      analysisId = analysisResult.rows[0].id;
    }

    return res.json({
      analysisId,
      jobDescriptionId: jdId,
      matchScore: mlResult.match_score,
      cosineSimilarity: mlResult.cosine_similarity,
      skillMatchRatio: mlResult.skill_match_ratio,
      totalJdSkills: mlResult.total_jd_skills,
      totalMatchedSkills: mlResult.total_matched_skills,
      matchedSkills: mlResult.matched_skills,
      missingSkills: mlResult.missing_skills,
      actionableSuggestions: mlResult.actionable_suggestions,
      interviewQuestions: mlResult.interview_questions,
      latencyMs: mlResult.latency_ms,
    });
  } catch (err) {
    console.error('[Analyze Match Error]:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed.' });
  }
});

/**
 * POST /api/analyze/compare
 * Resume Version Comparison: Compare v1 vs v2 against the same Job Description
 * Shows score delta and newly resolved keyword gaps!
 */
router.post('/compare', optionalAuth, async (req, res) => {
  const { resumeV1Text, resumeV2Text, jobDescriptionText, resumeV1Title, resumeV2Title } = req.body;

  if (!resumeV1Text || !resumeV2Text || !jobDescriptionText) {
    return res.status(400).json({
      error: 'Please provide resumeV1Text, resumeV2Text, and jobDescriptionText.',
    });
  }

  try {
    // Run ML analysis for both versions
    const [resultV1, resultV2] = await Promise.all([
      callAnalyze(normalizeText(resumeV1Text), normalizeText(jobDescriptionText)),
      callAnalyze(normalizeText(resumeV2Text), normalizeText(jobDescriptionText)),
    ]);

    const scoreDelta = Number((resultV2.match_score - resultV1.match_score).toFixed(2));

    // Find skills present in V2 that were missing in V1
    const v1MissingNames = new Set(resultV1.missing_skills.map((s) => s.name));
    const newlyResolvedSkills = resultV2.matched_skills.filter((s) => v1MissingNames.has(s.name));

    const userId = req.user ? req.user.id : null;
    let analysisId = null;

    if (userId) {
      const saveRes = await db.query(
        `INSERT INTO analyses (
           user_id, match_score, comparison_score, score_delta,
           matched_skills, missing_skills, actionable_suggestions,
           interview_questions, latency_ms
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          userId,
          resultV1.match_score,
          resultV2.match_score,
          scoreDelta,
          JSON.stringify(resultV2.matched_skills),
          JSON.stringify(resultV2.missing_skills),
          JSON.stringify(resultV2.actionable_suggestions),
          JSON.stringify(resultV2.interview_questions),
          resultV1.latency_ms + resultV2.latency_ms,
        ]
      );
      analysisId = saveRes.rows[0].id;
    }

    return res.json({
      analysisId,
      v1: {
        title: resumeV1Title || 'Version 1',
        matchScore: resultV1.match_score,
        skillMatchRatio: resultV1.skill_match_ratio,
        matchedSkills: resultV1.matched_skills,
        missingSkills: resultV1.missing_skills,
      },
      v2: {
        title: resumeV2Title || 'Version 2 (Optimized)',
        matchScore: resultV2.match_score,
        skillMatchRatio: resultV2.skill_match_ratio,
        matchedSkills: resultV2.matched_skills,
        missingSkills: resultV2.missing_skills,
      },
      delta: {
        scoreDelta,
        improved: scoreDelta > 0,
        newlyResolvedSkills,
        resolvedCount: newlyResolvedSkills.length,
      },
      suggestions: resultV2.actionable_suggestions,
      interviewQuestions: resultV2.interview_questions,
    });
  } catch (err) {
    console.error('[Analyze Compare Error]:', err);
    return res.status(500).json({ error: err.message || 'Comparison failed.' });
  }
});

/**
 * POST /api/analyze/demo
 * 10-Second Recruiter Demo Mode (No account required, rate-limited)
 */
router.post('/demo', demoRateLimiter, async (req, res) => {
  const resumeText = req.body.resumeText || DEMO_RESUME;
  const jdText = req.body.jobDescriptionText || DEMO_JOB_DESCRIPTION;

  try {
    const mlResult = await callAnalyze(normalizeText(resumeText), normalizeText(jdText));

    return res.json({
      isDemo: true,
      sampleResumeTitle: 'Alex Chen - Full Stack Engineer (Sample)',
      sampleJdTitle: 'Associate Software Engineer (Backend & Cloud Platform)',
      matchScore: mlResult.match_score,
      cosineSimilarity: mlResult.cosine_similarity,
      skillMatchRatio: mlResult.skill_match_ratio,
      totalJdSkills: mlResult.total_jd_skills,
      totalMatchedSkills: mlResult.total_matched_skills,
      matchedSkills: mlResult.matched_skills,
      missingSkills: mlResult.missing_skills,
      actionableSuggestions: mlResult.actionable_suggestions,
      interviewQuestions: mlResult.interview_questions,
      latencyMs: mlResult.latency_ms,
    });
  } catch (err) {
    console.error('[Demo Analysis Error]:', err);
    return res.status(500).json({ error: 'Demo analysis service is temporarily busy.' });
  }
});

/**
 * GET /api/analyze/history
 * Fetch past match scores & analyses for trend charts
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.id, a.match_score, a.comparison_score, a.score_delta,
              a.matched_skills, a.missing_skills, a.latency_ms, a.created_at,
              COALESCE(jd.title, 'Job Description') as jd_title,
              COALESCE(jd.company, 'Target Company') as company
       FROM analyses a
       LEFT JOIN job_descriptions jd ON a.job_description_id = jd.id
       WHERE a.user_id = $1
       ORDER BY a.created_at ASC`,
      [req.user.id]
    );

    // Format for Recharts Score Trend Line Chart
    const trendData = result.rows.map((row, index) => ({
      index: index + 1,
      date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: parseFloat(row.match_score),
      company: row.company,
      title: row.jd_title,
    }));

    return res.json({
      analyses: result.rows.reverse(), // most recent first for list view
      trendData, // chronological for trend chart
      totalAnalyses: result.rows.length,
      averageScore: result.rows.length
        ? Number((result.rows.reduce((acc, r) => acc + parseFloat(r.match_score), 0) / result.rows.length).toFixed(2))
        : 0,
    });
  } catch (err) {
    console.error('[Analyze History Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch analysis history.' });
  }
});

/**
 * GET /api/analyze/:id
 * Retrieve a specific saved analysis
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, jd.title as jd_title, jd.company as jd_company
       FROM analyses a
       LEFT JOIN job_descriptions jd ON a.job_description_id = jd.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis record not found.' });
    }

    return res.json({ analysis: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load analysis details.' });
  }
});

module.exports = router;
