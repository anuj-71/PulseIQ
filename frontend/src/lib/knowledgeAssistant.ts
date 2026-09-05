import type { KnowledgeRequest, KnowledgeResponse } from './types';

// ---- P2 - Knowledge Assistant ----
// Real implementation: RAG + fine-tuned LLM (LoRA/QLoRA) grounded in company
// docs. Mock reproduces the published schema:
// POST /knowledge/respond → {retrieved_docs[], grounded_response, confidence, model_version}.

export const KNOWLEDGE_MODEL_VERSION = 'pulse-llm-lora-v0.9.3';



export async function knowledgeRespond(req: KnowledgeRequest): Promise<KnowledgeResponse> {
  try {
    const res = await fetch('http://localhost:8000/rag/knowledge/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: req.customer_id,
        issue_text: req.query
      })
    });
    
    if (!res.ok) {
      throw new Error(`RAG API returned ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Failed to call RAG API:", error);
    // Fallback if server is not reachable
    return {
      retrieved_docs: [],
      grounded_response: "Could not reach the RAG API. Check if the Python backend is running on port 8000.",
      confidence: 0,
      model_version: "unknown"
    };
  }
}
