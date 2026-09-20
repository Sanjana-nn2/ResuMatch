const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Sensible timeout allowing Render free tier cold-start and model initialization
const ML_TIMEOUT_MS = 45000; // 45s timeout per request
const MAX_RETRIES = 2; // Maximum 2 retries after original request (total 3 attempts)
const RETRY_DELAY_MS = 3000; // 3 seconds delay between retries

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: ML_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'ResuMatch-Node-Backend/1.0',
  },
});

/**
 * Determine if an error is transient and safe to retry (network error, timeout, HTTP 502/503/504)
 */
function isTransientError(err) {
  if (!err) return false;

  // No HTTP response received (network failure, socket hangup, timeout)
  if (!err.response) {
    return true;
  }

  const status = err.response.status;
  // 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout (Render cold-start codes)
  if (status === 502 || status === 503 || status === 504) {
    return true;
  }

  return false;
}

/**
 * Sleep helper for bounded retry delay
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an ML HTTP request with bounded retry for cold starts
 * @param {Function} requestFn - Function returning Axios promise
 * @param {string} operationName - Operation identifier for logs
 */
async function executeWithRetry(requestFn, operationName = 'ML Request') {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[ML Client] ${operationName}: retry attempt ${attempt}/${MAX_RETRIES} (cold start recovery)...`);
      }
      const res = await requestFn();
      return res.data;
    } catch (err) {
      lastError = err;

      // Do NOT retry normal 4xx validation errors or non-transient errors
      if (!isTransientError(err) || attempt >= MAX_RETRIES) {
        break;
      }

      const statusInfo = err.response ? `HTTP ${err.response.status}` : (err.code || err.message);
      console.warn(
        `[ML Client] ${operationName} attempt ${attempt + 1} failed (${statusInfo}). Retrying in ${RETRY_DELAY_MS / 1000}s...`
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  // Friendly error if transient failure persists after bounded retries
  if (lastError && isTransientError(lastError)) {
    console.error(`[ML Client] ${operationName} failed after ${MAX_RETRIES + 1} attempts:`, lastError.message);
    throw new Error('The AI analysis engine is temporarily starting up or unavailable. Please wait a moment and retry.');
  }

  if (lastError && lastError.response) {
    const errorDetail = typeof lastError.response.data === 'object' && lastError.response.data !== null
      ? (lastError.response.data.detail || lastError.response.data.error || JSON.stringify(lastError.response.data))
      : lastError.response.data;
    throw new Error(`ML Service error (${lastError.response.status}): ${errorDetail}`);
  }

  throw new Error(`Failed to communicate with ML Microservice: ${lastError ? lastError.message : 'Unknown error'}`);
}

/**
 * Health check on ML service (short-lived probe without retry delay)
 */
async function checkMLHealth() {
  try {
    const res = await client.get('/health', { timeout: 8000 });
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
  return executeWithRetry(
    () => client.post('/api/v1/analyze', {
      resume_text: resumeText,
      job_description_text: jobDescriptionText,
    }),
    'Analyze'
  );
}

/**
 * Computes semantic similarity between two texts
 */
async function callSimilarity(resumeText, jobDescriptionText) {
  return executeWithRetry(
    () => client.post('/api/v1/similarity', {
      resume_text: resumeText,
      job_description_text: jobDescriptionText,
    }),
    'Similarity'
  );
}

/**
 * Extracts skills from given text
 */
async function callExtractSkills(text) {
  return executeWithRetry(
    () => client.post('/api/v1/extract-skills', { text }),
    'ExtractSkills'
  );
}

/**
 * Generates dense vector embeddings for an array of texts
 * @param {string[]} texts
 */
async function callEmbed(texts) {
  return executeWithRetry(
    () => client.post('/api/v1/embed', { texts }),
    'Embed'
  );
}

module.exports = {
  checkMLHealth,
  callAnalyze,
  callSimilarity,
  callExtractSkills,
  callEmbed,
};
