import json
import re
import google.generativeai as genai
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from app.config import settings
from app import models

# Configure API
api_configured = False
if settings.openrouter_api_key:
    api_configured = True
elif settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
    api_configured = True

import time
import urllib.error
import urllib.request
import urllib.parse

def call_openrouter(prompt: str, system_prompt: str = None) -> str:
    if not settings.openrouter_api_key:
        raise ValueError("OpenRouter API key is not configured.")

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SmartERP"
    }
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    payload = {
        "model": "openrouter/free",
        "messages": messages
    }
    
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode("utf-8"), 
        headers=headers,
        method="POST"
    )
    
    max_retries = 4
    delay = 2.0
    
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                if "choices" in res_data and len(res_data["choices"]) > 0:
                    return res_data["choices"][0]["message"]["content"]
                else:
                    raise ValueError(f"OpenRouter Error: {json.dumps(res_data)}")
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                retry_after = e.headers.get("Retry-After")
                sleep_time = float(retry_after) if retry_after and retry_after.isdigit() else delay
                print(f"Got 429 from OpenRouter, retrying in {sleep_time} seconds (attempt {attempt + 1}/{max_retries})...")
                time.sleep(sleep_time)
                delay *= 2
            else:
                raise e


# Database schema explanation to feed to Gemini for Text-to-SQL
DB_SCHEMA_PROMPT = """
You are SmartERP's AI Data Analyst. You are given a natural language question and you must generate a SQL query to answer it.
Here is the database schema:

Table 'products':
- id: INTEGER (Primary Key)
- product_name: VARCHAR
- category: VARCHAR
- quantity: INTEGER (Inventory level)
- price: FLOAT (Unit price)
- supplier: VARCHAR

Table 'employees':
- id: INTEGER (Primary Key)
- name: VARCHAR
- department: VARCHAR
- designation: VARCHAR
- email: VARCHAR
- leave_balance: INTEGER (Days remaining)

Table 'sales':
- id: INTEGER (Primary Key)
- product_id: INTEGER (Foreign Key to products.id)
- quantity: INTEGER (Number of items sold)
- amount: FLOAT (Total amount of this transaction)
- sale_date: TIMESTAMP

Table 'expenses':
- id: INTEGER (Primary Key)
- category: VARCHAR
- amount: FLOAT
- description: VARCHAR
- expense_date: TIMESTAMP

Table 'users' (Do not query password hashes):
- id: INTEGER (Primary Key)
- username: VARCHAR
- email: VARCHAR
- role: VARCHAR (Admin, Manager, Employee)

Instructions:
1. Classify the user query. If it requires querying the database, set intent = "SQL" and write a valid SQL query.
2. Ensure the query ONLY uses SELECT. Do not use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or CREATE.
3. PostgreSQL Dialect: We are using PostgreSQL. Use CURRENT_DATE, CURRENT_DATE - INTERVAL 'X days', NOW(), etc. Do NOT use MySQL functions like CURDATE(), NOW() as functions without arguments, or DATE_SUB(). For example, to compare today's date: DATE(s.sale_date) = CURRENT_DATE.
4. If it's a general question, greeting, or thanks that cannot be answered with the database, set intent = "TEXT" and write a direct, warm, friendly, and conversational reply to the user (like Gemini would). Do NOT say "the user did X", speak directly to the user!
5. Return a strict raw JSON object with the following keys:
   {
      "intent": "SQL" or "TEXT",
      "sql": "SELECT ...",
      "explanation": "For SQL intent: A short sentence explaining what this query computes. For TEXT intent: A direct, warm, and friendly conversational response answering the user's message."
   }
Ensure you return ONLY valid, parseable JSON. Do not wrap in ```json ... ``` code blocks.
"""

def is_sql_safe(sql_query: str) -> bool:
    """Verifies that the generated query is read-only (SELECT) and contains no destructive write statements."""
    clean_query = sql_query.strip().lower()
    if not clean_query.startswith("select"):
        return False
    
    # Check for forbidden keywords
    forbidden = ["insert", "update", "delete", "drop", "alter", "create", "truncate", "replace", "grant"]
    for keyword in forbidden:
        # Match as whole word to avoid false positives (e.g. "created_at" matching "create")
        pattern = rf"\b{keyword}\b"
        if re.search(pattern, clean_query):
            return False
            
    return True

