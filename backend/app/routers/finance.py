from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app import schemas, crud, auth, models

router = APIRouter(prefix="/api/finance", tags=["Finance Management"])

@router.get("/", response_model=List[schemas.ExpenseOut])
def list_expenses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_manager)
):
    return crud.get_expenses(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_manager)
):
    return crud.create_expense(db, expense)

@router.put("/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: int,
    expense: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_manager)
):
    updated = crud.update_expense(db, expense_id, expense)
    if not updated:
        raise HTTPException(status_code=404, detail="Expense record not found")
    return updated

@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_admin)
):
    success = crud.delete_expense(db, expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense record not found")
    return {"detail": "Expense record deleted successfully"}

@router.get("/stats/monthly-expenses")
def get_monthly_expenses(
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_manager)
):
    is_sqlite = db.bind.dialect.name == "sqlite"
    if is_sqlite:
        month_label = func.strftime("%Y-%m", models.Expense.expense_date)
    else:
        month_label = func.to_char(models.Expense.expense_date, "YYYY-MM")

    results = db.query(
        month_label.label("month"),
        func.sum(models.Expense.amount).label("total_expenses")
    ).group_by("month").order_by("month").all()

    return [{"month": r.month or "Unknown", "expenses": r.total_expenses or 0} for r in results]
