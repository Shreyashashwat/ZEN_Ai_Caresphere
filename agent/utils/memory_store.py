import json
import os
import redis
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

REDIS_URL   = os.getenv("REDIS_URL", "redis://localhost:6379")
TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", 86400))  
MAX_HISTORY = int(os.getenv("MAX_HISTORY_MESSAGES", 20))    

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = redis.from_url(REDIS_URL, decode_responses=True)
    return _client


def _key(session_id: str) -> str:
    return f"chat:{session_id}"


def get_history(session_id: str) -> list:
    """
    Retrieve conversation history for a session.
    Returns list of {"role": "user"|"assistant", "content": "..."} dicts.
    Returns empty list if session doesn't exist.
    """
    try:
        raw = _get_client().get(_key(session_id))
        return json.loads(raw) if raw else []
    except Exception as e:
        print(f"[MemoryStore] get_history error: {e}")
        return []
    


    