def query_db_via_ai(db: Session, user_query: str) -> dict:
    """Detects user intent, generates SQL, queries DB, and synthesizes a natural language response."""
    if not api_configured:
        return {
            "response": "API is not configured. Please add your key to the .env file.",
            "generated_sql": None,
            "sql_results": None
        }

    try:
        if settings.openrouter_api_key:
            response_text = call_openrouter(
                prompt=f"User Question: {user_query}",
                system_prompt=DB_SCHEMA_PROMPT
            ).strip()
        else:
            model = genai.GenerativeModel("gemini-2.0-flash")
            # 1. Ask Gemini for intent classification and SQL generation
            response = model.generate_content(
                f"{DB_SCHEMA_PROMPT}\n\nUser Question: {user_query}"
            )
            response_text = response.text.strip()
        
        # Clean potential markdown wrapping
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Parse AI response
        ai_data = json.loads(response_text)
        
        intent = ai_data.get("intent", "TEXT")
        generated_sql = ai_data.get("sql", None)
        explanation = ai_data.get("explanation", "")

        if intent == "SQL" and generated_sql:
            # Clean statement ending semicolon if present
            sql_clean = generated_sql.strip()
            
            # Security verification
            if not is_sql_safe(sql_clean):
                return {
                    "response": f"I drafted a query, but it failed our security safety filters: '{generated_sql}'",
                    "generated_sql": generated_sql,
                    "sql_results": None
                }

            # 2. Execute SQL query on database
            result = db.execute(text(sql_clean))
            rows = result.fetchall()
            
            # Formulate results into dictionary structure
            keys = result.keys()
            sql_results = [dict(zip(keys, row)) for row in rows]
            
            # 3. Feed query results back to model for natural language response
            synthesis_prompt = f"""
            You are SmartERP's AI assistant. The user asked: "{user_query}"
            We executed the following SQL query to retrieve data:
            `{sql_clean}`
            
            Here are the database results:
            {json.dumps(sql_results, default=str)}
            
            Synthesize this data into a clear, concise, conversational, and helpful natural language response (like Gemini would).
            All monetary values are in Indian Rupees (₹). Format all currency outputs using the ₹ symbol.
            If the list is empty, state clearly that no records match the criteria.
            Keep formatting clean.
            """
            
            if settings.openrouter_api_key:
                synthesis_text = call_openrouter(
                    prompt=synthesis_prompt,
                    system_prompt="You are a helpful data visualizer and operations assistant."
                ).strip()
            else:
                synthesis_response = model.generate_content(synthesis_prompt)
                synthesis_text = synthesis_response.text.strip()
            
            return {
                "response": synthesis_text,
                "generated_sql": sql_clean,
                "sql_results": sql_results
            }
        else:
            # Standard conversational text response
            return {
                "response": explanation or ai_data.get("response", "I'm not sure how to answer that using our database."),
                "generated_sql": None,
                "sql_results": None
            }

    except Exception as e:
        return {
            "response": f"An error occurred while processing your request: {str(e)}",
            "generated_sql": None,
            "sql_results": None
        }

def compile_executive_report(db: Session, report_type: str) -> str:
    """Compiles statistics and asks Gemini to write an executive summary report for sales, inventory, or expenses."""
    if not api_configured:
        return "API is not configured. Cannot generate report."

    try:
        model = None
        if not settings.openrouter_api_key:
            model = genai.GenerativeModel("gemini-2.0-flash")
        
        # Gather structured details from the DB depending on report_type
        if report_type == "sales":
            sales = db.query(models.Sale).order_by(models.Sale.sale_date.desc()).limit(50).all()
            total_sales = db.query(func.sum(models.Sale.amount)).scalar() or 0
            count_sales = db.query(func.count(models.Sale.id)).scalar() or 0
            
            sales_data = [
                {
                    "date": s.sale_date.strftime("%Y-%m-%d"),
                    "product": s.product.product_name if s.product else "Unknown",
                    "quantity": s.quantity,
                    "amount": s.amount
                } for s in sales
            ]
            
            prompt = f"""
            You are a Financial and Sales Analyst at SmartERP.
            Compile an executive Sales Summary Report.
            
            Key Aggregates:
            - Total Revenue: ₹{total_sales:,.2f}
            - Total Number of Orders: {count_sales}
            
            Recent Transactions Data (Up to 50):
            {json.dumps(sales_data, default=str)}
            
            Provide:
            1. An executive overview of performance.
            2. A brief analysis of transaction volume and transaction size.
            3. Actionable recommendations to boost sales.
            Use elegant markdown formatting. Add a neat title and section dividers.
            """
            
        elif report_type == "expenses":
            expenses = db.query(models.Expense).order_by(models.Expense.expense_date.desc()).limit(50).all()
            total_expenses = db.query(func.sum(models.Expense.amount)).scalar() or 0
            count_expenses = db.query(func.count(models.Expense.id)).scalar() or 0
            
            exp_data = [
                {
                    "date": e.expense_date.strftime("%Y-%m-%d"),
                    "category": e.category,
                    "amount": e.amount,
                    "description": e.description
                } for e in expenses
            ]
            
            prompt = f"""
            You are a Chief Financial Officer at SmartERP.
            Compile an executive Expense Summary Report.
            
            Key Aggregates:
            - Total Expenditures: ₹{total_expenses:,.2f}
            - Total Number of Expense Claims: {count_expenses}
            
            Recent Expense Data (Up to 50):
            {json.dumps(exp_data, default=str)}
            
            Provide:
            1. An executive financial summary of operating expenditures.
            2. Analysis of the largest cost centers or spend categories.
            3. Strategic cost-saving proposals.
            Use elegant markdown formatting. Add a neat title and section dividers.
            """
            
        elif report_type == "inventory":
            products = db.query(models.Product).all()
            total_items = sum(p.quantity for p in products)
            total_value = sum(p.quantity * p.price for p in products)
            low_stock = [p for p in products if p.quantity < 10]
            
            prod_data = [
                {
                    "name": p.product_name,
                    "category": p.category,
                    "quantity": p.quantity,
                    "price": p.price,
                    "supplier": p.supplier
                } for p in products
            ]
            
            prompt = f"""
            You are an Operations and Inventory Manager at SmartERP.
            Compile an executive Inventory Summary Report.
            
            Key Aggregates:
            - Total Products in Database: {len(products)}
            - Total Units in Stock: {total_items}
            - Estimated Total Portfolio Value: ₹{total_value:,.2f}
            - Low Stock Items (< 10 units): {[p.product_name for p in low_stock]}
            
            Product Portfolio Data:
            {json.dumps(prod_data, default=str)}
            
            Provide:
            1. Executive overview of warehouse operations.
            2. Stock risk analysis (overstock/understock alerts).
            3. Procurement advice for the low stock list.
            Use elegant markdown formatting. Add a neat title and section dividers.
            """
        else:
            return "Invalid report type specified."

        if settings.openrouter_api_key:
            response_text = call_openrouter(prompt)
        else:
            response = model.generate_content(prompt)
            response_text = response.text.strip()
        return response_text
        
    except Exception as e:
        return f"Failed to generate report: {str(e)}"
