# Dependencies:
#   pip install markitdown requests numpy faiss-cpu docling pandas
#   (use faiss-gpu instead of faiss-cpu if you have CUDA)

import numpy as np
import faiss
import requests
import os
from markitdown import MarkItDown
import json
from typing import Any, cast, List, Tuple, Dict, Optional
from datetime import datetime

from openai import AzureOpenAI
# Ensure you have a config.py file with your Azure OpenAI credentials
# from config import CONFIG, LLM_SETTINGS, EMBEDDING_SETTINGS
from docling.document_converter import DocumentConverter
from config import CONFIG, LLM_SETTINGS, EMBEDDING_SETTINGS

# Placeholder for CONFIG, LLM_SETTINGS, EMBEDDING_SETTINGS if config.py is not available
# In a real scenario, these would be loaded from a configuration file.
# Azure OpenAI configuration (env first, then config)
API_BASE = CONFIG["azure"]["openai"]["api_base"].rstrip("/")
API_KEY = os.getenv("AZURE_OPENAI_API_KEY", CONFIG["azure"]["openai"]["api_key"])  
API_VERSION = CONFIG["azure"]["openai"]["api_version"]

# Initialize Azure OpenAI client (LLM for MarkItDown)
client = AzureOpenAI(  
    api_key=API_KEY,  
    api_version=API_VERSION,  
    azure_endpoint=API_BASE  
)  
  
# Build Azure Embedding REST endpoint (keep model separation)
EMBED_DEPLOYMENT = EMBEDDING_SETTINGS["deployment_name"]
AZURE_EMBEDDING_ENDPOINT = f"{API_BASE}/openai/deployments/{EMBED_DEPLOYMENT}/embeddings?api-version={API_VERSION}"  


def pdf_to_markdown_with_markitdown(pdf_path: str) -> str:
    """Convert a PDF to Markdown using markitdown."""
    md = MarkItDown(llm_client=client, llm_model="gpt-4o", verbose=False)
    result = md.convert(pdf_path)
    content = getattr(result, "markdown", None)
    if content is None and isinstance(result, dict):
        content = result.get("content")
    if not content:
        raise ValueError("No content extracted from PDF.")
    return content


def pdf_to_markdown_with_docling(pdf_path: str) -> str:
    """
    Convert a PDF to Markdown using docling, preserving structural information.
    Docling is particularly good at recognizing and formatting tables.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"The file {pdf_path} was not found.")

    print("Converting PDF to Markdown with docling...")
    converter = DocumentConverter()
    result = converter.convert(pdf_path)
    markdown_content = result.document.export_to_markdown()
    if not markdown_content:
        raise ValueError("No content extracted from PDF using docling.")
    print("PDF to Markdown conversion with docling complete.")
    return markdown_content


def chunk_text(text: str, chunk_size: int = 500) -> list[str]:
    """Simple word-based chunking."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size]).strip()
        if chunk:
            chunks.append(chunk)
    return chunks


def get_azure_embedding(texts: list[str], batch_size: int = 16, timeout: int = 30) -> list[list[float]]:
    """Get embeddings from Azure OpenAI for a list of texts."""
    if not texts:
        return []

    headers = {
        "Content-Type": "application/json",
        "api-key": API_KEY,
    }

    all_embeddings: list[list[float]] = []

    for start in range(0, len(texts), batch_size):
        batch = texts[start:start + batch_size]
        data = {"input": batch}

        resp = requests.post(AZURE_EMBEDDING_ENDPOINT, headers=headers, json=data, timeout=timeout)
        resp.raise_for_status()
        payload = resp.json()
        data_items = payload.get("data", [])
        data_items_sorted = sorted(data_items, key=lambda x: x.get("index", 0))
        batch_embeddings = [item["embedding"] for item in data_items_sorted]
        if len(batch_embeddings) != len(batch):
            raise RuntimeError("Mismatch between number of inputs and embeddings returned.")
        all_embeddings.extend(batch_embeddings)

    return all_embeddings


def build_faiss_index(embeddings: list[list[float]]) -> faiss.Index:
    """Build a FAISS L2 index from a list of embedding vectors."""
    if not embeddings:
        raise ValueError("No embeddings provided to build the FAISS index.")
    emb_np = np.ascontiguousarray(embeddings, dtype=np.float32)
    dim = emb_np.shape[1]
    index = faiss.IndexFlatL2(dim)
    cast(Any, index).add(emb_np)
    return index


