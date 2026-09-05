import datetime
import random
import os
import requests
from dotenv import load_dotenv

load_dotenv()


class RiskEngineClient:
    """Mock for Person 1 - Risk & Behavior Engine"""

    def get_risk_score(self, user_id: str, _injected_cause: str = None) -> dict:
        """
        GET /risk/score/{user_id}
        Returns synthetic risk data.
        _injected_cause is only used for simulation purposes to drive ground truth.
        """
        causes = ['usage_decline', 'negative_sentiment',
                  'support_delay', 'onboarding_gap']
        dominant_cause = _injected_cause if _injected_cause else random.choice(
            causes)

        # Base random attributions (small impacts)
        attributions = {
            'usage_decline': random.uniform(0.0, 0.1),
            'negative_sentiment': random.uniform(0.0, 0.1),
            'support_delay': random.uniform(0.0, 0.1),
            'onboarding_gap': random.uniform(0.0, 0.1)
        }

        # Amplify the dominant cause
        if dominant_cause == 'usage_decline':
            attributions['usage_decline'] = random.uniform(0.4, 0.8)
        elif dominant_cause == 'negative_sentiment':
            attributions['negative_sentiment'] = random.uniform(0.4, 0.8)
        elif dominant_cause == 'support_delay':
            attributions['support_delay'] = random.uniform(0.4, 0.8)
        elif dominant_cause == 'onboarding_gap':
            attributions['onboarding_gap'] = random.uniform(0.4, 0.8)

        # Format as requested
        attr_list = [{"feature": k, "impact": round(
            v, 2)} for k, v in attributions.items()]

        # Risk score: somewhat arbitrary but let's make it realistic (0.0 to 1.0)
        risk_score = min(1.0, max(0.0, random.gauss(0.6, 0.15)))

        return {
            "user_id": user_id,
            "risk_score": round(risk_score, 2),
            "attributions": attr_list,
            "model_version": "mock-risk-v1",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }


class KnowledgeAssistantClient:
    """Mock for Person 2 - Knowledge Assistant"""

    def __init__(self):
        self._cache = {}

    def get_knowledge_response(self, user_id: str, issue_text: str) -> dict:
        if issue_text in self._cache:
            # Return cached response with slight random variance on confidence to mimic real behavior
            resp = self._cache[issue_text].copy()
            resp['confidence'] = round(random.uniform(0.7, 0.95), 2)
            return resp

        api_key = os.getenv("GROQ_API_KEY") or os.getenv("PERSON2_API_KEY")
        if not api_key:
            # Fallback to mock if API key is not present
            return {
                "retrieved_docs": ["Mock doc A", "Mock doc B"],
                "grounded_response": f"Mock solution for: {issue_text}",
                "confidence": round(random.uniform(0.4, 0.95), 2),
                "model_version": "mock-rag-v1"
            }

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        system_prompt = "You are a customer support knowledge assistant for PulseIQ. Provide a brief, helpful 1-2 sentence response to the user's issue."

        data = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": issue_text}
            ],
            "max_tokens": 100
        }

        try:
            response = requests.post(
                url, headers=headers, json=data, timeout=5)
            response.raise_for_status()
            llm_text = response.json()["choices"][0]["message"]["content"]

            resp = {
                "retrieved_docs": [],  # Direct LLM query for now
                "grounded_response": llm_text,
                # Simulated RAG confidence
                "confidence": round(random.uniform(0.75, 0.95), 2),
                "model_version": "groq-llama3-8b-live"
            }
            self._cache[issue_text] = resp
            return resp
        except Exception as e:
            print(f"WARNING: Groq API call failed: {e}")
            return {
                "retrieved_docs": [],
                "grounded_response": f"Mock fallback due to API error: {str(e)}",
                "confidence": 0.5,
                "model_version": "mock-fallback"
            }
