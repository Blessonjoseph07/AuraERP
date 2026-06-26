from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, auth
from collections import defaultdict

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Summary"])

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_employee)
):
    # Total counts
    total_products = db.query(func.count(models.Product.id)).scalar() or 0
    total_employees = db.query(func.count(models.Employee.id)).scalar() or 0
    total_sales = db.query(func.sum(models.Sale.amount)).scalar() or 0.0
    
    # Hide details of expenses from ordinary employees, return 0 or calculate only for managers
    is_manager = current_user.role in ["Admin", "Manager"]
    total_expenses = 0.0
    if is_manager:
        total_expenses = db.query(func.sum(models.Expense.amount)).scalar() or 0.0

    low_stock_count = db.query(func.count(models.Product.id)).filter(models.Product.quantity < 10).scalar() or 0

    # Monthly trends (combine sales & expenses)
    is_sqlite = db.bind.dialect.name == "sqlite"
    
    if is_sqlite:
        sale_month = func.strftime("%Y-%m", models.Sale.sale_date)
        expense_month = func.strftime("%Y-%m", models.Expense.expense_date)
    else:
        sale_month = func.to_char(models.Sale.sale_date, "YYYY-MM")
        expense_month = func.to_char(models.Expense.expense_date, "YYYY-MM")

    # Fetch sales by month
    sales_query = db.query(
        sale_month.label("month"),
        func.sum(models.Sale.amount).label("sales")
    ).group_by("month").all()

    # Fetch expenses by month (restricted to managers, otherwise return empty)
    expenses_query = []
    if is_manager:
        expenses_query = db.query(
            expense_month.label("month"),
            func.sum(models.Expense.amount).label("expenses")
        ).group_by("month").all()

    # Merge monthly trends
    monthly_data = defaultdict(lambda: {"sales": 0.0, "expenses": 0.0})
    for r in sales_query:
        if r.month:
            monthly_data[r.month]["sales"] = float(r.sales or 0)
    for r in expenses_query:
        if r.month:
            monthly_data[r.month]["expenses"] = float(r.expenses or 0)

    # Convert to sorted list
    trend_chart = []
    for month in sorted(monthly_data.keys()):
        trend_chart.append({
            "month": month,
            "sales": monthly_data[month]["sales"],
            "expenses": monthly_data[month]["expenses"]
        })

    # If trend_chart is empty, seed with current month to prevent empty charts
    if not trend_chart:
        import datetime
        curr = datetime.datetime.now().strftime("%Y-%m")
        trend_chart.append({"month": curr, "sales": 0.0, "expenses": 0.0})

    # Inventory distribution by category
    category_query = db.query(
        models.Product.category,
        func.count(models.Product.id).label("count"),
        func.sum(models.Product.quantity).label("stock")
    ).group_by(models.Product.category).all()

    category_dist = [
        {
            "category": r.category or "Other",
            "count": r.count or 0,
            "stock": int(r.stock or 0)
        }
        for r in category_query
    ]

    return {
        "stats": {
            "total_products": total_products,
            "total_employees": total_employees,
            "total_sales": float(total_sales),
            "total_expenses": float(total_expenses),
            "low_stock_count": low_stock_count
        },
        "monthly_trend": trend_chart,
        "category_distribution": category_dist
    }
