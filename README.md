# Intelligent RAG Assistant

[![Checkout the demo](https://raw.githubusercontent.com/kashyam/Intelligent-KB-Retrieval/main/KB_thumbnail.png)](https://player.vimeo.com/video/1137309727)

Checkout the demo - https://player.vimeo.com/video/1137309727

This is an advanced AI-powered assistant designed to provide accurate, context-aware answers from a private knowledge base of PDF documents. It leverages a Retrieval-Augmented Generation (RAG) architecture to ensure responses are grounded in the provided source material, complete with citations for verification.

## What It Does

The application provides a user-friendly interface for managing and conversing with custom knowledge bases. Key features include:

-   **Secure Access**: A login page protects the application, with credentials managed via environment variables.
-   **Knowledge Base Management**: Users can create, delete, and switch between multiple knowledge bases.
-   **PDF Document Upload**: Easily upload PDF files to populate a selected knowledge base. The backend automatically processes and indexes the content.
-   **Conversational Chat Interface**: Ask questions in natural language and receive detailed answers from the AI.
-   **Source Citations**: Every answer is accompanied by citations from the source documents, showing the exact text chunks used to generate the response.
-   **Adjustable AI Parameters**: Fine-tune the retrieval (Top K) and generation (Temperature, Max Tokens) parameters to control the AI's behavior.
-   **Real-time Status Updates**: Get instant feedback on file uploads, processing status, and KB statistics (file count, chunk count, etc.).

---

## How It Works: The RAG Pipeline

The application is split into a frontend client (the user interface you see) and a powerful backend that handles the data processing and AI logic.

### High-Level Flow

1.  **Ingestion**: A user uploads a PDF to a knowledge base.
2.  **Processing**: The backend parses the PDF, breaks it into manageable chunks, and converts these chunks into numerical representations (embeddings).
3.  **Storage**: These embeddings are stored in a specialized vector database (FAISS index) for fast retrieval.
4.  **Retrieval**: When a user asks a question, the question is also converted into an embedding. The system searches the vector database to find the text chunks with the closest semantic similarity to the question.
5.  **Generation**: The retrieved chunks (the context) are combined with the user's original question into a prompt. This prompt is sent to a powerful Large Language Model (LLM).
6.  **Response**: The LLM generates a comprehensive answer based *only* on the provided context and returns it to the user, along with the source citations.

---

## Backend Architecture

The backend is engineered to efficiently handle the entire RAG pipeline using a curated set of powerful technologies.

#### 1. Document Parsing & Chunking: **Microsoft Maritdown**

When a PDF is uploaded, it's first processed by **Microsoft Maritdown**. Maritdown is a sophisticated document understanding tool that goes beyond simple text extraction. It parses the complex structure of PDFs—including tables, lists, titles, and paragraphs—and converts them into a clean, structured format (like Markdown). This structured output allows the system to create more meaningful and contextually coherent text chunks, which is critical for high-quality retrieval.

#### 2. Vectorization & Ingestion: **Azure Embeddings & FAISS**

-   **Embedding Model**: Each text chunk is passed to an **Azure OpenAI embedding model** (e.g., `text-embedding-3-large`). This model converts the text into a high-dimensional vector, which is a numerical representation of its semantic meaning.
-   **Vector Indexing**: These vectors are then ingested into a **FAISS (Facebook AI Similarity Search) index**. FAISS is a highly optimized library for searching through massive sets of vectors at incredible speed. It builds an index that allows it to quickly find the vectors (and their corresponding text chunks) that are "closest" to a given query vector.

#### 3. Retrieval & Search: **FAISS**

When a user submits a query, the same Azure embedding model converts the query into a vector. The backend then uses the FAISS index to perform a similarity search. It compares the query vector against all the vectors in the index and retrieves the `top_k` (a user-configurable number) most similar chunks from the knowledge base.

#### 4. Answer Generation: **Azure GPT Model**

The retrieved chunks are assembled into a context block. This context, along with the original user query, is formatted into a precise prompt. This final prompt is sent to a powerful generative model hosted on **Azure, such as a GPT-4 or GPT-5 series model**. The model is instructed to synthesize an answer based strictly on the provided context. This crucial step prevents the model from "hallucinating" or using outside knowledge, ensuring the answers are verifiable and directly tied to the source documents. The backend then streams this answer back to the frontend, along with the source chunks used for citation.

---

## Frontend Overview

The frontend is a modern, single-page application built with:

-   **React & TypeScript**: For a robust and type-safe component-based UI.
-   **Tailwind CSS**: For rapid, utility-first styling and a clean, responsive design.
-   **No Build Step**: Uses Babel Standalone to transpile TSX/JSX in the browser, simplifying setup.

All communication with the backend is handled through a REST API, with functions neatly organized in `services/apiService.ts`.
