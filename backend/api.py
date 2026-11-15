"""Thin FastAPI adapter for the existing notebook RAG pipeline.

This module does not implement retrieval or generation. It calls
rag_engine.process_soc_query(), which is extracted from the original notebook.
"""
import os
import re
import time
import threading
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import rag_engine

# Preserve the notebook's single-request GPU execution behaviour.
RAG_LOCK = threading.Lock()

app = FastAPI(
    title="CTI RAG Assistant API",
    version="1.0.0",
    description="HTTP adapter for the original Google Colab CTI RAG pipeline."
)

origins = [x.strip() for x in os.getenv("CTI_ALLOWED_ORIGINS", "*").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

class ResearchRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    include_live_api: bool = True

class TriageRequest(BaseModel):
    email_text: str = Field(..., min_length=1, max_length=12000)
    include_live_api: bool = False

def _response(answer: str, sources_markdown: str, started: float):
    timing = re.search(
        r"Processing:\s*retrieval\s+([0-9.]+)s\s*·\s*Gemma generation\s+([0-9.]+)s\s*·\s*total\s+([0-9.]+)s",
        answer or "", re.I
    )
    citations = re.findall(r"\[(?:S|C|V|R|L|IOC)\d+\]", (answer or "") + "\n" + (sources_markdown or ""))
    return {
        "answer": answer,
        "sources_markdown": sources_markdown,
        "sources": [],
        "live_status": "Processed by the original notebook RAG pipeline.",
        "meta": {
            "retrieval_seconds": float(timing.group(1)) if timing else None,
            "generation_seconds": float(timing.group(2)) if timing else None,
            "total_seconds": float(timing.group(3)) if timing else round(time.perf_counter() - started, 2),
            "evidence_count": len(set(citations))
        }
    }

@app.get("/health")
def health():
    return {"status": "ok", "engine": "notebook-extracted", "model": getattr(rag_engine, "model_id", "google/gemma-2-2b-it")}

@app.post("/api/cti/research")
def cti_research(request: ResearchRequest):
    started = time.perf_counter()
    try:
        with RAG_LOCK:
            answer, sources = rag_engine.process_soc_query(
                request.question,
                "CTI research",
                use_live_api=request.include_live_api
            )
        return _response(answer, sources, started)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {str(exc)[:500]}")

@app.post("/api/cti/triage")
def cti_triage(request: TriageRequest):
    started = time.perf_counter()
    try:
        with RAG_LOCK:
            answer, sources = rag_engine.process_soc_query(
                request.email_text,
                "Email triage",
                use_live_api=request.include_live_api
            )
        return _response(answer, sources, started)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {str(exc)[:500]}")
