from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from passlib.context import CryptContext
import datetime
from fastapi import HTTPException, status

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- User CRUD ---
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_pw = pwd_context.hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Product CRUD ---
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(models.Product)
    if search:
        query = query.filter(models.Product.product_name.ilike(f"%{search}%") | models.Product.category.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    for key, value in product.model_dump(exclude_unset=True).items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True

# --- Employee CRUD ---
def get_employee(db: Session, employee_id: int):
    return db.query(models.Employee).filter(models.Employee.id == employee_id).first()

def get_employee_by_email(db: Session, email: str):
    return db.query(models.Employee).filter(models.Employee.email == email).first()

def get_employees(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(models.Employee)
    if search:
        query = query.filter(
            models.Employee.name.ilike(f"%{search}%") | 
            models.Employee.department.ilike(f"%{search}%") | 
            models.Employee.designation.ilike(f"%{search}%")
        )
    return query.offset(skip).limit(limit).all()

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    db_employee = models.Employee(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def update_employee(db: Session, employee_id: int, employee: schemas.EmployeeUpdate):
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None
    for key, value in employee.model_dump(exclude_unset=True).items():
        setattr(db_employee, key, value)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def delete_employee(db: Session, employee_id: int):
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return False
    db.delete(db_employee)
    db.commit()
    return True

# --- Sale CRUD ---
def get_sale(db: Session, sale_id: int):
    return db.query(models.Sale).filter(models.Sale.id == sale_id).first()

def get_sales(db: Session, skip: int = 0, limit: int = 100):
    # Query sales and load their associated products
    sales = db.query(models.Sale).offset(skip).limit(limit).all()
    for s in sales:
        s.product_name = s.product.product_name if s.product else "Unknown Product"
    return sales

def create_sale(db: Session, sale: schemas.SaleCreate):
    product = get_product(db, sale.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.quantity < sale.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient inventory. Only {product.quantity} units available."
        )

    # Calculate sale amount if not specified
    sale_amount = sale.amount if sale.amount is not None else product.price * sale.quantity

    db_sale = models.Sale(
        product_id=sale.product_id,
        quantity=sale.quantity,
        amount=sale_amount,
        sale_date=sale.sale_date or datetime.datetime.utcnow()
    )

    # Deduct product quantity from inventory
    product.quantity -= sale.quantity

    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    
    # Attach product name for response
    db_sale.product_name = product.product_name
    return db_sale

def update_sale(db: Session, sale_id: int, sale: schemas.SaleUpdate):
    db_sale = get_sale(db, sale_id)
    if not db_sale:
        return None

    # Handle product quantity adjustments if quantity/product changes
    old_product_id = db_sale.product_id
    old_quantity = db_sale.quantity

    new_product_id = sale.product_id if sale.product_id is not None else old_product_id
    new_quantity = sale.quantity if sale.quantity is not None else old_quantity

    product = get_product(db, new_product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if new_product_id == old_product_id:
        # Same product, adjust inventory based on difference
        diff = new_quantity - old_quantity
        if product.quantity < diff:
            raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {product.quantity}")
        product.quantity -= diff
    else:
        # Different products, restore old product stock, deduct from new product stock
        old_product = get_product(db, old_product_id)
        if old_product:
            old_product.quantity += old_quantity
        if product.quantity < new_quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for new product. Available: {product.quantity}")
        product.quantity -= new_quantity

    # Update values
    for key, value in sale.model_dump(exclude_unset=True).items():
        setattr(db_sale, key, value)

    # Recalculate amount if quantity changed but amount was not updated
    if sale.quantity is not None and sale.amount is None:
        db_sale.amount = product.price * new_quantity

    db.commit()
    db.refresh(db_sale)
    db_sale.product_name = product.product_name
    return db_sale

def delete_sale(db: Session, sale_id: int):
    db_sale = get_sale(db, sale_id)
    if not db_sale:
        return False
    
    # Restore product inventory when a sale is deleted
    product = get_product(db, db_sale.product_id)
    if product:
        product.quantity += db_sale.quantity

    db.delete(db_sale)
    db.commit()
    return True

# --- Expense CRUD ---
def get_expense(db: Session, expense_id: int):
    return db.query(models.Expense).filter(models.Expense.id == expense_id).first()

def get_expenses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Expense).offset(skip).limit(limit).all()

def create_expense(db: Session, expense: schemas.ExpenseCreate):
    db_expense = models.Expense(
        category=expense.category,
        amount=expense.amount,
        description=expense.description,
        expense_date=expense.expense_date or datetime.datetime.utcnow()
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def update_expense(db: Session, expense_id: int, expense: schemas.ExpenseUpdate):
    db_expense = get_expense(db, expense_id)
    if not db_expense:
        return None
    for key, value in expense.model_dump(exclude_unset=True).items():
        setattr(db_expense, key, value)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def delete_expense(db: Session, expense_id: int):
    db_expense = get_expense(db, expense_id)
    if not db_expense:
        return False
    db.delete(db_expense)
    db.commit()
    return True
