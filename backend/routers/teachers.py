from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database
from routers.auth import get_current_user, require_role

router = APIRouter(prefix="/teachers", tags=["Teachers"])


@router.get("/dashboard", response_model=schemas.TeacherDashboard)
def get_teacher_dashboard(
    current_user: models.User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(database.get_db)
):
    teacher = db.query(models.Teacher).filter(
        models.Teacher.user_id == current_user.id).first()

    if teacher:
        courses = db.query(models.Course).filter(
            models.Course.teacher_id == teacher.id,
            models.Course.is_active == True
        ).all()
    else:
        courses = db.query(models.Course).filter(models.Course.is_active == True).all()

    course_ids = [c.id for c in courses]

    # Total enrolled students (unique)
    enrolled_student_ids = set()
    for cid in course_ids:
        enrs = db.query(models.Enrollment).filter(
            models.Enrollment.course_id == cid,
            models.Enrollment.status == "active"
        ).all()
        for e in enrs:
            enrolled_student_ids.add(e.student_id)
    total_students = len(enrolled_student_ids)

    # Avg attendance across all courses
    att_pcts = []
    for sid in enrolled_student_ids:
        for cid in course_ids:
            total = db.query(models.Attendance).filter(
                models.Attendance.student_id == sid,
                models.Attendance.course_id == cid
            ).count()
            present = db.query(models.Attendance).filter(
                models.Attendance.student_id == sid,
                models.Attendance.course_id == cid,
                models.Attendance.is_present == True
            ).count()
            if total > 0:
                att_pcts.append(present / total * 100)
    avg_attendance = round(sum(att_pcts) / len(att_pcts), 2) if att_pcts else 0.0

    # Avg class score
    all_marks = []
    for cid in course_ids:
        assignments = db.query(models.Assignment).filter(
            models.Assignment.course_id == cid).all()
        for a in assignments:
            marks = db.query(models.Mark).filter(
                models.Mark.assignment_id == a.id).all()
            for m in marks:
                if a.max_score > 0:
                    all_marks.append((m.score / a.max_score) * 100)
    avg_class_score = round(sum(all_marks) / len(all_marks), 2) if all_marks else 0.0

    # At-risk count
    at_risk = db.query(models.AIPrediction).filter(
        models.AIPrediction.risk_level.in_(["Medium", "High"]),
        models.AIPrediction.student_id.in_(list(enrolled_student_ids))
    ).count()

    # Assignments graded
    assignments_graded = db.query(models.Mark).filter(
        models.Mark.student_id.in_(list(enrolled_student_ids))
    ).count()

    return {
        "total_students": total_students,
        "active_courses": len(courses),
        "avg_class_score": avg_class_score,
        "avg_attendance": avg_attendance,
        "at_risk_count": at_risk,
        "assignments_graded": assignments_graded,
    }


@router.get("/at-risk-students")
def get_at_risk_students(
    current_user: models.User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(database.get_db)
):
    predictions = db.query(models.AIPrediction).filter(
        models.AIPrediction.risk_level.in_(["Medium", "High"])
    ).order_by(models.AIPrediction.dropout_risk_pct.desc()).limit(20).all()

    result = []
    for p in predictions:
        student = p.student
        user = student.user if student else None
        course = p.course

        total_att = db.query(models.Attendance).filter(
            models.Attendance.student_id == p.student_id).count()
        present_att = db.query(models.Attendance).filter(
            models.Attendance.student_id == p.student_id,
            models.Attendance.is_present == True
        ).count()
        att_pct = round((present_att / total_att * 100) if total_att > 0 else 0, 1)

        action = (
            "Immediate Intervention" if p.risk_level == "High" and p.dropout_risk_pct > 70
            else "Monitor Closely" if p.risk_level == "High"
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


@router.get("/class-performance")
def get_class_performance(
    current_user: models.User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(database.get_db)
):
    """Returns monthly aggregated class performance data for charts."""
    from sqlalchemy import extract
    from collections import defaultdict
    import datetime

    marks = db.query(models.Mark).all()
    monthly = defaultdict(list)
    for m in marks:
        month = m.submitted_at.strftime("%b")
        a = db.query(models.Assignment).filter(
            models.Assignment.id == m.assignment_id).first()
        if a and a.max_score > 0:
            monthly[month].append((m.score / a.max_score) * 100)

    months_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    result = []
    for month in months_order:
        if month in monthly:
            scores = monthly[month]
            result.append({
                "month": month,
                "avg": round(sum(scores) / len(scores), 1),
                "top": round(max(scores), 1),
            })

    return result
