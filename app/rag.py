import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv

from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import LLMChain

from .prompts import PERSIAN_SYSTEM_TUTOR, QA_PROMPT, SOLVE_PROMPT, MCQ_GEN_PROMPT, QUIZ_FLOW_PROMPT

load_dotenv()

CHROMA_DIR = os.getenv("CHROMA_DIR", ".chroma/konkur")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

# ---- Embeddings ----

def build_embeddings():
    if LLM_PROVIDER == "openai":
        # You can still use sentence-transformers for cheaper local embeddings
        return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    # Default to HF embeddings
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

# ---- LLM ----

def build_llm():
    if LLM_PROVIDER == "openai":
        return ChatOpenAI(model=LLM_MODEL, temperature=0.2)
    # Fallback: if someone plugs another provider later
    return ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

# ---- Vector Store ----

def get_or_create_vs(embeddings=None):
    embeddings = embeddings or build_embeddings()
    os.makedirs(CHROMA_DIR, exist_ok=True)
    return Chroma(collection_name="konkur", embedding_function=embeddings, persist_directory=CHROMA_DIR)

# ---- Chunking ----
SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=900,
    chunk_overlap=150,
    add_start_index=True,
    separators=["\n\n", "\n", " ", ""]
)

# ---- Ingestion helpers ----

def _item_to_doc(item: Dict[str, Any]) -> Document:
    text = (
        f"موضوع: {item['subject']}\n"
        f"تاپیک: {item['topic']}\n"
        f"منبع: {item['source']}\n"
        f"سختی: {item['difficulty']}\n"
        f"سؤال: {item['question']}\n"
        f"گزینه‌ها: { ' | '.join(item.get('options', [])) }\n"
        f"کلید: {item.get('correct_option_index', -1)}\n"
        f"توضیح: {item.get('explanation','')}\n"
    )
    return Document(
        page_content=text,
        metadata={
            "subject": item["subject"],
            "topic": item["topic"],
            "source": item["source"],
            "difficulty": item["difficulty"],
            "type": "qa"
        }
    )

def ingest_jsonl(path: str) -> int:
    vs = get_or_create_vs()
    with open(path, 'r', encoding='utf-8') as f:
        lines = [json.loads(l) for l in f if l.strip()]
    docs = [_item_to_doc(x) for x in lines]
    chunks = SPLITTER.split_documents(docs)
    vs.add_documents(chunks)
    vs.persist()
    return len(chunks)

def ingest_list(items: List[Dict[str, Any]]) -> int:
    vs = get_or_create_vs()
    docs = [_item_to_doc(x) for x in items]
    chunks = SPLITTER.split_documents(docs)
    vs.add_documents(chunks)
    vs.persist()
    return len(chunks)

def ingest_pdf(path: str, meta: Dict[str, Any] = None) -> int:
    meta = meta or {}
    vs = get_or_create_vs()
    loader = PyPDFLoader(path)
    pages = loader.load()
    # attach metadata
    for p in pages:
        p.metadata.update(meta)
    chunks = SPLITTER.split_documents(pages)
    vs.add_documents(chunks)
    vs.persist()
    return len(chunks)

# ---- Retrieval ----

def retrieve(query: str, k: int = 6, where: Dict[str, Any] = None) -> List[Document]:
    vs = get_or_create_vs()
    retriever = vs.as_retriever(search_kwargs={"k": k, "fetch_k": max(8, k*2), "lambda_mult": 0.5})
    # For basic filtering we can do it in post
    docs = retriever.get_relevant_documents(query)
    if where:
        def ok(m):
            return all(str(m.get(key, "")) == str(val) for key, val in where.items())
        docs = [d for d in docs if ok(d.metadata)]
    return docs

# ---- Chains ----
LLM = build_llm()

qa_chain = LLMChain(llm=LLM, prompt=QA_PROMPT)
solve_chain = LLMChain(llm=LLM, prompt=SOLVE_PROMPT)
mcq_gen_chain = LLMChain(llm=LLM, prompt=MCQ_GEN_PROMPT)
quiz_flow_chain = LLMChain(llm=LLM, prompt=QUIZ_FLOW_PROMPT)

# Utility to join contexts

def join_context(docs: List[Document]) -> str:
    out = []
    for i, d in enumerate(docs, 1):
        meta = d.metadata
        head = f"[{i}] {meta.get('subject','-')} / {meta.get('topic','-')} / {meta.get('source','-')} / {meta.get('difficulty','-')}"
        out.append(head + "\n" + d.page_content)
    return "\n\n".join(out)

# Public functions for API

def rag_answer(question: str, k: int = 6) -> str:
    docs = retrieve(question, k=k)
    context = join_context(docs) if docs else "(هیچ متن مرتبطی پیدا نشد)"
    return qa_chain.run(system=PERSIAN_SYSTEM_TUTOR, context=context, question=question)


def rag_solve(question: str, k: int = 8) -> str:
    docs = retrieve(question, k=k)
    context = join_context(docs) if docs else "(هیچ متن مرتبطی پیدا نشد)"
    return solve_chain.run(system=PERSIAN_SYSTEM_TUTOR, context=context, question=question)


def rag_generate_mcq(topic: str, difficulty: str = "متوسط", k: int = 12) -> List[Dict[str, Any]]:
    # Use topic as query to collect context
    docs = retrieve(topic, k=k, where={"topic": topic}) or retrieve(topic, k=k)
    context = join_context(docs) if docs else f"(متن مستقیم برای {topic} موجود نیست)"
    raw = mcq_gen_chain.run(system=PERSIAN_SYSTEM_TUTOR, context=context, topic=topic, difficulty=difficulty)
    try:
        return json.loads(raw)
    except Exception:
        # Try to extract JSON if the model added extra text
        start = raw.find('[')
        end = raw.rfind(']')
        if start != -1 and end != -1 and end > start:
            return json.loads(raw[start:end+1])
        raise ValueError("خروجی تولید تست JSON معتبر نیست:\n" + raw)


def quiz_next_step(topic: str | None, k: int = 6) -> str:
    q = topic or "زیست شناسی"
    docs = retrieve(q, k=k)
    context = join_context(docs) if docs else "(context خالی)"
    return quiz_flow_chain.run(system=PERSIAN_SYSTEM_TUTOR, context=context)
