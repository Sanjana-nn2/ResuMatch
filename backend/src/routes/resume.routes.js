const express = require('express');
const multer = require('multer');
const db = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { parseDocumentBuffer, normalizeText } = require('../utils/parser');
const { callExtractSkills } = require('../utils/mlClient');

const router = express.Router();

// Configure Multer for memory storage (max 10MB file upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|txt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are supported.'));
    }
  },
});

/**
 * POST /api/resumes/upload
 * Parse and store an uploaded resume file
 */
router.post('/upload', optionalAuth, upload.single('resume'), async (req, res) => {
  try {
    let rawText = '';
    let fileName = 'Pasted Resume';
    let fileType = 'text';

    if (req.file) {
      fileName = req.file.originalname;
      fileType = req.file.mimetype;
      const parsed = await parseDocumentBuffer(req.file.buffer, req.file.mimetype);
      rawText = parsed.text;
    } else if (req.body.text) {
      rawText = normalizeText(req.body.text);
      if (rawText.length < 30) {
        return res.status(400).json({ error: 'Resume text is too short. Please provide meaningful resume content.' });
      }
    } else {
      return res.status(400).json({ error: 'Please upload a resume file (PDF/DOCX) or paste text.' });
    }

    const title = req.body.title || fileName.replace(/\.[^/.]+$/, '') || 'Untitled Resume';

    // Call ML service to extract skills for metadata indexing
    let extractedSkills = [];
    try {
      const mlRes = await callExtractSkills(rawText);
      extractedSkills = mlRes.skills || [];
    } catch (mlErr) {
      console.warn('[Resume Upload] ML skill extraction warning:', mlErr.message);
    }

    const userId = req.user ? req.user.id : null;

    // If user is authenticated, persist to database
    let resumeId = null;
    if (userId) {
      const insertResult = await db.query(
        `INSERT INTO resumes (user_id, title, file_name, file_type, raw_text, parsed_skills)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, file_name, created_at`,
        [userId, title, fileName, fileType, rawText, JSON.stringify(extractedSkills)]
      );
      resumeId = insertResult.rows[0].id;
    }

    return res.json({
      id: resumeId,
      title,
      fileName,
      rawText,
      extractedSkills,
      wordCount: rawText.split(/\s+/).filter(Boolean).length,
    });
  } catch (err) {
    console.error('[Resume Upload Error]:', err);
    return res.status(400).json({ error: err.message || 'Failed to process resume.' });
  }
});

/**
 * GET /api/resumes
 * List past resumes for authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, file_name, file_type, parsed_skills, created_at
       FROM resumes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json({ resumes: result.rows });
  } catch (err) {
    console.error('[Get Resumes Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve saved resumes.' });
  }
});

/**
 * GET /api/resumes/:id
 * Fetch single resume by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM resumes WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    return res.json({ resume: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Error loading resume.' });
  }
});

module.exports = router;
