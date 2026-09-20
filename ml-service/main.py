import os
import time
import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Optional, Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load local environment variables if present
load_dotenv()

from model import model_manager
from extractor import skill_extractor
from interview_gen import interview_generator

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("resumatch-ml.server")

# ---------------------------------------------------------------------------
# Lifespan Management (Warm up models on startup)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ResuMatch ML Microservice...")
    start_time = time.time()
    # Pre-warm Sentence-Transformer embedding model
    model_manager.load_model()
    load_duration = round(time.time() - start_time, 2)
    logger.info(f"Model pre-warmed and ready in {load_duration}s.")
    yield
    logger.info("Shutting down ResuMatch ML Microservice.")

# ---------------------------------------------------------------------------
# FastAPI Application Initialization
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ResuMatch ML Microservice",
    description="NLP & Semantic Match Engine for Resume-to-Job-Description Gap Analysis",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for internal Node.js backend calls and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    service: str
    model_name: str
    timestamp: float

class EmbedRequest(BaseModel):
    texts: List[str] = Field(..., min_items=1, description="List of strings to embed")

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimension: int
    count: int

class SimilarityRequest(BaseModel):
    resume_text: str = Field(..., min_length=10, description="Clean text extracted from resume")
    job_description_text: str = Field(..., min_length=10, description="Job description text")

class SimilarityResponse(BaseModel):
    cosine_similarity: float
    match_score: float

class ExtractSkillsRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Document text to extract skills from")

class ExtractSkillsResponse(BaseModel):
    skills: List[Dict[str, Any]]
    total_found: int

class AnalyzeRequest(BaseModel):
    resume_text: str = Field(..., min_length=10, description="Full text extracted from candidate resume")
    job_description_text: str = Field(..., min_length=10, description="Full text from target job description")

class AnalyzeResponse(BaseModel):
    match_score: float
    cosine_similarity: float
    skill_match_ratio: float
    total_jd_skills: int
    total_matched_skills: int
    matched_skills: List[Dict[str, Any]]
    missing_skills: List[Dict[str, Any]]
    actionable_suggestions: List[Dict[str, Any]]
    interview_questions: List[Dict[str, Any]]
    latency_ms: int

# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint used by Docker, Kubernetes, and Node.js proxy."""
    return HealthResponse(
        status="healthy",
        service="resumatch-ml-service",
        model_name=model_manager.model_name,
        timestamp=time.time()
    )

@app.post("/api/v1/embed", response_model=EmbedResponse, tags=["NLP Inference"])
@app.post("/api/v1/embeddings", response_model=EmbedResponse, include_in_schema=False)
@app.post("/api/v1/embedding", response_model=EmbedResponse, include_in_schema=False)
async def generate_embeddings(payload: EmbedRequest):
    """Generates 384-dimensional dense vector embeddings for input strings."""
    try:
        vectors = model_manager.embed_texts(payload.texts)
        vectors_list = vectors.tolist()
        return EmbedResponse(
            embeddings=vectors_list,
            dimension=len(vectors_list[0]) if vectors_list else 0,
            count=len(vectors_list)
        )
    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate embeddings: {str(e)}"
        )

@app.post("/api/v1/similarity", response_model=SimilarityResponse, tags=["NLP Inference"])
async def compute_similarity(payload: SimilarityRequest):
    """Computes semantic similarity and 0-100 match score between resume and JD."""
    try:
        cosine, match_score = model_manager.compute_document_similarity(
            payload.resume_text,
            payload.job_description_text
        )
        return SimilarityResponse(
            cosine_similarity=cosine,
            match_score=match_score
        )
    except Exception as e:
        logger.error(f"Similarity calculation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute similarity: {str(e)}"
        )

@app.post("/api/v1/extract-skills", response_model=ExtractSkillsResponse, tags=["Skill Extraction"])
async def extract_skills_endpoint(payload: ExtractSkillsRequest):
    """Extracts technical skills, canonical names, categories, and counts from text."""
    try:
        skills = skill_extractor.extract_skills(payload.text)
        return ExtractSkillsResponse(
            skills=skills,
            total_found=len(skills)
        )
    except Exception as e:
        logger.error(f"Skill extraction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract skills: {str(e)}"
        )

@app.post("/api/v1/analyze", response_model=AnalyzeResponse, tags=["Complete Analysis Pipeline"])
async def run_complete_analysis(payload: AnalyzeRequest):
    """
    Executes the entire NLP pipeline in a single high-performance call:
    1. Dense semantic embedding & cosine similarity
    2. NER & taxonomy-based skill extraction for both texts
    3. Skill diffing (matched vs. missing keywords)
    4. Concrete, actionable resume edit suggestions
    5. Targeted technical interview probe questions
    """
    t_start = time.time()
    try:
        # Step 1: Semantic Embedding Similarity
        raw_cosine, match_score = model_manager.compute_document_similarity(
            payload.resume_text,
            payload.job_description_text
        )

        # Step 2: Skill Extraction & Diffing
        diff_result = skill_extractor.diff_skills(
            payload.resume_text,
            payload.job_description_text
        )

        matched_skills = diff_result["matched_skills"]
        missing_skills = diff_result["missing_skills"]

        # Step 3: Actionable Suggestions
        suggestions = skill_extractor.generate_suggestions(
            missing_skills,
            payload.job_description_text
        )

        # Step 4: Interview Question Probing
        interview_questions = interview_generator.generate_questions(
            missing_skills,
            max_questions=4
        )

        duration_ms = int((time.time() - t_start) * 1000)

        return AnalyzeResponse(
            match_score=match_score,
            cosine_similarity=raw_cosine,
            skill_match_ratio=diff_result["skill_match_ratio"],
            total_jd_skills=diff_result["total_jd_skills"],
            total_matched_skills=diff_result["total_matched"],
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            actionable_suggestions=suggestions,
            interview_questions=interview_questions,
            latency_ms=duration_ms
        )
    except Exception as e:
        logger.error(f"Complete analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline failed: {str(e)}"
        )


# ---------------------------------------------------------------------------
# Direct Execution Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
