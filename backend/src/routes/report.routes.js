const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/reports/generate-pdf
 * Exports a clean, structured PDF summary of the analysis
 */
router.post('/generate-pdf', optionalAuth, async (req, res) => {
  const {
    candidateName,
    jobTitle,
    company,
    matchScore,
    cosineSimilarity,
    matchedSkills,
    missingSkills,
    actionableSuggestions,
    interviewQuestions,
  } = req.body;

  try {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `ResuMatch Report - ${candidateName || 'Candidate'}`,
        Author: 'ResuMatch AI Platform',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=ResuMatch_Report_${Date.now()}.pdf`
    );

    doc.pipe(res);

    // Primary Header
    doc
      .fillColor('#0F172A')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('ResuMatch — Resume Gap Analysis Report', { align: 'left' });

    doc
      .fillColor('#64748B')
      .fontSize(10)
      .font('Helvetica')
      .text(`Generated on ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} | AI-Powered Match Engine`, {
        align: 'left',
      });

    doc.moveDown(0.8);
    doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Candidate & Job Meta
    doc
      .fontSize(11)
      .fillColor('#334155')
      .font('Helvetica-Bold')
      .text(`Candidate: `, { continued: true })
      .font('Helvetica')
      .text(candidateName || 'Anonymous Candidate');

    doc
      .font('Helvetica-Bold')
      .text(`Target Position: `, { continued: true })
      .font('Helvetica')
      .text(`${jobTitle || 'Software Engineer'} at ${company || 'Target Company'}`);

    doc.moveDown(1);

    // Score Callout Box
    const scoreBoxTop = doc.y;
    doc.rect(40, scoreBoxTop, 515, 60).fill('#F8FAFC').stroke('#E2E8F0');

    doc
      .fillColor('#0F172A')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`Semantic Match Score: ${matchScore || 0}%`, 55, scoreBoxTop + 15);

    doc
      .fillColor('#64748B')
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Dense Vector Cosine Similarity: ${cosineSimilarity || '0.00'} (Evaluated via 384-dimensional embeddings)`,
        55,
        scoreBoxTop + 35
      );

    doc.y = scoreBoxTop + 75;
    doc.moveDown(0.5);

    // Matched Skills Section
    doc.fillColor('#047857').fontSize(13).font('Helvetica-Bold').text('Skills Found & Matched (Present in Resume):');
    doc.moveDown(0.3);

    const matchedList = matchedSkills && matchedSkills.length > 0
      ? matchedSkills.map((s) => `${s.name} (${s.category || 'General'})`).join(', ')
      : 'None detected';

    doc.fillColor('#1E293B').fontSize(10).font('Helvetica').text(matchedList, { width: 510, lineGap: 3 });
    doc.moveDown(1);

    // Missing Skills Section (The Gap)
    doc.fillColor('#B45309').fontSize(13).font('Helvetica-Bold').text('Critical Keywords Missing from Resume:');
    doc.moveDown(0.3);

    if (missingSkills && missingSkills.length > 0) {
      missingSkills.slice(0, 8).forEach((skill) => {
        doc
          .fillColor('#B45309')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`• ${skill.name} `, { continued: true })
          .fillColor('#475569')
          .font('Helvetica')
          .text(`[${skill.category || 'Skill'}] — Found ${skill.jd_count}x in JD. Importance: ${skill.importance || 'Medium'}`);
      });
    } else {
      doc.fillColor('#1E293B').fontSize(10).font('Helvetica').text('No significant keyword gaps identified!');
    }

    doc.moveDown(1);

    // Actionable Recommendations
    doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Actionable Recommendations:');
    doc.moveDown(0.3);

    if (actionableSuggestions && actionableSuggestions.length > 0) {
      actionableSuggestions.slice(0, 4).forEach((sug, idx) => {
        doc
          .fillColor('#0F172A')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`${idx + 1}. ${sug.action}`);
        doc
          .fillColor('#64748B')
          .fontSize(9)
          .font('Helvetica')
          .text(`   Reason: ${sug.reason}`, { lineGap: 2 });
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(0.8);

    // Interview Preparation Angle
    if (interviewQuestions && interviewQuestions.length > 0) {
      doc.fillColor('#0369A1').fontSize(13).font('Helvetica-Bold').text('Anticipated Technical Interview Probes:');
      doc.moveDown(0.3);

      interviewQuestions.slice(0, 3).forEach((q, idx) => {
        doc
          .fillColor('#0F172A')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`Q${idx + 1} (${q.skill}): ${q.question}`);
        doc
          .fillColor('#475569')
          .fontSize(9)
          .font('Helvetica')
          .text(`Strategy: ${q.star_advice}`, { lineGap: 2 });
        doc.moveDown(0.3);
      });
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor('#94A3B8')
      .text('Generated by ResuMatch • Mobile Android + Web Portfolio Architecture', 40, 780, {
        align: 'center',
        width: 515,
      });

    doc.end();
  } catch (err) {
    console.error('[PDF Report Generation Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF report.' });
    }
  }
});

module.exports = router;
