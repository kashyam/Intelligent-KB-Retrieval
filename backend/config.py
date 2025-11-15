import yaml
import os


def load_config(path: str = None):
    if path is None:
        path = os.path.join(os.path.dirname(__file__), 'config.yaml')
    with open(path, 'r') as f:
        return yaml.safe_load(f)


CONFIG = load_config()

# Shortcuts
LLM_SETTINGS = CONFIG["azure"]["openai"]["llm"]
EMBEDDING_SETTINGS = CONFIG["azure"]["openai"]["embedding"]
VECTOR_DB_SETTINGS = CONFIG["vector_db"]
BM25_SETTINGS = CONFIG["bm25"]
RETRIEVAL_SETTINGS = CONFIG["retrieval"]
DOCLING_SETTINGS = CONFIG["docling"]
FEEDBACK_SETTINGS = CONFIG["feedback"]
LOGGING_SETTINGS = CONFIG["logging"]