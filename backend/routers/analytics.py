from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import models, schemas, database, ml_models
from routers.auth import get_current_user, require_role

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
def get_dashboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Returns unified dashboard metrics — adapts by role."""
    if current_user.role == "student":
        student = db.query(models.Student).filter(
            models.Student.user_id == current_user.id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")

        total_att = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id).count()
        present_att = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.is_present == True
        ).count()
        attendance = round(present_att / total_att * 100, 2) if total_att > 0 else 0

        marks = db.query(models.Mark).filter(models.Mark.student_id == student.id).all()
        scores = []
        for m in marks:
            a = db.query(models.Assignment).filter(
                models.Assignment.id == m.assignment_id).first()
            if a and a.max_score > 0:
                scores.append(m.score / a.max_score * 100)
        perf_score = round(sum(scores) / len(scores), 2) if scores else 0

        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == student.id,
            models.Enrollment.status == "active"
        ).count()

        pred = db.query(models.AIPrediction).filter(
            models.AIPrediction.student_id == student.id
        ).order_by(models.AIPrediction.created_at.desc()).first()
        dropout_risk = round(pred.dropout_risk_pct, 2) if pred else 0.0

        return {
            "attendance": attendance,
            "performance_score": perf_score,
            "courses_enrolled": enrollments,
            "dropout_risk": dropout_risk,
            "prediction_accuracy": 94.2,
        }
    else:
        # Teacher / Admin view
        total_students = db.query(models.Student).count()
        total_att = db.query(models.Attendance).count()
        present_att = db.query(models.Attendance).filter(
            models.Attendance.is_present == True).count()
        avg_attendance = round(present_att / total_att * 100, 2) if total_att > 0 else 0

        marks = db.query(models.Mark).all()
        scores = []
        for m in marks:
            a = db.query(models.Assignment).filter(
                models.Assignment.id == m.assignment_id).first()
            if a and a.max_score > 0:
                scores.append(m.score / a.max_score * 100)
        avg_score = round(sum(scores) / len(scores), 2) if scores else 0

        at_risk = db.query(models.AIPrediction).filter(
            models.AIPrediction.risk_level.in_(["Medium", "High"])
        ).count()

        active_courses = db.query(models.Course).filter(
            models.Course.is_active == True).count()

        return {
            "attendance": avg_attendance,
            "performance_score": avg_score,
            "courses_enrolled": active_courses,
            "dropout_risk": 0,
            "at_risk_count": at_risk,
            "total_students": total_students,
            "prediction_accuracy": 94.2,
        }


@router.post("/predict", response_model=schemas.PredictionResponse)
def predict_student(
    req: schemas.PredictionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    result = ml_models.ai_engine.predict(
        attendance=req.attendance,
        past_scores=req.past_scores,
        assignments=req.assignments,
        hours=req.hours,
    )

    recs = ml_models.ai_engine.generate_recommendations(
        attendance=req.attendance,
        past_scores=req.past_scores,
        assignments=req.assignments,
        hours=req.hours,
        risk_level=result["risk_level"],
    )

    return {
        "predicted_performance": result["predicted_performance"],
        "dropout_risk": result["dropout_risk"],
        "risk_level": result["risk_level"],
        "confidence": result["confidence"],
        "recommendations": [r["message"] for r in recs],
    }


@router.get("/leaderboard")
def get_leaderboard(
    limit: int = 20,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    students = db.query(models.Student).all()
    board = []

    for student in students:
        marks = db.query(models.Mark).filter(
            models.Mark.student_id == student.id).all()
        scores = []
        for m in marks:
            a = db.query(models.Assignment).filter(
                models.Assignment.id == m.assignment_id).first()
            if a and a.max_score > 0:
                scores.append(m.score / a.max_score * 100)
        avg_score = round(sum(scores) / len(scores), 2) if scores else 0

        total_att = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id).count()
        present = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.is_present == True
        ).count()
        att_pct = round(present / total_att * 100, 2) if total_att > 0 else 0

        pred = db.query(models.AIPrediction).filter(
            models.AIPrediction.student_id == student.id
        ).order_by(models.AIPrediction.created_at.desc()).first()
        risk_level = pred.risk_level if pred else "Low"

        board.append({
            "student_id": student.id,
            "full_name": student.user.full_name if student.user else "Unknown",
            "roll_number": student.roll_number,
            "department": student.department or "",
            "avg_score": avg_score,
            "attendance_pct": att_pct,
            "gpa": student.gpa,
            "risk_level": risk_level,
        })

    board.sort(key=lambda x: x["avg_score"], reverse=True)
    for i, entry in enumerate(board[:limit]):
        entry["rank"] = i + 1

    return board[:limit]


@router.get("/at-risk")
def get_all_at_risk(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)  # open to all roles
):
    predictions = db.query(models.AIPrediction).filter(
        models.AIPrediction.risk_level.in_(["Medium", "High"])
    ).order_by(models.AIPrediction.dropout_risk_pct.desc()).all()

    result = []
    seen = set()
    for p in predictions:
        if p.student_id in seen:
            continue
        seen.add(p.student_id)

        student = p.student
        user = student.user if student else None
        course = p.course

        total_att = db.query(models.Attendance).filter(
            models.Attendance.student_id == p.student_id).count()
        present = db.query(models.Attendance).filter(
            models.Attendance.student_id == p.student_id,
            models.Attendance.is_present == True
        ).count()
        att_pct = round(present / total_att * 100, 1) if total_att > 0 else 0

        action = (
            "Immediate Intervention"
            if p.dropout_risk_pct > 70
            else "Monitor Closely" if p.dropout_risk_pct > 50
            else "Send Reminder"
        )
        result.append({
            "student_id": p.student_id,
            "full_name": user.full_name if user else "Unknown",
            "roll_number": student.roll_number if student else "",
            "course_name": course.title if course else "Overall",
            "risk_score": round(p.dropout_risk_pct, 1),
            "risk_level": p.risk_level,
            "attendance_pct": att_pct,
            "predicted_score": round(p.predicted_score, 1),
            "action": action,
        })
    return result


@router.get("/model-stats")
def get_model_stats(current_user: models.User = Depends(get_current_user)):
    return ml_models.ai_engine.get_model_stats()


@router.get("/risk-distribution")
def get_risk_distribution(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    low = db.query(models.AIPrediction).filter(
        models.AIPrediction.risk_level == "Low").count()
    medium = db.query(models.AIPrediction).filter(
        models.AIPrediction.risk_level == "Medium").count()
    high = db.query(models.AIPrediction).filter(
        models.AIPrediction.risk_level == "High").count()
    return [
        {"name": "Low Risk", "value": low},
        {"name": "Medium Risk", "value": medium},
        {"name": "High Risk", "value": high},
    ]


@router.get("/search")
def global_search(
    q: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Global search across students, courses, and teachers."""
    if not q or len(q.strip()) < 1:
        return {"students": [], "courses": [], "teachers": []}

    term = f"%{q.strip()}%"

    # Search students (name, roll number, department)
    student_users = db.query(models.User).filter(
        models.User.role == "student",
        or_(
            models.User.full_name.ilike(term),
            models.User.email.ilike(term),
        )
    ).limit(5).all()

    students_result = []
    for u in student_users:
        s = db.query(models.Student).filter(models.Student.user_id == u.id).first()
        students_result.append({
            "id": s.id if s else None,
            "full_name": u.full_name,
            "roll_number": s.roll_number if s else "",
            "department": s.department if s else "",
            "type": "student",
            "url": f"/students/{s.id}" if s else "/leaderboard",
        })

    # Also search by roll number
    roll_students = db.query(models.Student).filter(
        or_(
            models.Student.roll_number.ilike(term),
            models.Student.department.ilike(term),
        )
    ).limit(5).all()
    for s in roll_students:
        if not any(r["id"] == s.id for r in students_result):
            students_result.append({
                "id": s.id,
                "full_name": s.user.full_name if s.user else "Unknown",
                "roll_number": s.roll_number,
                "department": s.department or "",
                "type": "student",
                "url": f"/students/{s.id}",
            })

    # Search courses (title, code, description)
    courses = db.query(models.Course).filter(
        or_(
            models.Course.title.ilike(term),
            models.Course.code.ilike(term),
            models.Course.description.ilike(term),
        ),
        models.Course.is_active == True
    ).limit(5).all()

    courses_result = [{
        "id": c.id,
        "title": c.title,
        "code": c.code,
        "teacher_name": c.teacher.user.full_name if c.teacher and c.teacher.user else "Unknown",
        "type": "course",
        "url": "/courses",
    } for c in courses]

    # Search teachers (name)
    teacher_users = db.query(models.User).filter(
        models.User.role == "teacher",
        models.User.full_name.ilike(term)
    ).limit(3).all()

    teachers_result = [{
        "id": u.id,
        "full_name": u.full_name,
        "type": "teacher",
        "url": "/teacher",
    } for u in teacher_users]

    return {
        "students": students_result[:5],
        "courses": courses_result[:5],
        "teachers": teachers_result[:3],
    }
