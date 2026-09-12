from abc import ABC, abstractmethod
from typing import List
from app.utils.config import settings
from app.utils.logger import logger


class EmbeddingProvider(ABC):
    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        pass

    @abstractmethod
    def embed_query(self, text: str) -> List[float]:
        pass


class HuggingFaceEmbeddingProvider(EmbeddingProvider):
    _instance = None
    _model = None

    def __init__(self, model_name: str = None, device: str = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self.device = device or settings.EMBEDDING_DEVICE

    def _get_model(self):
        if HuggingFaceEmbeddingProvider._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading Hugging Face embedding model: {self.model_name} on {self.device}")
                HuggingFaceEmbeddingProvider._model = SentenceTransformer(
                    self.model_name, device=self.device
                )
            except Exception as e:
                logger.error(f"Failed to load Hugging Face model {self.model_name}: {e}")
                # Fallback to a simple deterministic embedding mock if torch/sentence_transformers fail or model download fails
                HuggingFaceEmbeddingProvider._model = DummyEmbeddingModel(settings.EMBEDDING_DIMENSION)
        return HuggingFaceEmbeddingProvider._model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        model = self._get_model()
        if hasattr(model, "encode"):
            embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            return embeddings.tolist()
        return [model.embed(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        if not text:
            return [0.0] * settings.EMBEDDING_DIMENSION
        model = self._get_model()
        if hasattr(model, "encode"):
            embedding = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
            return embedding.tolist()
        return model.embed(text)


class DummyEmbeddingModel:
    """Fallback dummy embedding model for offline/test environments."""
    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    def embed(self, text: str) -> List[float]:
        import hashlib
        # Generate deterministic vector from hash
        hash_bytes = hashlib.sha256(text.encode()).digest()
        vec = []
        for i in range(self.dimension):
            val = (hash_bytes[i % len(hash_bytes)] / 255.0) * 2.0 - 1.0
            vec.append(round(val, 4))
        # normalize
        norm = sum(x*x for x in vec) ** 0.5 or 1.0
        return [x / norm for x in vec]


def get_embedding_provider() -> EmbeddingProvider:
    return HuggingFaceEmbeddingProvider()
