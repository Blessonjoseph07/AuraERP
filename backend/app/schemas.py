from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "Employee"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductBase(BaseModel):
    product_name: str
    category: str
    quantity: int = Field(default=0, ge=0)
    price: float = Field(default=0.0, ge=0.0)
    supplier: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = Field(default=None, ge=0)
    price: Optional[float] = Field(default=None, ge=0.0)
    supplier: Optional[str] = None

class ProductOut(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Employee Schemas ---
class EmployeeBase(BaseModel):
    name: str
    department: str
    designation: str
    email: EmailStr
    leave_balance: int = Field(default=20, ge=0)

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[EmailStr] = None
    leave_balance: Optional[int] = Field(default=None, ge=0)

class EmployeeOut(EmployeeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Sale Schemas ---
class SaleBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    amount: float = Field(..., ge=0.0)
    sale_date: Optional[datetime] = None

class SaleCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    # Amount is computed automatically on creation based on product price if not provided
    amount: Optional[float] = None
    sale_date: Optional[datetime] = None

class SaleUpdate(BaseModel):
    product_id: Optional[int] = None
    quantity: Optional[int] = Field(default=None, gt=0)
    amount: Optional[float] = Field(default=None, ge=0.0)
    sale_date: Optional[datetime] = None

class SaleOut(SaleBase):
    id: int
    sale_date: datetime
    product_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Expense Schemas ---
class ExpenseBase(BaseModel):
    category: str
    amount: float = Field(..., ge=0.0)
    description: Optional[str] = None
    expense_date: Optional[datetime] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = Field(default=None, ge=0.0)
    description: Optional[str] = None
    expense_date: Optional[datetime] = None

class ExpenseOut(ExpenseBase):
    id: int
    expense_date: datetime

    class Config:
        from_attributes = True

# --- AI & RAG Schemas ---
class ChatQuery(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    generated_sql: Optional[str] = None
    sql_results: Optional[List[dict]] = None

class DocChatResponse(BaseModel):
    response: str
    sources: List[str]

class ReportSummaryResponse(BaseModel):
    summary: str
    generated_at: datetime
