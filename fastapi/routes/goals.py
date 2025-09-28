# routes/goals.py
from fastapi import APIRouter, HTTPException, Form, Depends, Request
from fastapi.responses import JSONResponse
from database import database
from datetime import datetime, date
import logging

from security import require_auth

router = APIRouter(dependencies=[Depends(require_auth)])
logger = logging.getLogger(__name__)

@router.get("/goals/{user_id}")
async def get_user_goals(user_id: int):
    """
    Get all goals for a specific user.
    """
    try:
        query = """
        SELECT id, name, description, due_date, completed, created_at, updated_at
        FROM goals 
        WHERE user_id = :user_id 
        ORDER BY created_at DESC
        """
        goals = await database.fetch_all(query=query, values={"user_id": user_id})
        
        return [
            {
                "id": str(goal["id"]),
                "name": goal["name"],
                "description": goal["description"],
                "dueDate": goal["due_date"].isoformat(),
                "completed": goal["completed"],
                "createdAt": goal["created_at"].isoformat(),
                "updatedAt": goal["updated_at"].isoformat()
            }
            for goal in goals
        ]
        
    except Exception as e:
        logger.error(f"Error retrieving goals for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve goals: {str(e)}")

@router.get("/goals/{user_id}/stats")
async def get_user_goal_stats(user_id: int):
    """
    Get goal statistics for dashboard display.
    """
    try:
        query = """
        SELECT 
            COUNT(*) as total_goals,
            COUNT(CASE WHEN completed = true THEN 1 END) as completed_goals,
            COUNT(CASE WHEN completed = false THEN 1 END) as pending_goals,
            COUNT(CASE WHEN completed = false AND due_date < CURRENT_DATE THEN 1 END) as overdue_goals
        FROM goals 
        WHERE user_id = :user_id
        """
        stats = await database.fetch_one(query=query, values={"user_id": user_id})
        
        total = stats["total_goals"] or 0
        completed = stats["completed_goals"] or 0
        pending = stats["pending_goals"] or 0
        overdue = stats["overdue_goals"] or 0
        
        completion_rate = (completed / total * 100) if total > 0 else 0
        
        return JSONResponse({
            "totalGoals": total,
            "completedGoals": completed,
            "pendingGoals": pending,
            "overdueGoals": overdue,
            "completionRate": round(completion_rate, 1),
            "chartData": [
                {"name": "Completed", "value": completed, "color": "#22c55e"},
                {"name": "Pending", "value": pending, "color": "#e5e7eb"}
            ]
        })
        
    except Exception as e:
        logger.error(f"Error retrieving goal stats for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve goal stats: {str(e)}")

@router.post("/goals")
async def create_goal(
    user_id: int = Form(...),
    name: str = Form(...),
    description: str = Form(None),
    due_date: str = Form(...)
):
    """
    Create a new goal for a user.
    """
    try:
        # Parse the due date
        due_date_obj = datetime.strptime(due_date, "%Y-%m-%d").date()
        
        query = """
        INSERT INTO goals (user_id, name, description, due_date, completed)
        VALUES (:user_id, :name, :description, :due_date, :completed)
        RETURNING id, name, description, due_date, completed, created_at, updated_at
        """
        
        goal = await database.fetch_one(
            query=query,
            values={
                "user_id": user_id,
                "name": name,
                "description": description,
                "due_date": due_date_obj,
                "completed": False
            }
        )
        
        return JSONResponse({
            "id": str(goal["id"]),
            "name": goal["name"],
            "description": goal["description"],
            "dueDate": goal["due_date"].isoformat(),
            "completed": goal["completed"],
            "createdAt": goal["created_at"].isoformat(),
            "updatedAt": goal["updated_at"].isoformat(),
            "success": True
        })
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        logger.error(f"Error creating goal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create goal: {str(e)}")

@router.put("/goals/{goal_id}")
async def update_goal(
    goal_id: int,
    user_id: int = Form(...),
    name: str = Form(None),
    description: str = Form(None),
    due_date: str = Form(None),
    completed: bool = Form(None)
):
    """
    Update an existing goal. Only the goal owner can update it.
    """
    try:
        # First verify the goal belongs to the user
        verify_query = "SELECT user_id FROM goals WHERE id = :goal_id"
        goal_owner = await database.fetch_one(query=verify_query, values={"goal_id": goal_id})
        
        if not goal_owner:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        if goal_owner["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only update your own goals")
        
        # Build update query dynamically based on provided fields
        update_fields = []
        values = {"goal_id": goal_id, "updated_at": datetime.now()}
        
        if name is not None:
            update_fields.append("name = :name")
            values["name"] = name
            
        if description is not None:
            update_fields.append("description = :description")
            values["description"] = description
            
        if due_date is not None:
            due_date_obj = datetime.strptime(due_date, "%Y-%m-%d").date()
            update_fields.append("due_date = :due_date")
            values["due_date"] = due_date_obj
            
        if completed is not None:
            update_fields.append("completed = :completed")
            values["completed"] = completed
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        update_fields.append("updated_at = :updated_at")
        
        query = f"""
        UPDATE goals 
        SET {', '.join(update_fields)}
        WHERE id = :goal_id
        RETURNING id, name, description, due_date, completed, created_at, updated_at
        """
        
        updated_goal = await database.fetch_one(query=query, values=values)
        
        return JSONResponse({
            "id": str(updated_goal["id"]),
            "name": updated_goal["name"],
            "description": updated_goal["description"],
            "dueDate": updated_goal["due_date"].isoformat(),
            "completed": updated_goal["completed"],
            "createdAt": updated_goal["created_at"].isoformat(),
            "updatedAt": updated_goal["updated_at"].isoformat(),
            "success": True
        })
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating goal {goal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update goal: {str(e)}")

@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: int, user_id: int = Form(...)):
    """
    Delete a goal. Only the goal owner can delete it.
    """
    try:
        # First verify the goal belongs to the user
        verify_query = "SELECT user_id FROM goals WHERE id = :goal_id"
        goal_owner = await database.fetch_one(query=verify_query, values={"goal_id": goal_id})
        
        if not goal_owner:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        if goal_owner["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own goals")
        
        # Delete the goal
        delete_query = "DELETE FROM goals WHERE id = :goal_id"
        await database.execute(query=delete_query, values={"goal_id": goal_id})
        
        return JSONResponse({
            "message": "Goal deleted successfully",
            "success": True
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting goal {goal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete goal: {str(e)}")
