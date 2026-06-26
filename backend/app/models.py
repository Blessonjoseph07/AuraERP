from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Employee")  # Admin, Manager, Employee
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    price = Column(Float, default=0.0, nullable=False)
    supplier = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sales = relationship("Sale", back_populates="product", cascade="all, delete-orphan")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    department = Column(String, index=True, nullable=False)
    designation = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    leave_balance = Column(Integer, default=20, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    sale_date = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="sales")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    expense_date = Column(DateTime, default=datetime.datetime.utcnow)
