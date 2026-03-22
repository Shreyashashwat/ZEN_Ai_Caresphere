"""
Redis-backed conversational memory store.
Each session stored as JSON list under key: "chat:{session_id}"
TTL resets on every message — sessions expire after 24h of inactivity.
History capped at MAX_HISTORY to control LLM context size.
"""

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


def append_messages(session_id: str, user_message: str, assistant_message: str) -> None:
    """
    Append a user+assistant pair to session history.
    Trims to MAX_HISTORY and resets TTL.
    """
    try:
        r = _get_client()
        history = get_history(session_id)

        history.append({"role": "user",      "content": user_message})
        history.append({"role": "assistant", "content": assistant_message})

 
        if len(history) > MAX_HISTORY:
            history = history[-MAX_HISTORY:]

        r.set(_key(session_id), json.dumps(history), ex=TTL_SECONDS)

    except Exception as e:
        print(f"[MemoryStore] append_messages error: {e}")


def clear_session(session_id: str) -> None:
    """Delete a session's history from Redis."""
    try:
        _get_client().delete(_key(session_id))
    except Exception as e:
        print(f"[MemoryStore] clear_session error: {e}")


def ping() -> bool:
    """Check if Redis is reachable. Used in health check."""
    try:
        return _get_client().ping()
    except Exception:
        return False