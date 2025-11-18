import argparse
import json
import os
from typing import List, Tuple, Any, cast

import faiss
import numpy as np
import requests
from openai import AzureOpenAI

from config import CONFIG, LLM_SETTINGS, EMBEDDING_SETTINGS


API_BASE = CONFIG["azure"]["openai"]["api_base"].rstrip("/")
API_KEY = os.getenv("AZURE_OPENAI_API_KEY", CONFIG["azure"]["openai"]["api_key"])  
API_VERSION = CONFIG["azure"]["openai"]["api_version"]
CHAT_API_VERSION = LLM_SETTINGS.get("api_version", API_VERSION)

LLM_DEPLOYMENT = LLM_SETTINGS["deployment_name"]
LLM_TEMPERATURE = LLM_SETTINGS.get("temperature", 0.2)
LLM_MAX_TOKENS = LLM_SETTINGS.get("max_tokens", 1024)

EMBED_DEPLOYMENT = EMBEDDING_SETTINGS["deployment_name"]
EMBED_API_VERSION = EMBEDDING_SETTINGS.get("api_version", API_VERSION)

client = AzureOpenAI(
    azure_endpoint=API_BASE,
    api_key=API_KEY,
    api_version=EMBED_API_VERSION,
)


def load_index_and_chunks(index_path: str, chunks_path: str) -> Tuple[faiss.Index, List[str]]:
    if not os.path.exists(index_path) or not os.path.exists(chunks_path):
        raise FileNotFoundError(
            f"Missing index or chunks file. Expected: {index_path} and {chunks_path}."
        )
    index = faiss.read_index(index_path)
    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks: List[str] = json.load(f)
    return index, chunks


def load_metadata(metadata_path: str) -> dict:
    """Load metadata from file."""
    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def list_all_indices(base_dir: str = "indices") -> List[dict]:
    """List all available indices in the base directory."""
    indices = []
    if not os.path.exists(base_dir):
        return indices
    
    for name in os.listdir(base_dir):
        path = os.path.join(base_dir, name)
        if os.path.isdir(path):
            metadata_file = os.path.join(path, "metadata.json")
            
            # Accept indices with metadata.json (even if index files not yet created)
            if os.path.exists(metadata_file):
                metadata = load_metadata(metadata_file)
                indices.append({
                    "name": name,
                    "ntotal": metadata.get("ntotal", 0),
                    "chunk_count": metadata.get("chunk_count", 0),
                    "files": metadata.get("files", []),
                    "created_at": metadata.get("created_at", "unknown")
                })
    
    return sorted(indices, key=lambda x: x["name"])


def embed_texts(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    if not texts:
        return []
    all_vecs: List[List[float]] = []
    for start in range(0, len(texts), batch_size):
        batch = texts[start : start + batch_size]
        resp = client.embeddings.create(model=EMBED_DEPLOYMENT, input=batch)
        all_vecs.extend([d.embedding for d in resp.data])
    return all_vecs


def search_faiss(index: faiss.Index, query: str, k: int) -> Tuple[np.ndarray, np.ndarray]:
    if index.ntotal == 0:
        return np.array([]), np.array([[]], dtype=int)
    q_vec = embed_texts([query])[0]
    q_np = np.ascontiguousarray([q_vec], dtype=np.float32)
    k = max(1, min(k, index.ntotal))
    D, I = cast(Any, index).search(q_np, k)
    return D, I


def build_prompt(query: str, contexts: List[str]) -> list:
    context_text = "\n\n---\n\n".join(contexts)
    system_msg = (
        "You are a concise, helpful assistant. Use the provided context to answer the user. "
        "If the answer is not in the context, say you do not know."
    )
    user_msg = (
        f"Context:\n{context_text}\n\nQuestion: {query}\n\n"
        "Answer using only the context above."
    )
    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]


def generate_answer(query: str, retrieved_chunks: List[str]) -> str:
    context_text = "\n\n---\n\n".join(retrieved_chunks)
    user_content = f"Context:\n{context_text}\n\nQuestion: {query}"

    url = f"{API_BASE}/openai/deployments/{LLM_DEPLOYMENT}/chat/completions?api-version={CHAT_API_VERSION}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "api-key": API_KEY,
    }
    payload = {
        "messages": [
            {
                "role": "user",
                "content": user_content,
            }
        ],
        "max_completion_tokens": LLM_MAX_TOKENS,
        "model": LLM_SETTINGS.get("model", LLM_DEPLOYMENT),
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    if resp.status_code == 404:
        print(
            f"Chat deployment '{LLM_DEPLOYMENT}' not found at {API_BASE}. "
            "Verify the exact deployment name in Azure Portal > OpenAI > Deployments and update config.yaml."
        )
        resp.raise_for_status()
    if resp.status_code >= 400:
        fallback_messages = build_prompt(query, retrieved_chunks)
        fallback_payload = {
            "messages": fallback_messages,
            "max_tokens": LLM_MAX_TOKENS,
            "model": LLM_SETTINGS.get("model", LLM_DEPLOYMENT),
            "temperature": LLM_TEMPERATURE,
        }
        resp = requests.post(url, headers=headers, json=fallback_payload, timeout=60)
        if resp.status_code >= 400:
            try:
                print(f"LLM request failed: {resp.status_code} {resp.text}")
            except Exception:
                pass
            resp.raise_for_status()
    data = resp.json()
    return (data.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()


def main() -> None:
    parser = argparse.ArgumentParser(description="FAISS RAG retriever using Azure OpenAI")
    parser.add_argument("--index", default="index.faiss", help="Path to FAISS index file")
    parser.add_argument("--chunks", default="chunks.json", help="Path to chunks JSON file")
    parser.add_argument("--top-k", type=int, default=3, help="Number of chunks to retrieve")
    parser.add_argument("--query", type=str, default=None, help="Single query to run. If omitted, enters REPL mode.")
    args = parser.parse_args()

    try:
        index, chunks = load_index_and_chunks(args.index, args.chunks)
    except FileNotFoundError as e:
        print(str(e))
        print("Ingest a document first (see md_rag.py) to create the index and chunks files.")
        return

    def run_query(q: str):
        _, I = search_faiss(index, q, args.top_k)
        if I.size == 0:
            print("No results in index.")
            return
        retrieved = [chunks[i] for i in I[0] if i >= 0 and i < len(chunks)]
        answer = generate_answer(q, retrieved)
        print("\nAnswer:\n" + answer.strip())

    if args.query:
        run_query(args.query)
    else:
        print("Entering interactive mode. Type 'exit' to quit.")
        while True:
            try:
                q = input("Query> ").strip()
            except (EOFError, KeyboardInterrupt):
                print()
                break
            if not q:
                continue
            if q.lower() in {"exit", "quit"}:
                break
            run_query(q)


if __name__ == "__main__":
    main()
