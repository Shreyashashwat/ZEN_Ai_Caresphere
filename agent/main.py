from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.agent_executer import run_agent
from agent.utils.memory_store import append_messages, clear_session, get_history

load_dotenv()


app = FastAPI(
    title="CareSphere Agent Service",
    description="LangChain tool-calling agent for CareSphere",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["POST", "GET", "DELETE"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    userId: str
    message: str
    token: str
    sessionId: str
    userContext: Optional[dict] = None
    chat_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    sessionId: str


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.userId or not req.message or not req.token:
        raise HTTPException(
            status_code=400,
            detail="userId, message, and token are required",
        )

    if not req.sessionId:
        raise HTTPException(status_code=400, detail="sessionId is required")

    stored_history = get_history(req.sessionId)
    request_history = [{"role": m.role, "content": m.content} for m in req.chat_history]
    history = stored_history if stored_history else request_history

    reply = run_agent(
        token=req.token,
        user_id=req.userId,
        message=req.message,
        chat_history=history,
        user_context=req.userContext or {},
    )

    append_messages(req.sessionId, req.message, reply)

    return ChatResponse(reply=reply, sessionId=req.sessionId)


@app.delete("/chat/{session_id}")
async def clear_chat_session(session_id: str):
    clear_session(session_id)
    return {"status": "cleared", "sessionId": session_id}


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "caresphere-agent", "port": 8002}