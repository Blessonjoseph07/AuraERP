# AuraERP - Project Architecture & Manifest Documentation

Welcome to the documentation for **AuraERP**, a production-ready, lightweight, AI-powered ERP web application designed for small businesses. This file acts as a complete index and architecture map of the codebase, detailing what has been included, how modules connect, and outlining ideas for high-value future extensions.

---

## 1. Technical Stack Overview

AuraERP is dockerized and structured into three primary layers:
1. **Frontend**: React (Vite-powered single-page application) styled with **Tailwind CSS** and custom vanilla CSS variables for the light cyberdeck cream & terracotta glassmorphism theme.
2. **Backend**: **FastAPI** (Python 3.10) for high-performance REST APIs, structured using SQLAlchemy ORM.
3. **Database & Vector Storage**: 
   - **PostgreSQL 15** for relational ERP business data (Auth, Inventory, Employees, Sales, Finance).
   - **ChromaDB** for vector document embeddings to drive RAG (Retrieval-Augmented Generation) document search.
   - **Google Gemini API** (or OpenRouter free endpoints) for Text-to-SQL conversions, conversational queries, executive summaries, and multimodal PDF/document reasoning.

---

## 2. Directory Structure & Key Code Files

Click on the links below to open and review individual files in the project workspace:

### 📂 Configuration & Infrastructure
- 📄 [docker-compose.yml](file:///d:/Internship%20project/docker-compose.yml): Coordinates container orchestrations for Postgres (`smarterp-db`), FastAPI (`smarterp-backend`), and React/Nginx (`smarterp-frontend`).
- 📄 [.env](file:///d:/Internship%20project/.env): Stores database connection URLs, API keys (Gemini/OpenRouter), and authentication secret tokens.

### 📂 Backend API Codebase (`/backend`)
- 📄 [backend/Dockerfile](file:///d:/Internship%2520project/backend/Dockerfile): Container builds Python environment and installs dependencies.
- 📄 [backend/app/main.py](file:///d:/Internship%2520project/backend/app/main.py): Initializes the FastAPI app, mounts CORS middleware, and binds the router routes.
- 📄 [backend/app/models.py](file:///d:/Internship%2520project/backend/app/models.py): Declares the relational database tables in PostgreSQL.
- 📄 [backend/app/schemas.py](file:///d:/Internship%2520project/backend/app/schemas.py): Pydantic models for request body validation and response serialization.
- 📄 [backend/app/database.py](file:///d:/Internship%2520project/backend/app/database.py): Configures SQLAlchemy session bindings and db transaction yields.
- 📄 [backend/app/config.py](file:///d:/Internship%2520project/backend/app/config.py): Parses environmental properties.
- 📄 [backend/app/crud.py](file:///d:/Internship%2520project/backend/app/crud.py): Core database logic (creates, queries, edits records).
- 📄 [backend/app/ai.py](file:///d:/Internship%2520project/backend/app/ai.py): Houses SQL generation context (Text-to-SQL), safe execution filters, and executive summary writer templates.
- 📄 [backend/app/vector_db.py](file:///d:/Internship%2520project/backend/app/vector_db.py): Indexes PDFs, extracts text chunks, embeds via Gemini, and runs vector retrieval in ChromaDB.

#### Backend Router Modules (`/backend/app/routers`)
- 📄 [backend/app/routers/auth.py](file:///d:/Internship%2520project/backend/app/routers/auth.py): Handles registration, password hashing (bcrypt), login JWT issuances, and user permission levels.
- 📄 [backend/app/routers/ai.py](file:///d:/Internship%2520project/backend/app/routers/ai.py): Mounts chat endpoints, executive summary triggers, document upload, and document QA.
- 📄 [backend/app/routers/inventory.py](file:///d:/Internship%2520project/backend/app/routers/inventory.py): Handles product storage, supplier logs, and warehouse statistics.
- 📄 [backend/app/routers/employees.py](file:///d:/Internship%2520project/backend/app/routers/employees.py): Manages profile details and tracks remaining leave balances.
- 📄 [backend/app/routers/sales.py](file:///d:/Internship%2520project/backend/app/routers/sales.py): Logs transaction invoices and links them to product IDs to update stock levels.
- 📄 [backend/app/routers/finance.py](file:///d:/Internship%2520project/backend/app/routers/finance.py): Tracks operational expenditures and categories.
- 📄 [backend/app/routers/dashboard.py](file:///d:/Internship%2520project/backend/app/routers/dashboard.py): Computes summary aggregates across all departments.

### 📂 Frontend Codebase (`/frontend`)
- 📄 [frontend/package.json](file:///d:/Internship%2520project/frontend/package.json): Lists Node.js dependencies and Vite build scripts.
- 📄 [frontend/tailwind.config.js](file:///d:/Internship%2520project/frontend/tailwind.config.js): Theme customizations (color schemes, custom fonts).
- 📄 [frontend/src/index.css](file:///d:/Internship%2520project/frontend/src/index.css): Main stylesheet with custom animations, glassmorphism utilities, and interior global overrides.

#### Reusable React Components (`/frontend/src/components`)
- 📄 [frontend/src/components/AsciiGrid.jsx](file:///d:/Internship%2520project/frontend/src/components/AsciiGrid.jsx): Handles the interactive bold sand-colored background console, displaying wave animations, mouse hover triggers, and bubble morphing.
- 📄 [frontend/src/components/FloatingBlob.jsx](file:///d:/Internship%2520project/frontend/src/components/FloatingBlob.jsx): Compiles three overlapping morphing circles styled as wobbly frosted glass.
- 📄 [frontend/src/components/Sidebar.jsx](file:///d:/Internship%2520project/frontend/src/components/Sidebar.jsx): Navigation drawer connecting modules.
- 📄 [frontend/src/components/Navbar.jsx](file:///d:/Internship%2520project/frontend/src/components/Navbar.jsx): Header bar showing current section and logged-in user profile details.
- 📄 [frontend/src/components/ProtectedRoute.jsx](file:///d:/Internship%2520project/frontend/src/components/ProtectedRoute.jsx): Route guard ensuring login credentials and verifying roles.

#### View Pages (`/frontend/src/pages`)
- 📄 [frontend/src/pages/Login.jsx](file:///d:/Internship%2520project/frontend/src/pages/Login.jsx): Fully transparent form card centered over the wobbly glass blob and ASCII grid.
- 📄 [frontend/src/pages/Register.jsx](file:///d:/Internship%2520project/frontend/src/pages/Register.jsx): User creation console with transparent cards and inputs.
- 📄 [frontend/src/pages/Dashboard.jsx](file:///d:/Internship%2520project/frontend/src/pages/Dashboard.jsx): Displays system metrics, status tallies, and action widgets in cream glass cards.
- 📄 [frontend/src/pages/Inventory.jsx](file:///d:/Internship%2520project/frontend/src/pages/Inventory.jsx): Stocks log displaying warehouse levels and reorder warnings.
- 📄 [frontend/src/pages/Employees.jsx](file:///d:/Internship%2520project/frontend/src/pages/Employees.jsx): HR list and team profile details.
- 📄 [frontend/src/pages/Sales.jsx](file:///d:/Internship%2520project/frontend/src/pages/Sales.jsx): Invoice portal and revenue graph charts.
- 📄 [frontend/src/pages/Finance.jsx](file:///d:/Internship%2520project/frontend/src/pages/Finance.jsx): Tracks cost centers and operating expenses.
- 📄 [frontend/src/pages/AIAssistant.jsx](file:///d:/Internship%2520project/frontend/src/pages/AIAssistant.jsx): AI Control Panel enabling natural database chats (Text-to-SQL), one-click executive report writing (PDF downloads supported), and PDF document RAG search.

---

## 3. Database Schema Models

AuraERP leverages a relational model in PostgreSQL to track transactions, stocks, profiles, and costs:

```mermaid
erDiagram
    users {
        int id PK
        string username UNIQUE
        string email UNIQUE
        string hashed_password
        string role
        timestamp created_at
    }
    products {
        int id PK
        string product_name
        string category
        int quantity
        float price
        string supplier
        timestamp created_at
    }
    employees {
        int id PK
        string name
        string department
        string designation
        string email UNIQUE
        int leave_balance
        timestamp created_at
    }
    sales {
        int id PK
        int product_id FK
        int quantity
        float amount
        timestamp sale_date
    }
    expenses {
        int id PK
        string category
        float amount
        string description
        timestamp expense_date
    }
    products ||--o{ sales : "ordered in"
```

---

## 4. Visual Design System & Aesthetics

AuraERP is designed around a **cyberdeck cream glassmorphic system**, creating a professional and premium visual identity:
* **Color Palette**: 
  - Background: Warm light cream (`#eae4d9`) matching user reference imagery.
  - Accent Color: Terracotta/burnt rust orange (`#c85a32`/`#d9734e`).
  - Text: Dark slate (`#0f172a` / `#1e293b`).
* **Frosted Glassmorphism**: Cards (`.glass-card`) and the background wobbly blob (`.blob-glass-backplate`) employ custom transparent white gradients, high backdrop blurs (`32px`), and reflective inset drop shadows, letting colors and shapes blend organically.
* **Canvas ASCII Grid background**: [AsciiGrid.jsx](file:///d:/Internship%20project/frontend/src/components/AsciiGrid.jsx) renders a structured character console in bold sand-terracotta characters (`rgba(184, 107, 74, 0.22)`). As characters cross underneath the wobbly glass blob, they morph cleanly into liquid bubbles (`o`, `•`, `°`, `*`) and change to a warm frosted gold color. Hovering lights up margins in rust-orange.

---

## 5. Practical & Unique Feature Recommendations

To further elevate AuraERP, we can introduce the following highly practical and unique features:

### 💡 1. AI OCR Receipt & Invoice Scanner (Multi-Modal Logging)
- **Concept**: Allow users to drag-and-drop or take a picture of an expense receipt (JPG, PNG, PDF) directly into the Finance module.
- **AI Integration**: The FastAPI backend routes the image file to Gemini 2.0 Flash, instructing it to extract the transaction date, vendor name, category, and total amount in a strict JSON format.
- **Value**: Eliminates manual expense typing. Users upload a restaurant or utility invoice, and AuraERP automatically logs it as an active expense transaction in PostgreSQL in real-time.

### 💡 2. Proactive AI Anomaly & Fraud Detection
- **Concept**: An analytical background job that scans incoming expenses and sales, flagging potential anomalies.
- **AI Integration**: Triggers Gemini to analyze transactions on a weekly basis, warning administrators about cost spikes (e.g., "Hosting costs increased 150% this month"), duplicate invoices, or unusual purchase sizes.
- **Value**: Protects small businesses from clerical bookkeeping errors or internal fraud automatically.

### 💡 3. Vector-Search Semantic Inventory Matcher
- **Concept**: A search bar in the inventory page that goes beyond exact keyword searches (e.g., searching "wood glue" finds "adhesives" or "bonding tape").
- **AI Integration**: Embed product descriptions into ChromaDB. When querying, do a vector similarity search to return contextually related products.
- **Value**: Helps employees find appropriate substitutes when a specific material is out of stock.

### 💡 4. Speech-to-Query Voice Assistant
- **Concept**: A microphone button in the AI Assistant tab.
- **AI Integration**: Feeds recorded voice commands through a web speech recognition API, passes the transcribed text to AuraERP's Text-to-SQL pipeline, and reads back the computed answer.
- **Value**: Allows managers to query hands-free (e.g., "What are our total sales today?") on mobile devices.

---

## 6. Full Implementation & Operational Walkthrough

AuraERP operates by bridging a highly responsive, modern React UI to a modular, stateless FastAPI backend over REST API interfaces. 

### 🔄 Data Flow Scenario: AI Database Chat (Text-to-SQL)
1. **Frontend Call**: In [AIAssistant.jsx](file:///d:/Internship%2520project/frontend/src/pages/AIAssistant.jsx), a user types `"What is our total revenue from standing desks?"` and hits send. This calls the backend endpoint `/api/ai/chat` via HTTP POST with the query payload.
2. **Backend Routing**: In [routers/ai.py](file:///d:/Internship%2520project/backend/app/routers/ai.py), the `database_chat()` endpoint receives the request. It injects a PostgreSQL database session and invokes the helper function `query_db_via_ai()` inside [backend/app/ai.py](file:///d:/Internship%2520project/backend/app/ai.py).
3. **Intent Classification & SQL Generation**:
   - The AI module builds a system prompt containing the exact PostgreSQL schema definition (`products`, `employees`, `sales`, `expenses`, `users`).
   - It forwards this context and the user query to **Gemini 2.0 Flash** (or OpenRouter), instructing the model to classify the query as either a generic text message or a read-only database SQL SELECT command.
   - The model returns a structured JSON response. For our example, it generates:
     `SELECT SUM(s.amount) FROM sales s JOIN products p ON s.product_id = p.id WHERE p.product_name ILIKE '%standing desk%'`
4. **SQL Security Sanitization**:
   - The generated SQL query is passed through a security filter `is_sql_safe()` which enforces read-only access (rejects queries containing `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, etc.) to prevent malicious database manipulations.
5. **Database Execution**: The sanitized query is executed against the PostgreSQL instance using SQLAlchemy's connection bindings. It retrieves row tuples representing sales aggregates.
6. **Natural Language Synthesis**: The query result set is mapped to JSON and sent back to Gemini in a secondary prompt, instructing the model to synthesize a conversational, friendly response formatting values in Indian Rupees (e.g. *"Our total sales revenue from standing desks is ₹899.97, comprising 3 orders."*).
7. **Frontend Render**: The API returns the text response and the SQL query to the React page. React updates its state variables to render the response in the chat bubble, and provides an expandable badge letting the user review the generated SQL command for transparency.

---

## 7. The Use of Docker in AuraERP

Docker is leveraged to guarantee environmental consistency, simplify installation, isolate service layers, and automate system deployments.

### 🐳 Why Docker?
- **Zero Local Dependencies**: Users do not need to install Python, Node.js, or PostgreSQL locally. The only requirement is Docker and Docker Compose.
- **Environment Isolation**: Database, API service, and static Web Nginx servers live in separate, sandboxed Linux alpine containers, eliminating configuration clashes.
- **Orchestration Simplicity**: A single YAML script coordinates ports, volume mapping, network bindings, and container initialization orders.

### 🌐 Container Architecture & Networking
Docker Compose sets up an internal network (`internshipproject_default`) enabling container-to-container communication:
1. **`smarterp-db` (Port 5432)**:
   - Image: `postgres:15-alpine`
   - Purpose: Houses relational tables. Persistent data is saved in a managed volume `postgres_data` so data is not lost when containers are turned off.
2. **`smarterp-backend` (Port 8000)**:
   - Image: Built from [/backend/Dockerfile](file:///d:/Internship%2520project/backend/Dockerfile).
   - Purpose: Executes FastAPI, compiles stats, and communicates with Gemini. It communicates with `smarterp-db` internally using the network URI `postgresql://postgres:postgres@db:5432/smarterp`.
3. **`smarterp-frontend` (Port 3000)**:
   - Image: Built from [/frontend/Dockerfile](file:///d:/Internship%2520project/frontend/Dockerfile) using a two-stage build (Vite compiles code to static JS/HTML, and Nginx serves the compiled build on container port 80, mapped to host port 3000).

### 🛠️ Common Docker Commands for Evaluation & Maintenance

Run the following commands in the directory containing `docker-compose.yml`:

- **Spin Up Containers**: Builds container images and starts services in the background:
  ```bash
  docker compose up --build -d
  ```
- **Stop Containers**: Stops all running containers without destroying data:
  ```bash
  docker compose down
  ```
- **View System Logs**: Tails the real-time logging output of all services:
  ```bash
  docker compose logs -f
  ```
- **Reset Database & Re-seed Mock Data (Crucial for Evaluation)**:
  Drops all PostgreSQL volumes and database data, then restarts containers, forcing the database to execute tables creation and seed the fresh, rich evaluation dataset:
  ```bash
  docker compose down -v
  docker compose up --build -d
  ```
