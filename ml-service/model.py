import os
import logging
import numpy as np
from typing import List, Tuple
from sentence_transformers import SentenceTransformer

logger = logging.getLogger("resumatch-ml.model")

class EmbeddingModelManager:
    """
    Manages loading and inference for Sentence-Transformer models.
    Default model: 'all-MiniLM-L6-v2'
    - Output vector dimension: 384
    - Memory footprint: ~120 MB (ideal for free tiers like Render/Railway)
    - Architecture: 6-layer MiniLM trained on 1B+ sentence pairs
    """
    def __init__(self):
        self.model_name = os.getenv("MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
        self._model: SentenceTransformer = None

    def load_model(self) -> None:
        """Loads model into memory during FastAPI startup lifespan."""
        if self._model is None:
            logger.info(f"Loading Sentence-Transformer model: {self.model_name}...")
            self._model = SentenceTransformer(self.model_name)
            logger.info("Model loaded successfully into memory.")

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            self.load_model()
        return self._model

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Computes 384-dimensional dense vector embeddings for input texts.
        Automatically normalizes vectors to unit length so dot product == cosine similarity.
        """
        if not texts:
            return np.array([])
        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
            convert_to_numpy=True
        )
        return embeddings

    @staticmethod
    def calculate_cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """
        Computes cosine similarity between two 1D or 2D normalized vectors.
        Formula: (A · B) / (||A|| * ||B||)
        Since vectors are unit-normalized, this simplifies to dot product.
        """
        if vec_a.ndim == 1:
            vec_a = vec_a.reshape(1, -1)
        if vec_b.ndim == 1:
            vec_b = vec_b.reshape(1, -1)

        dot_product = np.dot(vec_a, vec_b.T)[0][0]
        # Clip to prevent floating point inaccuracy outside [-1.0, 1.0]
        return float(np.clip(dot_product, -1.0, 1.0))

    def compute_document_similarity(self, resume_text: str, jd_text: str) -> Tuple[float, float]:
        """
        Calculates semantic similarity between Resume and Job Description.
        Returns:
            (raw_cosine_score [-1.0, 1.0], scaled_match_percentage [0.0, 100.0])
        """
        if not resume_text.strip() or not jd_text.strip():
            return 0.0, 0.0

        # Generate dense embeddings
        embeddings = self.embed_texts([resume_text, jd_text])
        resume_vec = embeddings[0]
        jd_vec = embeddings[1]

        raw_cosine = self.calculate_cosine_similarity(resume_vec, jd_vec)

        # Scale cosine similarity to a practical 0-100% scale
        # Unrelated text in all-MiniLM typically scores around 0.10 - 0.25.
        # Strong matches score between 0.65 - 0.88.
        # Linear rescaling: baseline 0.15 maps to 0%, 0.85 maps to 100%.
        baseline = 0.15
        ceiling = 0.85
        normalized = (raw_cosine - baseline) / (ceiling - baseline)
        percentage = float(np.clip(normalized * 100.0, 0.0, 100.0))

        return round(raw_cosine, 4), round(percentage, 2)


# Singleton instance for the application
model_manager = EmbeddingModelManager()
