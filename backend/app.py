from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
import time
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn

from faiss_retriever import (
    list_all_indices,
    load_index_and_chunks,
    load_metadata,
    search_faiss,
    generate_answer,
)
import md_rag

from starlette.requests import Request
from starlette.responses import Response

DATA_DIR = "data"
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
INDICES_DIR = "indices"
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(INDICES_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    yield
    print("Shutting down...")

app = FastAPI(title="Knowledge Assistant API", lifespan=lifespan)

class PreflightCorsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Ensure proper response to browser CORS preflight (OPTIONS) including Private Network Access
        if request.method == "OPTIONS":
            origin = request.headers.get("Origin", "*")
            req_method = request.headers.get("Access-Control-Request-Method", "*")
            req_headers = request.headers.get("Access-Control-Request-Headers", "*")

            headers = {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": req_method if req_method else "*",
                "Access-Control-Allow-Headers": req_headers if req_headers else "*",
                "Access-Control-Max-Age": "600",
                # Required for Private Network Access preflight
                "Access-Control-Allow-Private-Network": "true",
            }
            return Response(status_code=204, headers=headers)

        response = await call_next(request)
        # Also include on non-preflight responses to be permissive
        response.headers.setdefault("Access-Control-Allow-Private-Network", "true")
        return response
# --- END: Middleware to handle CORS preflight + Private Network Access ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("CORS configured to allow all origins (wildcard '*') and all methods/headers")

# Add preflight/Private Network middleware last so it's the outermost and can handle OPTIONS before CORS
app.add_middleware(PreflightCorsMiddleware)


class CreateKBRequest(BaseModel):
    name: str


class ChatRequest(BaseModel):
    message: str
    top_k: Optional[int] = 3


class DeleteKBResponse(BaseModel):
    message: str


@app.get("/api/kbs")
def get_kbs():
    """List all knowledge bases and basic metadata."""
    indices = list_all_indices(INDICES_DIR)
    return {"kbs": indices}


@app.get("/api/kbs/{kb_id}")
def get_kb(kb_id: str):
    """Return metadata for a single KB."""
    path = os.path.join(INDICES_DIR, kb_id)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="KB not found")
    metadata_path = os.path.join(path, "metadata.json")
    metadata = load_metadata(metadata_path)
    return {"kb": {"name": kb_id, **metadata}}


@app.post("/api/kbs", status_code=201)
def create_kb(req: CreateKBRequest):
    """Create a new KB (directory + metadata)."""
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    existing = [k["name"] for k in list_all_indices(INDICES_DIR)]
    if name in existing:
        raise HTTPException(status_code=400, detail="KB already exists")
    kb_path = os.path.join(INDICES_DIR, name)
    os.makedirs(kb_path, exist_ok=True)
    metadata_path = os.path.join(kb_path, "metadata.json")
    metadata = {"ntotal": 0, "chunk_count": 0, "created_at": time.strftime("%Y-%m-%dT%H:%M:%S"), "files": []}
    md_rag.persist_metadata(metadata_path, metadata)
    return {"message": f"KB '{name}' created", "kb": {"name": name, **metadata}}


@app.post("/api/kbs/{kb_id}/upload")
def upload_file(kb_id: str, file: UploadFile = File(...)):
    """Upload a PDF to a KB and ingest it into a FAISS index."""
    filename = file.filename or f"upload_{int(time.time())}.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    kb_path = os.path.join(INDICES_DIR, kb_id)
    if not os.path.exists(kb_path):
        raise HTTPException(status_code=404, detail="KB not found")

    dest_path = os.path.join(UPLOADS_DIR, filename)
    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Ingest the file
    try:
        index, chunks, _ = md_rag.ingest_pdf_to_faiss(dest_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    index_file = os.path.join(kb_path, "index.faiss")
    chunks_file = os.path.join(kb_path, "chunks.json")
    metadata_file = os.path.join(kb_path, "metadata.json")
    # Load existing metadata and append file
    metadata = load_metadata(metadata_file)
    files = metadata.get("files", [])
    files.append(filename)

    # update chunk to file mapping if needed (optional)
    old_chunk_count = metadata.get("chunk_count", 0)
    for i, _ in enumerate(chunks):
        # store mapping in metadata if desired
        pass

    # Persist index and chunks
    md_rag.persist_index_and_chunks(index, chunks, index_path=index_file, chunks_path=chunks_file, metadata_path=metadata_file, files=files)

    # Reload metadata to return updated state
    new_meta = load_metadata(metadata_file)
    return {"message": f"File '{file.filename}' ingested into KB '{kb_id}'", "kb": {"name": kb_id, **new_meta}}


@app.post("/api/kbs/{kb_id}/chat")
def kb_chat(kb_id: str, payload: ChatRequest):
    """Query a KB and return an answer with citations."""
    kb_path = os.path.join(INDICES_DIR, kb_id)
    if not os.path.exists(kb_path):
        raise HTTPException(status_code=404, detail="KB not found")
    index_file = os.path.join(kb_path, "index.faiss")
    chunks_file = os.path.join(kb_path, "chunks.json")
    if not os.path.exists(index_file) or not os.path.exists(chunks_file):
        raise HTTPException(status_code=404, detail="KB index is empty")

    index, chunks = load_index_and_chunks(index_file, chunks_file)
    top_k = int(payload.top_k or 3)
    D, I = search_faiss(index, payload.message, top_k)
    retrieved = []
    citations = []
    chunk_indices = []
    if I.size and len(I[0]):
        for idx in I[0]:
            # Cast numpy scalar (e.g., numpy.int64) to native Python int
            idx_int = int(idx)
            if idx_int < 0 or idx_int >= len(chunks):
                continue
            retrieved.append(chunks[idx_int])
            chunk_indices.append(idx_int)
            preview = chunks[idx_int][:80].replace("\n", " ")
            content = chunks[idx_int].replace("\n", " ")
            # try to get mapping from metadata if present
            metadata = load_metadata(os.path.join(kb_path, "metadata.json"))
            files = metadata.get("files", [])
            file_name = files[0] if files else kb_id
            citations.append({"file": file_name, "chunk": idx_int, "preview": preview, "content": content})

    if retrieved:
        start = time.time()
        answer = generate_answer(payload.message, retrieved)
        response_time = round(time.time() - start, 2)
    else:
        answer = "No relevant information found in the index."
        response_time = 0.0

    return {"answer": answer, "citations": citations, "response_time": response_time}


@app.delete("/api/kbs/{kb_id}", response_model=DeleteKBResponse)
def delete_kb(kb_id: str):
    """Delete an existing KB (its directory and all stored index files)."""
    kb_path = os.path.join(INDICES_DIR, kb_id)
    if not os.path.exists(kb_path):
        raise HTTPException(status_code=404, detail="KB not found")

    # Remove the entire KB directory tree
    try:
        shutil.rmtree(kb_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete KB: {e}")

    return DeleteKBResponse(message=f"KB '{kb_id}' deleted")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
