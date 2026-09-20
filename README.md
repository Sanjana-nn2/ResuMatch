# ResuMatch — AI Resume-to-Job-Description Match & Gap Analyzer
> **Packaged as a production Android app via Capacitor** and powered by a dual-service Node.js + Python NLP microservice architecture.

[![CI Pipeline](https://github.com/minchu/resumatch/actions/workflows/ci.yml/badge.svg)](https://github.com/minchu/resumatch/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Android](https://img.shields.io/badge/Platform-Android%20%7C%20Google%20Play-3DDC84.svg?logo=android&logoColor=white)](https://play.google.com)
[![Python](https://img.shields.io/badge/NLP-sentence--transformers%20%7C%20spaCy-3776AB.svg?logo=python&logoColor=white)](https://fastapi.tiangolo.com)
[![Node](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015-4169E1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)

---

## The Problem It Solves
Job seekers manually reword their resumes for every job description, guessing which keywords and competencies actually matter to Applicant Tracking Systems (ATS) and hiring teams. Most free ATS tools perform naive exact string matching, failing to capture semantic meaning or contextual equivalence.

**ResuMatch** solves this by evaluating resumes against job descriptions using **real 384-dimensional dense semantic embeddings** (`sentence-transformers/all-MiniLM-L6-v2`) combined with Named Entity Recognition (spaCy NER). It delivers:
- An accurate semantic match score (0–100%) and cosine similarity rating.
- A categorized keyword diff (matched competencies vs. critical missing skills).
- Concrete, actionable resume revision recommendations.
- Auto-generated technical interview questions targeting the candidate's exact keyword gaps.
- Resume version comparison ($v1$ vs. $v2$) to measure improvement deltas before submitting an application.
- One-click downloadable PDF summary reports.

Packaged as an installable native Android application via Capacitor, ResuMatch delivers mobile-first touch ergonomics (touch targets $\ge 48\text{dp}$, camera/file upload flows, and swipeable tabs). Packaging via Capacitor is a common, battle-tested hybrid approach employed by companies like Instagram and Twitter/X to achieve native app distribution with shared web engines.

---

## System Architecture

```
                      ┌────────────────────────────────────────┐
                      │          Android Mobile Device         │
                      │  (Capacitor Native Shell + WebView)    │
                      └──────────────────┬─────────────────────┘
                                         │ HTTPS REST / JSON
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Node.js / Express API         │
                      │       (Port 5000 - Orchestrator)       │
                      │  - JWT Authentication                  │
                      │  - File Upload & PDF/DOCX Parsing      │
                      │  - Business Logic & History Dashboard  │
                      │  - PDF Report Generator (PDFKit)       │
                      │  - System Observability & Telemetry    │
                      └───────────┬────────────────┬───────────┘
          Internal HTTP (JSON)    │                │  SQL (pg pool)
                                  ▼                ▼
    ┌───────────────────────────────┐   ┌───────────────────────────┐
    │    Python FastAPI Microservice │   │    PostgreSQL Database    │
    │     (Port 8000 - NLP Engine)   │   │  - Users & Resumes        │
    │  - sentence-transformers       │   │  - Job Descriptions       │
    │    (all-MiniLM-L6-v2)         │   │  - Analyses & Gap Metrics │
    │  - spaCy NER / Keyword Extr.  │   │  - Telemetry & Logs       │
    │  - Cosine Semantic Similarity │   └───────────────────────────┘
    └───────────────────────────────┘
```

### Why a Dual-Service (Node + Python) Architecture?
- **Separation of Concerns**: Python is the unrivaled ecosystem for machine learning and natural language processing (`sentence-transformers`, `PyTorch`, `spaCy`, `NumPy`), while Node.js excels at high-concurrency asynchronous I/O, file ingestion, session authentication, and relational data orchestration.
- **Independent Scaling & Resource Optimization**: Embedding calculation is CPU/GPU-bound and memory-heavy (~150MB–800MB model weights). Authentication and CRUD queries are I/O-bound (~50MB RAM). Decoupling them allows the ML service to be scaled horizontally or allocated compute-optimized instances without wasting compute on routine CRUD traffic.
- **Frontend Isolation**: The React/Capacitor mobile client communicates solely with the Node API. The Python microservice is completely isolated within an internal network boundary, enhancing API security and payload validation.

---

## Database Schema Highlights

The PostgreSQL database (`database/schema.sql`) implements:
- **UUID Primary Keys**: Eliminates enumeration vulnerabilities and enables clean distributed data modeling.
- **JSONB Document Storage**: Stores extracted skill taxonomies, recommendations, and interview probe cards, combining relational data integrity with unstructured document flexibility.
- **Targeted Indexes**: B-Tree indexes on `user_id`, timestamps, and match scores maintain sub-50ms query latencies for user trend analytics.

---

## Quick Start with Docker Compose

Run all three services (Postgres, Python ML microservice, and Node backend) with a single command:

```bash
# Clone the repository
git clone https://github.com/minchu/resumatch.git
cd resumatch

# Launch containers
docker compose up --build
```

The services will initialize and become available at:
- **Node.js API**: `http://localhost:5000` (Health check: `http://localhost:5000/health`)
- **Python ML Service**: `http://localhost:8000` (Swagger docs: `http://localhost:8000/docs`)
- **PostgreSQL**: `localhost:5432` (Database: `resumatch`)

To start the React frontend locally:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to test the mobile-first UI in your browser or responsive emulator.

---

## API Documentation

### Node.js Backend Endpoints (`http://localhost:5000`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account with email & password | No |
| `POST` | `/api/auth/login` | Authenticate and retrieve JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer) |
| `POST` | `/api/resumes/upload` | Parse PDF/DOCX or text into clean tokens | Optional |
| `POST` | `/api/analyze/match` | Full semantic match & keyword gap analysis | Optional |
| `POST` | `/api/analyze/compare`| Resume $v1$ vs. $v2$ version comparison delta | Optional |
| `POST` | `/api/analyze/demo` | 10-second instant recruiter demo (rate-limited) | No |
| `GET` | `/api/analyze/history`| Historical match scores & time-series data | Yes (Bearer) |
| `POST` | `/api/reports/generate-pdf`| Export downloadable PDF gap report | Optional |
| `GET` | `/api/admin/metrics` | System observability & endpoint telemetry | No |

---

## Packaging as an Android App via Capacitor

1. Build the production React web bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Initialize and sync Capacitor native Android shell:
   ```bash
   npx cap add android
   npx cap sync android
   ```
3. Open in Android Studio to run on an emulator or physical device:
   ```bash
   npx cap open android
   ```

---

## License
Distributed under the MIT License. See `LICENSE` for more information.
