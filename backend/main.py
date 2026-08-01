from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
import database
import ml_models

from routers import auth, students, teachers, courses, attendance, assignments, analytics, notifications, admin

# ── Create all DB tables ──────────────────────────────────────────────
models.Base.metadata.create_all(bind=database.engine)

# ── FastAPI App ───────────────────────────────────────────────────────
app = FastAPI(
    title="AcademiQ API",
    description="AI-Powered Academic Analytics & Course Management System",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

import os

# ── CORS ─────────────────────────────────────────────────────────────
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://academiq-frontend-7xve.onrender.com",
    "https://academiq-frontend.onrender.com",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
def add_cors_headers_fallback(request, call_next):
    origin = request.headers.get("origin")
    if request.method == "OPTIONS":
        from fastapi.responses import Response
        response = Response(status_code=200)
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "*"
        return response

    response = call_next(request)
    if origin and "Access-Control-Allow-Origin" not in response.headers:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# ── Include Routers ───────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(teachers.router)
app.include_router(courses.router)
app.include_router(attendance.router)
app.include_router(assignments.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(admin.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "app": "AcademiQ API v2.0",
        "docs": "/docs",
        "ml_trained": ml_models.ai_engine.is_trained,
        "ml_accuracy": f"{ml_models.ai_engine.risk_accuracy * 100:.1f}%",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "database": "connected", "ai_engine": "active"}