def ingest_pdf_to_faiss(pdf_path: str, chunk_size: int = 500) -> tuple[faiss.Index, list[str], list[list[float]]]:
    """End-to-end ingestion: PDF -> Markdown -> Chunks -> Embeddings -> FAISS index"""
    # Using the new docling-based conversion
    markdown_text = pdf_to_markdown_with_docling(pdf_path)
    chunks = chunk_text(markdown_text, chunk_size=chunk_size)
    if not chunks:
        raise ValueError("No chunks produced from the document.")
    embeddings = get_azure_embedding(chunks)
    index = build_faiss_index(embeddings)
    return index, chunks, embeddings


def persist_index_and_chunks(index: faiss.Index, chunks: list[str], index_path: str = "index.faiss", chunks_path: str = "chunks.json", metadata_path: Optional[str] = None, files: Optional[List[str]] = None) -> None:
    """Persist the FAISS index, chunks, and metadata to disk."""
    os.makedirs(os.path.dirname(index_path) or ".", exist_ok=True)
    os.makedirs(os.path.dirname(chunks_path) or ".", exist_ok=True)
    faiss.write_index(index, index_path)
    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    if metadata_path:
        os.makedirs(os.path.dirname(metadata_path) or ".", exist_ok=True)
        metadata = {
            "ntotal": index.ntotal,
            "chunk_count": len(chunks),
            "created_at": datetime.now().isoformat(),
            "files": files or []
        }
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)


def load_index_and_chunks(index_path: str = "index.faiss", chunks_path: str = "chunks.json") -> tuple[faiss.Index, list[str]]:
    """Load a FAISS index and its corresponding chunks from disk."""
    index = faiss.read_index(index_path)
    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks: list[str] = json.load(f)
    return index, chunks


def persist_metadata(metadata_path: str, metadata: Dict[str, Any]) -> None:
    """Persist simple metadata alongside the index."""
    os.makedirs(os.path.dirname(metadata_path) or ".", exist_ok=True)
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)


def load_metadata(metadata_path: str) -> Dict[str, Any]:
    """Load metadata for an index."""
    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def list_indices_in_dir(index_dir: str = "indices") -> List[Dict[str, Any]]:
    """List all available indices in the indices directory."""
    indices = []
    if not os.path.exists(index_dir):
        return indices

    for item in os.listdir(index_dir):
        item_path = os.path.join(index_dir, item)
        if os.path.isdir(item_path):
            index_file = os.path.join(item_path, "index.faiss")
            chunks_file = os.path.join(item_path, "chunks.json")
            metadata_file = os.path.join(item_path, "metadata.json")

            if os.path.exists(index_file) and os.path.exists(chunks_file):
                try:
                    metadata = load_metadata(metadata_file)
                    files_list = metadata.get("files", [])
                    indices.append({
                        "name": item,
                        "ntotal": metadata.get("ntotal", 0),
                        "chunk_count": metadata.get("chunk_count", 0),
                        "files": files_list,
                        "created_at": metadata.get("created_at", "unknown")
                    })
                except Exception:
                    pass

    return sorted(indices, key=lambda x: x["name"])


def query_retriever(query: str, index: faiss.Index, chunks: list[str], k: int = 3) -> list[str]:
    """Embed the query, search the FAISS index, and return top-k chunk texts."""
    if index.ntotal == 0:
        return []
    query_embedding = get_azure_embedding([query])[0]
    k = max(1, min(k, index.ntotal))
    query_np = np.ascontiguousarray([query_embedding], dtype=np.float32)
    D, I = cast(Any, index).search(query_np, k)
    return [chunks[i] for i in I[0]]


if __name__ == "__main__":
    # Make sure to replace this with the actual path to your PDF file
    pdf_path = "/home/athshyam/shyam/rag_project/backend/2024-UPS-GRI-Report.pdf"
    index_path = "index_docling.faiss"
    chunks_path = "chunks_docling.json"

    # We will re-index the PDF using docling if the index doesn't already exist.
    if os.path.exists(index_path) and os.path.exists(chunks_path):
        print("Loading existing index and chunks from disk...")
        index, chunks = load_index_and_chunks(index_path=index_path, chunks_path=chunks_path)
        print("Loading complete.")
    else:
        print("No existing index found. Ingesting PDF with docling...")
        index, chunks, _embeddings = ingest_pdf_to_faiss(pdf_path, chunk_size=500)
        persist_index_and_chunks(index, chunks, index_path=index_path, chunks_path=chunks_path)
        print("Ingestion and persistence complete.")

    sample_queries = [
        "What is the main topic of the document?",
        "Summarize the introduction section.",
        "List the key findings.",
        "Show me a table related to financial performance." # A query that might benefit from better table preservation
    ]

    for query in sample_queries:
        print(f"\nQuery: {query}")
        results = query_retriever(query, index, chunks, k=3)
        for i, res in enumerate(results, start=1):
            preview = res[:300].replace("\n", " ")  # Increased preview length
            print(f"Result {i}: {preview}...")