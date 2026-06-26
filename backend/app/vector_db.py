import os
import uuid
import pypdf
import chromadb
import google.generativeai as genai
from typing import List, Dict, Tuple
from app.config import settings

# Initialize persistent ChromaDB client
client = None
collection = None

def init_chroma():
    global client, collection
    if not os.path.exists(settings.chroma_db_path):
        os.makedirs(settings.chroma_db_path)
    
    client = chromadb.PersistentClient(path=settings.chroma_db_path)
    collection = client.get_or_create_collection("smarterp_docs")

# Initialize Chroma on import
try:
    init_chroma()
except Exception as e:
    print(f"Error initializing ChromaDB: {e}")

def get_embedding(text: str) -> List[float]:
    """Generates embedding vector for a single text using Gemini Embedding API."""
    if not settings.gemini_api_key:
        raise ValueError("Gemini API key is not configured.")
    
    # Configure API key
    genai.configure(api_key=settings.gemini_api_key)
    
    response = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_document"
    )
    return response["embedding"]

def get_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generates embedding vectors for a batch of texts."""
    if not settings.gemini_api_key:
        raise ValueError("Gemini API key is not configured.")
    
    genai.configure(api_key=settings.gemini_api_key)
    
    response = genai.embed_content(
        model="models/text-embedding-004",
        contents=texts,
        task_type="retrieval_document"
    )
    return response["embedding"]

def split_text_into_chunks(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    """Splits a document text into smaller overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return chunks

def extract_pdf_text(file_path: str) -> List[Tuple[int, str]]:
    """Extracts text page by page from a PDF file. Returns a list of (page_num, text) tuples."""
    pages_text = []
    with open(file_path, "rb") as f:
        reader = pypdf.PdfReader(f)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                pages_text.append((i + 1, text))
    return pages_text

def index_document(file_path: str, filename: str) -> dict:
    """Extracts text from PDF, chunks it, generates embeddings, and indexes it in ChromaDB."""
    global collection
    if collection is None:
        init_chroma()

    try:
        pages = extract_pdf_text(file_path)
        if not pages:
            return {"status": "error", "message": "No readable text found in PDF"}

        chunks = []
        metadatas = []
        ids = []

        for page_num, page_text in pages:
            page_chunks = split_text_into_chunks(page_text)
            for chunk_idx, chunk in enumerate(page_chunks):
                chunks.append(chunk)
                metadatas.append({
                    "filename": filename,
                    "page": page_num,
                    "chunk": chunk_idx
                })
                ids.append(f"{filename}_p{page_num}_c{chunk_idx}_{uuid.uuid4().hex[:8]}")

        # Batch embed and insert
        if chunks:
            # Chunk lists to avoid size limitations in API calls
            batch_size = 20
            for i in range(0, len(chunks), batch_size):
                sub_chunks = chunks[i : i + batch_size]
                sub_metadatas = metadatas[i : i + batch_size]
                sub_ids = ids[i : i + batch_size]

                if settings.gemini_api_key:
                    embeddings = get_embeddings_batch(sub_chunks)
                    collection.add(
                        embeddings=embeddings,
                        documents=sub_chunks,
                        metadatas=sub_metadatas,
                        ids=sub_ids
                    )
                else:
                    collection.add(
                        documents=sub_chunks,
                        metadatas=sub_metadatas,
                        ids=sub_ids
                    )

        return {"status": "success", "chunks_indexed": len(chunks)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def query_rag_documents(query_text: str) -> dict:
    """Retrieves context from ChromaDB and generates an answer using Gemini."""
    global collection
    if collection is None:
        init_chroma()

    if not settings.gemini_api_key and not settings.openrouter_api_key:
        return {"response": "API is not configured. Please add your key to the .env file.", "sources": []}

    try:
        # Query ChromaDB (use Gemini embeddings if key is present, otherwise fall back to local sentence-transformer)
        if settings.gemini_api_key:
            query_vector = get_embedding(query_text)
            results = collection.query(
                query_embeddings=[query_vector],
                n_results=5
            )
        else:
            results = collection.query(
                query_texts=[query_text],
                n_results=5
            )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        if not documents:
            return {
                "response": "No matching documents or context found in the uploaded resources. Please make sure you have uploaded relevant PDF documents.",
                "sources": []
            }

        # Build context
        context_str = ""
        sources = set()
        for idx, doc in enumerate(documents):
            meta = metadatas[idx]
            filename = meta.get("filename", "document")
            page = meta.get("page", 1)
            context_str += f"--- Source: {filename} (Page {page}) ---\n{doc}\n\n"
            sources.add(f"{filename} (Page {page})")

        # Synthesize answer
        prompt = f"""
        You are a Document Intelligence Assistant for SmartERP. Your job is to answer the user's question based strictly on the provided context retrieved from uploaded PDF documents.
        
        Here is the retrieved context:
        {context_str}
        
        User Question: {query_text}
        
        Instructions:
        - Answer the question clearly and factually based on the context above.
        - If the context doesn't contain the answer, politely state: "Based on the uploaded documents, I could not find information to answer this question." Do not try to make up information.
        - Cite the documents and pages if relevant.
        """
        
        if settings.openrouter_api_key:
            from app.ai import call_openrouter
            response_text = call_openrouter(prompt)
        else:
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(prompt)
            response_text = response.text.strip()

        return {
            "response": response_text,
            "sources": sorted(list(sources))
        }

    except Exception as e:
        return {
            "response": f"An error occurred while performing search query: {str(e)}",
            "sources": []
        }
