import os
from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from .schemas import QARequest, SolveRequest, MCQGenRequest, IngestBulk, QuizStepRequest
from .rag import ingest_list, ingest_pdf, rag_answer, rag_solve, rag_generate_mcq, quiz_next_step

app = FastAPI(title="Konkur RAG Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"service": "konkur-rag", "status": "ok"}

# ---- Ingestion ----
@app.post("/ingest/items")
def ingest_items(payload: IngestBulk):
    n = ingest_list([x.model_dump() for x in payload.items])
    return {"indexed_chunks": n}

@app.post("/ingest/pdf")
def ingest_pdf_file(file: UploadFile = File(...), subject: str = "", topic: str = "", source: str = "جزوه/کتاب"):
    path = os.path.join("/tmp", file.filename)
    with open(path, "wb") as f:
        f.write(file.file.read())
    n = ingest_pdf(path, meta={"subject": subject, "topic": topic, "source": source, "difficulty": "-", "type": "pdf"})
    return {"indexed_chunks": n}

# ---- RAG endpoints ----
@app.post("/ask")
def ask(req: QARequest):
    answer = rag_answer(req.question, k=req.k)
    return {"answer": answer}

@app.post("/solve")
def solve(req: SolveRequest):
    answer = rag_solve(req.question, k=req.k)
    return {"solution": answer}

@app.post("/generate-mcq")
def gen(req: MCQGenRequest):
    items = rag_generate_mcq(req.topic, difficulty=req.difficulty, k=req.k)
    return {"items": items}

@app.post("/quiz/next")
def quiz_step(req: QuizStepRequest):
    txt = quiz_next_step(req.topic, k=req.k)
    return {"question": txt}
