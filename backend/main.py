import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app import models, crud, schemas
from app.routers import auth, inventory, employees, sales, finance, dashboard, ai

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartERP – AI-Powered ERP API",
    description="Backend API for managing products, employees, sales, expenses, and AI services",
    version="1.0.0"
)

# Enable CORS for frontend web interface
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(inventory.router)
app.include_router(employees.router)
app.include_router(sales.router)
app.include_router(finance.router)
app.include_router(dashboard.router)
app.include_router(ai.router)

def seed_database():
    db = SessionLocal()
    try:
        # 1. Seed Users if database is empty
        if db.query(models.User).count() == 0:
            print("Seeding users...")
            # Seed Admin
            crud.create_user(db, schemas.UserCreate(
                username="admin",
                email="admin@smarterp.com",
                password="admin123",
                role="Admin"
            ))
            # Seed Manager
            crud.create_user(db, schemas.UserCreate(
                username="manager",
                email="manager@smarterp.com",
                password="manager123",
                role="Manager"
            ))
            # Seed Employee
            crud.create_user(db, schemas.UserCreate(
                username="employee",
                email="employee@smarterp.com",
                password="employee123",
                role="Employee"
            ))

        # 2. Seed Products
        if db.query(models.Product).count() == 0:
            print("Seeding products...")
            products = [
                models.Product(product_name="Pro Laptop 15", category="Electronics", quantity=15, price=999.99, supplier="TechDistributor"),
                models.Product(product_name="Office Ergonomic Chair", category="Furniture", quantity=4, price=149.99, supplier="OfficeComfort"), # Low stock
                models.Product(product_name="Standing Desk Large", category="Furniture", quantity=12, price=299.99, supplier="OfficeComfort"),
                models.Product(product_name="4K UltraWide Monitor", category="Electronics", quantity=8, price=249.99, supplier="TechDistributor"), # Low stock
                models.Product(product_name="Wireless Keyboard & Mouse", category="Accessories", quantity=45, price=49.99, supplier="LogiWholesale"),
                models.Product(product_name="Mechanical Keyboard", category="Accessories", quantity=6, price=89.99, supplier="LogiWholesale"), # Low stock
                models.Product(product_name="ANC Wireless Headphones", category="Accessories", quantity=25, price=119.99, supplier="LogiWholesale"),
                models.Product(product_name="USB-C Dual Docking Station", category="Electronics", quantity=3, price=179.99, supplier="TechDistributor"), # Low stock
                models.Product(product_name="Desk LED Smart Lamp", category="Furniture", quantity=32, price=39.99, supplier="LumeLighting"),
                models.Product(product_name="Enterprise Cloud SaaS Sub", category="Software", quantity=120, price=15.00, supplier="AuraCloud Ltd")
            ]
            db.add_all(products)
            db.commit()
 
        # 3. Seed Employees
        if db.query(models.Employee).count() == 0:
            print("Seeding employees...")
            employees = [
                models.Employee(name="John Doe", department="Engineering", designation="Senior Developer", email="john@smarterp.com", leave_balance=14),
                models.Employee(name="Alice Smith", department="HR", designation="HR Manager", email="alice@smarterp.com", leave_balance=20),
                models.Employee(name="Bob Johnson", department="Sales", designation="Account Executive", email="bob@smarterp.com", leave_balance=8),
                models.Employee(name="Sarah Connor", department="Operations", designation="Operations Specialist", email="sarah@smarterp.com", leave_balance=18),
                models.Employee(name="Michael Scott", department="Sales", designation="Regional Sales Manager", email="michael@smarterp.com", leave_balance=15),
                models.Employee(name="Dwight Schrute", department="Sales", designation="Assistant to Regional Manager", email="dwight@smarterp.com", leave_balance=20),
                models.Employee(name="Pam Beesly", department="Administration", designation="Office Administrator", email="pam@smarterp.com", leave_balance=12),
                models.Employee(name="Jim Halpert", department="Sales", designation="Senior Account Agent", email="jim@smarterp.com", leave_balance=10)
            ]
            db.add_all(employees)
            db.commit()
 
        # 4. Seed Sales
        if db.query(models.Sale).count() == 0:
            print("Seeding sales...")
            # Fetch products to link
            laptops = db.query(models.Product).filter(models.Product.product_name == "Pro Laptop 15").first()
            mice = db.query(models.Product).filter(models.Product.product_name == "Wireless Keyboard & Mouse").first()
            desks = db.query(models.Product).filter(models.Product.product_name == "Standing Desk Large").first()
            headphones = db.query(models.Product).filter(models.Product.product_name == "ANC Wireless Headphones").first()
            keyboards = db.query(models.Product).filter(models.Product.product_name == "Mechanical Keyboard").first()
            monitors = db.query(models.Product).filter(models.Product.product_name == "4K UltraWide Monitor").first()
            saas = db.query(models.Product).filter(models.Product.product_name == "Enterprise Cloud SaaS Sub").first()
            
            today = datetime.datetime.utcnow()
            
            sales = []
            if laptops:
                sales.append(models.Sale(product_id=laptops.id, quantity=2, amount=1999.98, sale_date=today - datetime.timedelta(days=28)))
                sales.append(models.Sale(product_id=laptops.id, quantity=1, amount=999.99, sale_date=today - datetime.timedelta(days=15)))
                sales.append(models.Sale(product_id=laptops.id, quantity=3, amount=2999.97, sale_date=today - datetime.timedelta(days=2)))
            if mice:
                sales.append(models.Sale(product_id=mice.id, quantity=5, amount=249.95, sale_date=today - datetime.timedelta(days=20)))
                sales.append(models.Sale(product_id=mice.id, quantity=10, amount=499.90, sale_date=today - datetime.timedelta(days=10)))
                sales.append(models.Sale(product_id=mice.id, quantity=2, amount=99.98, sale_date=today - datetime.timedelta(days=4)))
            if desks:
                sales.append(models.Sale(product_id=desks.id, quantity=2, amount=599.98, sale_date=today - datetime.timedelta(days=25)))
                sales.append(models.Sale(product_id=desks.id, quantity=1, amount=299.99, sale_date=today - datetime.timedelta(days=8)))
            if headphones:
                sales.append(models.Sale(product_id=headphones.id, quantity=3, amount=359.97, sale_date=today - datetime.timedelta(days=18)))
                sales.append(models.Sale(product_id=headphones.id, quantity=2, amount=239.98, sale_date=today - datetime.timedelta(days=7)))
            if keyboards:
                sales.append(models.Sale(product_id=keyboards.id, quantity=4, amount=359.96, sale_date=today - datetime.timedelta(days=22)))
            if monitors:
                sales.append(models.Sale(product_id=monitors.id, quantity=1, amount=249.99, sale_date=today - datetime.timedelta(days=14)))
                sales.append(models.Sale(product_id=monitors.id, quantity=2, amount=499.98, sale_date=today - datetime.timedelta(days=3)))
            if saas:
                sales.append(models.Sale(product_id=saas.id, quantity=30, amount=450.00, sale_date=today - datetime.timedelta(days=24)))
                sales.append(models.Sale(product_id=saas.id, quantity=15, amount=225.00, sale_date=today - datetime.timedelta(days=9)))
 
            db.add_all(sales)
            db.commit()
 
        # 5. Seed Expenses
        if db.query(models.Expense).count() == 0:
            print("Seeding expenses...")
            today = datetime.datetime.utcnow()
            expenses = [
                models.Expense(category="Rent", amount=1500.00, description="Monthly office space rent", expense_date=today - datetime.timedelta(days=25)),
                models.Expense(category="Cloud Services", amount=240.00, description="AWS hosting server costs", expense_date=today - datetime.timedelta(days=22)),
                models.Expense(category="Office Supplies", amount=120.00, description="Printer ink cartridges and copy paper", expense_date=today - datetime.timedelta(days=18)),
                models.Expense(category="Marketing", amount=500.00, description="Google AdWords campaign budget", expense_date=today - datetime.timedelta(days=14)),
                models.Expense(category="Travel", amount=350.00, description="Travel allowances for Sales client meetup", expense_date=today - datetime.timedelta(days=12)),
                models.Expense(category="Utilities", amount=180.00, description="High-speed commercial fiber internet and electricity billing", expense_date=today - datetime.timedelta(days=9)),
                models.Expense(category="Software Utilities", amount=95.00, description="Slack and Zoom team communication licenses", expense_date=today - datetime.timedelta(days=8)),
                models.Expense(category="Marketing", amount=300.00, description="LinkedIn recruitment ads", expense_date=today - datetime.timedelta(days=6)),
                models.Expense(category="Office Supplies", amount=45.00, description="Coffee beans, tea, and kitchen snacks", expense_date=today - datetime.timedelta(days=5)),
                models.Expense(category="Hardware", amount=450.00, description="Backup external solid state drives", expense_date=today - datetime.timedelta(days=3))
            ]
            db.add_all(expenses)
            db.commit()

        print("Database seeded successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    seed_database()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "SmartERP – AI-Powered ERP System API",
        "docs_url": "/docs"
    }
