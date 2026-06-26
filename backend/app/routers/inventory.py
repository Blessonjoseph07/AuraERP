# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import schemas, crud, auth

router = APIRouter(prefix="/api/inventory", tags=["Inventory Management"])

@router.get("/", response_model=List[schemas.ProductOut])
def list_products(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    return crud.get_products(db, skip=skip, limit=limit, search=search)

@router.get("/low-stock", response_model=List[schemas.ProductOut])
def get_low_stock(
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    # Retrieve products with quantity less than 10
    return db.query(crud.models.Product).filter(crud.models.Product.quantity < 10).all()

@router.get("/{product_id}", response_model=schemas.ProductOut)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_manager)
):
    return crud.create_product(db, product)

@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    product: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_manager)
):
    updated = crud.update_product(db, product_id, product)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated

@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_admin)
):
    success = crud.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"detail": "Product deleted successfully"}
