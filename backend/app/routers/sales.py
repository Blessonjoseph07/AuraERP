from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from app.database import get_db
from app import schemas, crud, auth, models

router = APIRouter(prefix="/api/sales", tags=["Sales Management"])

@router.get("/", response_model=List[schemas.SaleOut])
def list_sales(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    return crud.get_sales(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.SaleOut, status_code=status.HTTP_201_CREATED)
def record_sale(
    sale: schemas.SaleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    return crud.create_sale(db, sale)

@router.put("/{sale_id}", response_model=schemas.SaleOut)
def update_sale(
    sale_id: int,
    sale: schemas.SaleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_manager)
):
    updated = crud.update_sale(db, sale_id, sale)
    if not updated:
        raise HTTPException(status_code=404, detail="Sale transaction not found")
    return updated

@router.delete("/{sale_id}", status_code=status.HTTP_200_OK)
def delete_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_admin)
):
    success = crud.delete_sale(db, sale_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sale transaction not found")
    return {"detail": "Sale transaction deleted successfully"}

@router.get("/stats/monthly-sales")
def get_monthly_sales(
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    is_sqlite = db.bind.dialect.name == "sqlite"
    if is_sqlite:
        month_label = func.strftime("%Y-%m", models.Sale.sale_date)
    else:
        month_label = func.to_char(models.Sale.sale_date, "YYYY-MM")

    results = db.query(
        month_label.label("month"),
        func.sum(models.Sale.amount).label("total_sales"),
        func.sum(models.Sale.quantity).label("total_quantity")
    ).group_by("month").order_by("month").all()

    return [{"month": r.month or "Unknown", "sales": r.total_sales or 0, "quantity": r.total_quantity or 0} for r in results]

@router.get("/stats/top-selling")
def get_top_selling(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    results = db.query(
        models.Product.product_name,
        models.Product.category,
        func.sum(models.Sale.quantity).label("total_units"),
        func.sum(models.Sale.amount).label("total_revenue")
    ).join(models.Sale, models.Sale.product_id == models.Product.id)\
     .group_by(models.Product.id)\
     .order_by(desc("total_units"))\
     .limit(limit).all()

    return [
        {
            "product_name": r.product_name,
            "category": r.category,
            "units_sold": r.total_units or 0,
            "revenue": r.total_revenue or 0
        } for r in results
    ]
