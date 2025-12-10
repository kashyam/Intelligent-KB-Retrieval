import os
import json
import logging
from typing import Tuple, List, Dict, Any
import faiss
import numpy as np
from faiss_retriever import (
    load_index_and_chunks,
    load_metadata,
    search_faiss,
)
from config import CONFIG

logger = logging.getLogger("voice-rag-engine")
logging.basicConfig(level=logging.INFO)

INDICES_DIR = "indices"

class VoiceRAGEngine:
    def __init__(self, kb_id: str):
        self.kb_id = kb_id
        self.index = None
        self.chunks = []
        self.kb_path = os.path.join(INDICES_DIR, kb_id)
        self._initialize_index()

    def _initialize_index(self):
        """Loads the FAISS index and chunks for the specified KB."""
        if not os.path.exists(self.kb_path):
            logger.error(f"KB not found: {self.kb_id}")
            return

        index_file = os.path.join(self.kb_path, "index.faiss")
        chunks_file = os.path.join(self.kb_path, "chunks.json")

        if not os.path.exists(index_file) or not os.path.exists(chunks_file):
            logger.error(f"KB index empty or missing files: {self.kb_id}")
            return

        try:
            self.index, self.chunks = load_index_and_chunks(index_file, chunks_file)
            logger.info(f"Loaded KB: {self.kb_id} with {len(self.chunks)} chunks.")
        except Exception as e:
            logger.error(f"Failed to load KB {self.kb_id}: {e}")

    async def search(self, query: str, top_k: int = 3) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Searches the KB and returns a context string for the LLM and 
        structured citations for the UI.
        """
        if not self.index or not self.chunks:
            return "Knowledge base unavailable or empty.", []

        # Use the existing synchronous search_faiss function
        # In a high-load async app, this might block the event loop slightly,
        # but for a single voice session it's acceptable. 
        # Ideally run in an executor if latency becomes an issue.
        D, I = search_faiss(self.index, query, top_k)

        contexts = []
        citations = []
        
        # Load metadata for file mapping
        metadata = load_metadata(os.path.join(self.kb_path, "metadata.json"))
        files = metadata.get("files", [])
        file_name = files[0] if files else self.kb_id

        if I.size and len(I[0]):
            for idx in I[0]:
                idx_int = int(idx)
                if idx_int < 0 or idx_int >= len(self.chunks):
                    continue
                
                chunk_text = self.chunks[idx_int]
                contexts.append(chunk_text)
                
                # Prepare citation for UI
                citations.append({
                    "file": file_name,
                    "chunk_id": idx_int,
                    "content": chunk_text,
                    "preview": chunk_text[:100].replace("\n", " ") + "..."
                })

        if not contexts:
            return "No relevant info found in knowledge base.", []

        # Join contexts for the LLM to read
        joined_context = "\n\n---\n\n".join(contexts)
        return joined_context, citations