# Intelligent RAG Assistant

[![Checkout the demo](https://raw.githubusercontent.com/kashyam/Intelligent-KB-Retrieval/main/KB_thumbnail.png)](https://player.vimeo.com/video/1137309727)

## Experience the Assistant in action 
Demo - [Knowledge Chat Assistant](https://player.vimeo.com/video/1137309727)

Demo - [Knowledge Voice Assistant](https://player.vimeo.com/video/1145109851)

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


Here is the architecture and flow documentation formatted as a clean, ready-to-use Markdown section for your GitHub README.

***

## 🎙️ Voice Mode Architecture

The Voice Mode of the Intelligent RAG Assistant transforms static document interaction into a fluid, conversational experience. It enables low-latency, full-duplex communication using a dedicated Realtime WebSocket architecture.

### 🔑 Key Features

*   **⚡ Real-time Conversation:** Achieves sub-second latency using WebSocket streams for a natural, human-like flow.
*   **📚 Contextual RAG:** Dynamically accesses the vector database to ground spoken responses in document content via Function Calling.
*   **🛑 Barge-in Support:** Full-duplex audio allows users to interrupt the AI naturally; the system stops speaking immediately when the user begins.
*   **📄 Conversation Summaries:** Automatically generates a PDF transcript and summary upon session completion.
*   **🌊 Visual Feedback:** Provides real-time audio visualization to indicate active listening and speaking states.

---

### 🔄 High-Level Voice Data Flow

The following details the lifecycle of a voice session, corresponding to the internal sequence of events between the User, Frontend, Backend, and Azure OpenAI.

#### 1. Session Initialization
*   **Connection:** The **Frontend** initiates a persistent WebSocket connection to the **Backend** at `/api/ws/voice/{kb_id}`.
*   **Upstream Connection:** The **Backend** acts as a secure bridge, establishing a connection to the **Azure OpenAI Realtime API**.
*   **Tool Injection:** During the session handshake, the backend defines available tools (specifically `query_knowledge_base`), enabling the model to know it has access to external document data.

#### 2. The Conversation Loop (Input)
*   **Audio Capture:** The user speaks into the microphone.
*   **Streaming:** The **Frontend** streams raw audio (Base64 PCM16) to the **Backend**, which immediately forwards the input audio buffer to **Azure**.
*   **Processing:** Azure performs on-device Voice Activity Detection (VAD) to determine when the user has finished a sentence, followed by model inference.

#### 3. Contextual RAG (The Decision Logic)
If the model determines the user's query requires specific facts from the uploaded documents:
1.  **Intent Recognition:** Azure pauses response generation and emits a `function_call` event (asking to `query_knowledge_base`).
2.  **Vector Search:** The **Backend** intercepts this event, executes a semantic search against the **Vector DB (FAISS)**, and retrieves relevant chunks.
3.  **Grounding Event:** The backend sends a `grounding` event to the Frontend to display citations visually.
4.  **Context Injection:** The backend pushes the retrieved text back to Azure as the `function_call_output`.

#### 4. Response Synthesis (Output)
*   **Generation:** The model uses the injected context to synthesize a factual spoken response (e.g., *"According to the document..."*).
*   **Audio Playback:** Azure streams the generated audio delta (TTS) to the **Backend**, which relays it to the **Frontend**.
*   **User Experience:** The frontend plays the audio stream immediately, maintaining a low-latency conversational feel.

---

### 🧠 How Contextual Knowledge Works (Under the Hood)

The voice assistant bridges the gap between LLM capabilities and your private data using **Tool Use (Function Calling)**:

| Step | Description |
| :--- | :--- |
| **1. Tool Definition** | On session start, the backend tells the model: *"If you need facts, use the `query_knowledge_base` tool."* |
| **2. Intent** | When you ask, *"What was the revenue in Q3?"*, the model detects it cannot answer from training data alone and triggers the tool. |
| **3. Execution** | The backend performs the vector search invisible to the user. |
| **4. Injection** | The specific context is fed back into the model's context. |
| **5. Synthesis** | The model generates the answer using the provided facts, ensuring accuracy and reducing hallucinations. |

## Frontend Overview

The frontend is a modern, single-page application built with:

-   **React & TypeScript**: For a robust and type-safe component-based UI.
-   **Tailwind CSS**: For rapid, utility-first styling and a clean, responsive design.
-   **No Build Step**: Uses Babel Standalone to transpile TSX/JSX in the browser, simplifying setup.

All communication with the backend is handled through a REST API, with functions neatly organized in `services/apiService.ts`.

### Steps to Run the Application

To run the Intelligent RAG Assistant, the following prerequisites are required:

-   `npm` and `Node.js`
-   `Python 3.12` or higher
-   `UV`

---

#### Backend Setup:

1.  Navigate to the `backend` directory.
2.  Run the following commands in your terminal:
    ```bash
    uv sync
    ```
    ```bash
    uv run app.py
    ```

---

#### Frontend Setup:

1.  Navigate to the `frontend` directory.
2.  Run the following commands in your terminal:
    ```bash
    npm install
    ```
    ```bash
    npm run dev
    ```


## Features and potential improvements

### 1. Backed by Docling: Preserving Structural Information

The system's document processing is powered by a sophisticated engine, referred to here as "Docling," which is designed to do more than just extract raw text. Its primary advantage is its ability to understand and preserve the structural and semantic information embedded in complex documents.

-   **Structural and Tabular Data Extraction**: Standard text extraction often fails with structured content, jumbling table rows and columns into an incoherent block of text. Docling, on the other hand, intelligently parses the document layout. It identifies tabular data, understands its row-column structure, and preserves these relationships. This means that when you ask a question about data within a table, the AI receives the information in a structured format, allowing it to provide a precise and accurate answer. For example, a query like "What were the sales figures for Q2 2023?" can be answered correctly because the model can associate the "Q2 2023" column with the "Sales Figures" row.

-   **Information from Charts and Visuals**: While direct image-to-data conversion for complex charts is a frontier in AI, a tool like Docling can extract associated text such as chart titles, axis labels, legends, and any accompanying captions or explanatory paragraphs. This contextual information is vital. It allows the Large Language Model (LLM) to understand what a chart represents, even if it cannot "see" the visual data points. This preserved metadata is then used to answer questions related to the chart's subject matter.

### 2. Universal Document Compatibility

The system is engineered to be a versatile solution, capable of handling a wide array of document types, moving beyond simple machine-readable PDFs.

-   **Readable and Scanned Documents**: For standard, text-based PDFs, the process is straightforward. For scanned documents, which are essentially images of text, the system integrates Optical Character Recognition (OCR) technology. This OCR engine converts the image into machine-readable text, which is then fed into the processing pipeline.
-   **Handwritten and Unclear Documents**: Handling handwritten or unclear documents is significantly more challenging and relies on advanced OCR capabilities. Modern OCR models are increasingly trained on vast datasets of handwriting and can achieve high accuracy. For unclear or low-quality scans, the system can employ image pre-processing techniques, such as:
    -   **Denoising**: Removing random specks and artifacts.
    -   **Binarization**: Converting the image to black and white to improve contrast.
    -   **Sharpening**: Enhancing the edges of text to make it more distinct.
    These steps clean up the input image, dramatically improving the accuracy of the subsequent OCR process and enabling the system to ingest even poor-quality documents.

### 3. Vendor-Agnostic AI Models

The architecture is designed with modularity in mind, ensuring that it is not locked into a single AI vendor. While the current implementation utilizes Azure's powerful suite of AI services, it can be easily adapted to use models from other providers.

-   **Azure Implementation**: Currently, the system leverages Azure OpenAI for its `text-embedding` models to generate vector representations of the text chunks and its `GPT-series` models for the final answer generation. Azure is a robust choice, offering enterprise-grade security, scalability, and performance.
-   **Extending to Other Vendors**: The core logic of the application interacts with the embedding and generation models through standardized API calls. This makes it straightforward to swap out the Azure endpoint for a different one. The process would involve:
    1.  **Selecting a New Provider**: This could be another major cloud provider like Google (Vertex AI), Amazon (Bedrock), or a specialized model provider like Cohere, Anthropic (Claude), or an open-source model hosted on a platform like Hugging Face.
    2.  **Adapting the API Call**: The code would be updated to match the new provider's API signature, including authentication methods, request formats, and response parsing.
    3.  **Model Compatibility**: As long as the chosen models fulfill the two primary functions—creating text embeddings and generating text from a prompt—they can be seamlessly integrated into the existing RAG pipeline. This flexibility ensures the system can always leverage the best-performing or most cost-effective models available on the market.

### 4. Flexible and Optimized Chunking

Chunking—the process of breaking down large documents into smaller, manageable pieces—is a critical step in any RAG system. The effectiveness of the retrieval process is highly dependent on the chunking strategy. This system provides the flexibility to tailor this process as needed.

-   **Configurable Chunk Size**: The ideal chunk size can vary significantly depending on the nature of the documents. For dense, technical manuals, smaller, more focused chunks might be better. For narrative-style documents, larger chunks that preserve more context could be more effective. The system allows an administrator to adjust the `chunk_size` parameter based on these needs.
-   **Adjustable Overlap**: To avoid losing context at the boundaries of chunks, a certain amount of text is repeated between consecutive chunks. This is the `overlap`. For instance, if a sentence is split between the end of one chunk and the beginning of the next, a query related to that sentence might fail. By having an adjustable overlap, the system ensures that complete thoughts and contexts are captured within at least one chunk, improving the likelihood of successful retrieval.
-   **Experiment-Driven Optimization**: There is no single "best" setting for chunk size and overlap. The optimal configuration is often found through experimentation. By analyzing the system's performance on a sample set of documents and queries, one can fine-tune these parameters to achieve the best balance between retrieval precision and contextual completeness for a specific knowledge base.

---

### Scope for Improvements:

Here are five potential areas for enhancing the Intelligent RAG Assistant:

1.  **Implement a Hybrid Search Mechanism**:
    Currently, the retrieval relies on semantic (vector) search, which is excellent for finding contextually similar results. However, it can sometimes miss keywords or specific phrases (like product codes or acronyms). A hybrid approach that combines semantic search with traditional keyword-based search (like BM25) would offer the best of both worlds. This would ensure that documents containing exact search terms are ranked highly, while still leveraging the power of semantic understanding for more nuanced queries.

2.  **Integrate a Knowledge Graph for Deeper Understanding**:
    For knowledge bases with many interconnected entities (e.g., people, products, organizations), a knowledge graph could be constructed during the ingestion phase. This graph would store entities and their relationships. When a user asks a complex question involving multiple entities, the system could query the graph to retrieve highly relevant and interconnected facts, providing a much richer context to the LLM and enabling it to answer more sophisticated, multi-hop questions.

3.  **Introduce an Agentic Framework for Multi-Step Reasoning**:
    Instead of a simple "retrieve-then-generate" pipeline, the system could be enhanced with an agentic framework (like LangChain Agents or a custom implementation). This would allow the AI to perform multi-step reasoning. For example, if a question requires information from two different parts of a document or even two different documents, the agent could perform a search, analyze the results, decide it needs more information, perform a second search, and then synthesize the final answer from all the retrieved contexts.

4.  **Develop Proactive Information Retrieval and Summarization**:
    The assistant could be made more proactive. Based on a user's current query or the document they are interacting with, the system could pre-emptively fetch and summarize related information that the user might need next. For example, after answering a question about a specific feature in a technical manual, it could proactively offer a summary of related troubleshooting steps or configuration parameters, creating a more intuitive and helpful user experience.

5.  **Enhance the User Feedback Loop for Continuous Improvement**:
    A more robust user feedback mechanism could be implemented directly into the UI. Users could rate the quality of answers, highlight incorrect or unhelpful citations, or even suggest better answers. This feedback could be collected and used to fine-tune the system over time. For example, consistently downvoted document chunks could have their embeddings re-evaluated, or the LLM's prompting strategy could be adjusted based on the types of answers users find most helpful. This creates a powerful cycle of continuous learning and improvement.
