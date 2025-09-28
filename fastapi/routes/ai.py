# routes/ai.py
from fastapi import APIRouter, HTTPException, Form, Depends, Request
from fastapi.responses import JSONResponse
from ai_utils import summarize_pdf, answer_question_about_pdf, generate_quiz_from_pdf
from database import database
import os
import logging

from security import require_auth

router = APIRouter(dependencies=[Depends(require_auth)])
logger = logging.getLogger(__name__)

@router.post("/ai/summarize")
async def summarize_document(
    file_id: int = Form(...),
    max_length: int = Form(500)
):
    """
    Generate a summary for an uploaded PDF document.
    
    Args:
        file_id: The ID of the PDF file in the database
        max_length: Maximum length of the summary in words (default: 500)
    """
    try:
        # Get file information from database
        query = "SELECT * FROM pdf_files WHERE id = :file_id"
        file_record = await database.fetch_one(query=query, values={"file_id": file_id})
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path = file_record["file_path"]
        
        # Check if file exists on disk
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="PDF file not found on disk")
        
        # Generate summary
        result = await summarize_pdf(file_path, max_length)
        
        # Store summary in database (optional - you might want to cache summaries)
        update_query = """
        UPDATE pdf_files 
        SET summary = :summary, summary_generated_at = NOW()
        WHERE id = :file_id
        """
        await database.execute(
            query=update_query, 
            values={"summary": result["summary"], "file_id": file_id}
        )
        
        return JSONResponse({
            "file_id": file_id,
            "file_name": file_record["name"],
            "summary": result["summary"],
            "original_word_count": result["word_count"],
            "summary_word_count": result["summary_length"],
            "success": True
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error summarizing document {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@router.get("/ai/summary/{file_id}")
async def get_summary(file_id: int):
    """
    Retrieve an existing summary for a PDF file.
    """
    try:
        query = """
        SELECT id, name, summary, summary_generated_at, uploaded_at 
        FROM pdf_files 
        WHERE id = :file_id
        """
        file_record = await database.fetch_one(query=query, values={"file_id": file_id})
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        return JSONResponse({
            "file_id": file_record["id"],
            "file_name": file_record["name"],
            "summary": file_record["summary"],
            "summary_generated_at": file_record["summary_generated_at"].isoformat() if file_record["summary_generated_at"] else None,
            "uploaded_at": file_record["uploaded_at"].isoformat(),
            "has_summary": bool(file_record["summary"])
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving summary for file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve summary: {str(e)}")

@router.post("/ai/chat")
async def chat_with_pdf(
    file_id: int = Form(...),
    question: str = Form(...)
):
    """
    Answer a question about a PDF document using AI.
    
    Args:
        file_id: The ID of the PDF file in the database
        question: The question to ask about the PDF content
    """
    try:
        # Get file information from database
        query = "SELECT * FROM pdf_files WHERE id = :file_id"
        file_record = await database.fetch_one(query=query, values={"file_id": file_id})
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path = file_record["file_path"]
        
        # Check if file exists on disk
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="PDF file not found on disk")
        
        # Generate answer using AI
        answer = await answer_question_about_pdf(file_path, question)
        
        return JSONResponse({
            "file_id": file_id,
            "file_name": file_record["name"],
            "question": question,
            "answer": answer,
            "success": True
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error answering question for document {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to answer question: {str(e)}")

@router.get("/ai/user-summaries/{user_id}")
async def get_user_summaries(user_id: int, limit: int = 20):
    """
    Get all summaries for a user to populate the summary history.
    """
    try:
        query = """
        SELECT id, name, file_path, uploaded_at, summary, summary_generated_at
        FROM pdf_files 
        WHERE user_id = :user_id AND summary IS NOT NULL
        ORDER BY summary_generated_at DESC 
        LIMIT :limit
        """
        files = await database.fetch_all(
            query=query, 
            values={"user_id": user_id, "limit": limit}
        )
        
        summaries = []
        for file in files:
            # Parse summary into key points (split by newlines or sentences)
            import re
            key_points = re.split(r'\n|\. ', file["summary"]) if file["summary"] else []
            key_points = [re.sub(r'^\d+\.\s*', '', point.strip()) for point in key_points if point.strip() and len(point.strip()) > 10][:8]
            
            summaries.append({
                "id": f"sum-{file['id']}-{int(file['summary_generated_at'].timestamp()) if file['summary_generated_at'] else int(file['uploaded_at'].timestamp())}",
                "title": f"Summary of {file['name']}",
                "fileName": file["name"],
                "createdAt": file["summary_generated_at"].isoformat() if file["summary_generated_at"] else file["uploaded_at"].isoformat(),
                "content": file["summary"],
                "keyPoints": key_points if key_points else ["Summary generated successfully"],
                "wordCount": len(file["summary"].split()) if file["summary"] else 0,
                "fileId": file["id"]
            })
        
        return summaries
        
    except Exception as e:
        logger.error(f"Error retrieving user summaries for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve summaries: {str(e)}")

@router.get("/ai/files-with-summaries/{user_id}")
async def get_files_with_summaries(user_id: int, limit: int = 10):
    """
    Get recent PDF files for a user, indicating which ones have summaries.
    """
    try:
        query = """
        SELECT id, name, file_path, uploaded_at, 
               CASE WHEN summary IS NOT NULL THEN true ELSE false END as has_summary,
               summary_generated_at
        FROM pdf_files 
        WHERE user_id = :user_id 
        ORDER BY uploaded_at DESC 
        LIMIT :limit
        """
        files = await database.fetch_all(
            query=query, 
            values={"user_id": user_id, "limit": limit}
        )
        
        return [
            {
                "id": file["id"],
                "name": file["name"],
                "uploaded_at": file["uploaded_at"].isoformat(),
                "has_summary": file["has_summary"],
                "summary_generated_at": file["summary_generated_at"].isoformat() if file["summary_generated_at"] else None
            }
            for file in files
        ]
        
    except Exception as e:
        logger.error(f"Error retrieving files with summaries for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve files: {str(e)}")

@router.post("/ai/generate-quiz")
async def generate_quiz(
    file_id: int = Form(...),
    num_questions: int = Form(5),
    difficulty: str = Form("medium")
):
    """
    Generate a quiz for an uploaded PDF document.
    
    Args:
        file_id: The ID of the PDF file in the database
        num_questions: Number of questions to generate (default: 5)
        difficulty: Difficulty level - easy, medium, or hard (default: medium)
    """
    try:
        # Validate difficulty level
        if difficulty not in ["easy", "medium", "hard"]:
            raise HTTPException(status_code=400, detail="Difficulty must be 'easy', 'medium', or 'hard'")
        
        # Validate number of questions
        if num_questions < 1 or num_questions > 20:
            raise HTTPException(status_code=400, detail="Number of questions must be between 1 and 20")
        
        # Get file information from database
        query = "SELECT * FROM pdf_files WHERE id = :file_id"
        file_record = await database.fetch_one(query=query, values={"file_id": file_id})
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path = file_record["file_path"]
        
        # Check if file exists on disk
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="PDF file not found on disk")
        
        # Generate quiz
        result = await generate_quiz_from_pdf(file_path, num_questions, difficulty)
        
        return JSONResponse({
            "file_id": file_id,
            "file_name": file_record["name"],
            "quiz": result["quiz"],
            "metadata": {
                "source_word_count": result["source_word_count"],
                "num_questions": result["num_questions"],
                "difficulty": result["difficulty"]
            },
            "success": True
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quiz for document {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@router.get("/ai/files-for-quiz/{user_id}")
async def get_files_for_quiz(user_id: int, limit: int = 10):
    """
    Get recent PDF files for a user that can be used for quiz generation.
    """
    try:
        query = """
        SELECT id, name, file_path, uploaded_at
        FROM pdf_files 
        WHERE user_id = :user_id 
        ORDER BY uploaded_at DESC 
        LIMIT :limit
        """
        files = await database.fetch_all(
            query=query, 
            values={"user_id": user_id, "limit": limit}
        )
        
        return [
            {
                "id": file["id"],
                "name": file["name"],
                "uploaded_at": file["uploaded_at"].isoformat()
            }
            for file in files
        ]
        
    except Exception as e:
        logger.error(f"Error retrieving files for quiz for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve files: {str(e)}")

@router.post("/ai/save-quiz-session")
async def save_quiz_session(
    user_id: int = Form(...),
    file_id: int = Form(...),
    quiz_data: str = Form(...),  # JSON string
    user_answers: str = Form(None),  # JSON string
    score: int = Form(None),
    total_questions: int = Form(...),
    difficulty: str = Form(...),
    completed: bool = Form(False)
):
    """
    Save a quiz session to the database.
    """
    try:
        import json
        
        # Parse JSON strings
        quiz_data_json = json.loads(quiz_data)
        user_answers_json = json.loads(user_answers) if user_answers else None
        
        # Insert quiz session
        query = """
        INSERT INTO quiz_sessions (user_id, file_id, quiz_data, user_answers, score, total_questions, difficulty, completed, completed_at)
        VALUES (:user_id, :file_id, :quiz_data, :user_answers, :score, :total_questions, :difficulty, :completed, :completed_at)
        RETURNING id
        """
        
        from datetime import datetime
        completed_at = datetime.now() if completed else None
        
        session_id = await database.fetch_val(
            query=query,
            values={
                "user_id": user_id,
                "file_id": file_id,
                "quiz_data": json.dumps(quiz_data_json),
                "user_answers": json.dumps(user_answers_json) if user_answers_json else None,
                "score": score,
                "total_questions": total_questions,
                "difficulty": difficulty,
                "completed": completed,
                "completed_at": completed_at
            }
        )
        
        return JSONResponse({
            "session_id": session_id,
            "success": True,
            "message": "Quiz session saved successfully"
        })
        
    except Exception as e:
        logger.error(f"Error saving quiz session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save quiz session: {str(e)}")

@router.get("/ai/quiz-history/{user_id}")
async def get_quiz_history(user_id: int, limit: int = 20):
    """
    Get quiz history for a user, grouped by file with attempt counts and latest scores.
    """
    try:
        # Get all sessions with attempt numbering
        query = """
        WITH ranked_sessions AS (
            SELECT 
                qs.id, qs.score, qs.total_questions, qs.difficulty, qs.completed, 
                qs.completed_at, qs.created_at, pf.name as file_name, qs.file_id,
                ROW_NUMBER() OVER (PARTITION BY pf.name ORDER BY qs.created_at DESC) as attempt_rank,
                COUNT(*) OVER (PARTITION BY pf.name) as total_attempts
            FROM quiz_sessions qs
            JOIN pdf_files pf ON qs.file_id = pf.id
            WHERE qs.user_id = :user_id AND qs.completed = true
        ),
        latest_sessions AS (
            SELECT DISTINCT
                file_name,
                file_id,
                total_attempts,
                FIRST_VALUE(id) OVER (PARTITION BY file_name ORDER BY created_at DESC) as latest_id,
                FIRST_VALUE(score) OVER (PARTITION BY file_name ORDER BY created_at DESC) as latest_score,
                FIRST_VALUE(total_questions) OVER (PARTITION BY file_name ORDER BY created_at DESC) as latest_total_questions,
                FIRST_VALUE(difficulty) OVER (PARTITION BY file_name ORDER BY created_at DESC) as latest_difficulty,
                FIRST_VALUE(completed_at) OVER (PARTITION BY file_name ORDER BY created_at DESC) as latest_completed_at,
                FIRST_VALUE(created_at) OVER (PARTITION BY file_name ORDER BY created_at DESC) as latest_created_at
            FROM ranked_sessions
        )
        SELECT 
            latest_id as id,
            file_name,
            file_id,
            latest_score as score,
            latest_total_questions as total_questions,
            latest_difficulty as difficulty,
            true as completed,
            latest_completed_at as completed_at,
            latest_created_at as created_at,
            total_attempts
        FROM latest_sessions
        ORDER BY latest_created_at DESC
        LIMIT :limit
        """
        
        sessions = await database.fetch_all(
            query=query,
            values={"user_id": user_id, "limit": limit}
        )
        
        return [
            {
                "id": session["id"],
                "file_name": session["file_name"],
                "file_id": session["file_id"],
                "score": session["score"],
                "total_questions": session["total_questions"],
                "difficulty": session["difficulty"],
                "completed": session["completed"],
                "completed_at": session["completed_at"].isoformat() if session["completed_at"] else None,
                "created_at": session["created_at"].isoformat(),
                "total_attempts": session["total_attempts"],
                "percentage": round((session["score"] / session["total_questions"]) * 100) if session["score"] is not None and session["total_questions"] > 0 else 0
            }
            for session in sessions
        ]
        
    except Exception as e:
        logger.error(f"Error retrieving quiz history for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve quiz history: {str(e)}")

@router.get("/ai/quiz-session/{session_id}")
async def get_quiz_session(session_id: int):
    """
    Get a specific quiz session with full details.
    """
    try:
        query = """
        SELECT qs.*, pf.name as file_name
        FROM quiz_sessions qs
        JOIN pdf_files pf ON qs.file_id = pf.id
        WHERE qs.id = :session_id
        """
        
        session = await database.fetch_one(
            query=query,
            values={"session_id": session_id}
        )
        
        if not session:
            raise HTTPException(status_code=404, detail="Quiz session not found")
        
        import json
        
        return JSONResponse({
            "id": session["id"],
            "file_name": session["file_name"],
            "quiz_data": json.loads(session["quiz_data"]),
            "user_answers": json.loads(session["user_answers"]) if session["user_answers"] else None,
            "score": session["score"],
            "total_questions": session["total_questions"],
            "difficulty": session["difficulty"],
            "completed": session["completed"],
            "completed_at": session["completed_at"].isoformat() if session["completed_at"] else None,
            "created_at": session["created_at"].isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving quiz session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve quiz session: {str(e)}")
