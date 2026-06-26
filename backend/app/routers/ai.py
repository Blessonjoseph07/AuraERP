import os
import shutil
import tempfile
import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, auth, ai, vector_db

router = APIRouter(prefix="/api/ai", tags=["AI Features"])

@router.post("/chat", response_model=schemas.ChatResponse)
def database_chat(
    query: schemas.ChatQuery,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    """Chat with the ERP database using natural language (Text-to-SQL)."""
    result = ai.query_db_via_ai(db, query.message)
    return result

@router.get("/report", response_model=schemas.ReportSummaryResponse)
def get_ai_report(
    type: str = Query(..., description="Type of report: 'sales', 'expenses', or 'inventory'"),
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_manager)
):
    """Generate an AI-powered summary report for Sales, Expenses, or Inventory."""
    summary_text = ai.compile_executive_report(db, report_type=type)
    return {
        "summary": summary_text,
        "generated_at": datetime.datetime.utcnow()
    }

@router.post("/upload-doc", status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    current_user=Depends(auth.require_manager)
):
    """Upload a PDF document to be indexed in the vector database for RAG QA."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported for document indexing."
        )

    # Save to a temporary file
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        # Index the PDF
        result = vector_db.index_document(temp_path, file.filename)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        if result.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("message", "Failed to index document.")
            )

        return {
            "detail": f"Document '{file.filename}' indexed successfully.",
            "chunks_indexed": result.get("chunks_indexed", 0)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while indexing document: {str(e)}"
        )

@router.post("/chat-doc", response_model=schemas.DocChatResponse)
def query_documents(
    query: schemas.ChatQuery,
    current_user=Depends(auth.require_employee)
):
    """Search and chat with uploaded documents using RAG (ChromaDB + Gemini)."""
    result = vector_db.query_rag_documents(query.message)
    return result
