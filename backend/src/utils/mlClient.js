const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 30000, // 30s timeout to allow heavy embedding inferences
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'ResuMatch-Node-Backend/1.0',
  },
});

/**
 * Health check on ML service
 */
async function checkMLHealth() {
  try {
    const res = await client.get('/health');
    return res.data;
  } catch (err) {
    throw new Error(`ML Microservice is unreachable at ${ML_SERVICE_URL}: ${err.message}`);
  }
}

/**
 * Invokes complete analysis pipeline in ML microservice
 * @param {string} resumeText
 * @param {string} jobDescriptionText
 */
async function callAnalyze(resumeText, jobDescriptionText) {
  try {
    const res = await client.post('/api/v1/analyze', {
      resume_text: resumeText,
      job_description_text: jobDescriptionText,
    });
    return res.data;
  } catch (err) {
    if (err.response) {
      throw new Error(`ML Service error (${err.response.status}): ${JSON.stringify(err.response.data)}`);
    }
    throw new Error(`Failed to communicate with ML Microservice: ${err.message}`);
  }
}

/**
 * Computes semantic similarity between two texts
 */
async function callSimilarity(resumeText, jobDescriptionText) {
  try {
    const res = await client.post('/api/v1/similarity', {
      resume_text: resumeText,
      job_description_text: jobDescriptionText,
    });
    return res.data;
  } catch (err) {
    throw new Error(`ML Similarity failed: ${err.message}`);
  }
}

/**
 * Extracts skills from given text
 */
async function callExtractSkills(text) {
  try {
    const res = await client.post('/api/v1/extract-skills', { text });
    return res.data;
  } catch (err) {
    throw new Error(`ML Skill extraction failed: ${err.message}`);
  }
}

/**
 * Generates dense vector embeddings for an array of texts
 * @param {string[]} texts
 */
async function callEmbed(texts) {
  try {
    const res = await client.post('/api/v1/embed', { texts });
    return res.data;
  } catch (err) {
    throw new Error(`ML Embed failed: ${err.message}`);
  }
}

module.exports = {
  checkMLHealth,
  callAnalyze,
  callSimilarity,
  callExtractSkills,
  callEmbed,
};
