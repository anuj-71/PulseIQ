import os
from typing import List, Dict, Any
from dotenv import load_dotenv
from qdrant_client import QdrantClient

from knowledge_assistant.ingestion.embedder import DocumentEmbedder

# Global instances for lazy loading so we don't reload the model on every query
_embedder = None
_qdrant_client = None


def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = DocumentEmbedder()
    return _embedder


def get_qdrant_client():
    global _qdrant_client
    if _qdrant_client is None:
        load_dotenv()
        host = os.getenv("QDRANT_HOST", "localhost")
        port = int(os.getenv("QDRANT_PORT", 6333))
        _qdrant_client = QdrantClient(host=host, port=port)
    return _qdrant_client


def _fallback_local_retrieve(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    from pathlib import Path
    raw_docs_dir = Path(__file__).resolve().parent.parent.parent.parent / "data" / "raw_docs"
    if not raw_docs_dir.exists():
        return []

    query_words = set(query.lower().split())
    doc_scores = []

    for file_path in raw_docs_dir.glob("*.md"):
        content = file_path.read_text(encoding="utf-8", errors="ignore")
        lines = content.splitlines()
        title = lines[0].replace("#", "").strip() if lines else file_path.stem
        words = set(content.lower().split())
        overlap = len(query_words.intersection(words))
        score = min(0.95, 0.4 + (overlap / max(1, len(query_words))) * 0.5) if overlap > 0 else 0.2

        doc_scores.append({
            "doc_id": file_path.stem,
            "title": title,
            "content": content[:1000],
            "doc_type": "Documentation",
            "source_version": "1.0",
            "score": round(score, 2)
        })

    doc_scores.sort(key=lambda x: x["score"], reverse=True)
    return doc_scores[:top_k]


def retrieve(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Embeds the query and retrieves the top_k most relevant chunks from Qdrant.
    Falls back to local document search if Qdrant is unavailable.
    """
    load_dotenv()
    collection_name = os.getenv("QDRANT_COLLECTION_NAME", "pulseiq_knowledge")

    try:
        embedder = get_embedder()
        client = get_qdrant_client()

        query_vector = embedder.embed_chunks([query])[0]

        search_response = client.query_points(
            collection_name=collection_name,
            query=query_vector,
            limit=top_k
        )

        results = []
        for scored_point in search_response.points:
            payload = scored_point.payload
            normalized_score = max(0.0, (scored_point.score + 1.0) / 2.0)

            results.append({
                "doc_id": payload.get("doc_id", "Unknown"),
                "title": payload.get("title", "Untitled"),
                "content": payload.get("content", ""),
                "doc_type": payload.get("doc_type", "Unknown"),
                "source_version": payload.get("source_version", "Unknown"),
                "score": normalized_score
            })

        if results:
            return results
    except Exception as e:
        print(f"Notice: Qdrant connection unavailable ({e}). Using local markdown documentation fallback.")

    return _fallback_local_retrieve(query, top_k)
