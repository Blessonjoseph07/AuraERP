from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app import schemas, crud, auth

router = APIRouter(prefix="/api/employees", tags=["Employee Management"])

class LeaveRequest(BaseModel):
    days: int

@router.get("/", response_model=List[schemas.EmployeeOut])
def list_employees(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    return crud.get_employees(db, skip=skip, limit=limit, search=search)

@router.get("/{employee_id}", response_model=schemas.EmployeeOut)
def read_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    employee = crud.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.post("/", response_model=schemas.EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_manager)
):
    existing = crud.get_employee_by_email(db, employee.email)
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")
    return crud.create_employee(db, employee)

@router.put("/{employee_id}", response_model=schemas.EmployeeOut)
def update_employee(
    employee_id: int,
    employee: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_manager)
):
    updated = crud.update_employee(db, employee_id, employee)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return updated

@router.delete("/{employee_id}", status_code=status.HTTP_200_OK)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_admin)
):
    success = crud.delete_employee(db, employee_id)
    if not success:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"detail": "Employee deleted successfully"}

@router.post("/{employee_id}/leave", response_model=schemas.EmployeeOut)
def request_leave(
    employee_id: int,
    leave_req: LeaveRequest,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    employee = crud.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if leave_req.days <= 0:
        raise HTTPException(status_code=400, detail="Leave days must be greater than zero")
        
    if employee.leave_balance < leave_req.days:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient leave balance. Remaining: {employee.leave_balance} days."
        )
    
    # Deduct leave days
    employee.leave_balance -= leave_req.days
    db.commit()
    db.refresh(employee)
    return employee
