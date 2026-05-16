from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime
import models, schemas, database
from routers.auth import get_current_user, require_role

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/", response_model=schemas.AttendanceResponse)
def mark_attendance(
    data: schemas.AttendanceCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    existing = db.query(models.Attendance).filter(
        models.Attendance.student_id == data.student_id,
        models.Attendance.course_id == data.course_id,
        models.Attendance.date == data.date
    ).first()
    if existing:
        existing.is_present = data.is_present
        db.commit()
        db.refresh(existing)
        return existing

    record = models.Attendance(
        student_id=data.student_id,
        course_id=data.course_id,
        date=data.date,
        is_present=data.is_present,
        marked_by=current_user.id
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/bulk")
def save_bulk_attendance(
    data: schemas.AttendanceBulkCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    """Save attendance for all students in a course for a specific date."""
    saved = 0
    for item in data.records:
        existing = db.query(models.Attendance).filter(
            models.Attendance.student_id == item.student_id,
            models.Attendance.course_id == data.course_id,
            models.Attendance.date == data.date
        ).first()
        if existing:
            existing.is_present = item.is_present
        else:
            record = models.Attendance(
                student_id=item.student_id,
                course_id=data.course_id,
                date=data.date,
                is_present=item.is_present,
                marked_by=current_user.id
            )
            db.add(record)
        saved += 1
    db.commit()
    return {"message": f"Attendance saved for {saved} students", "date": str(data.date)}


@router.get("/course/{course_id}/date/{date_str}")
def get_attendance_by_date(
    course_id: int,
    date_str: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    """Get attendance records for all enrolled students for a specific date."""
    try:
        date = datetime.date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Get enrolled students
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status == "active"
    ).all()

    result = []
    for enr in enrollments:
        student = enr.student
        user = student.user if student else None

        attendance = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.course_id == course_id,
            models.Attendance.date == date
        ).first()

        result.append({
            "student_id": student.id,
            "full_name": user.full_name if user else "Unknown",
            "roll_number": student.roll_number,
            "is_present": attendance.is_present if attendance else None,  # None = not marked yet
            "marked": attendance is not None,
        })

    return result


@router.get("/course/{course_id}/summary")
def get_course_attendance_summary(
    course_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status == "active"
    ).all()

    result = []
    for enr in enrollments:
        student = enr.student
        user = student.user if student else None

        total = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.course_id == course_id
        ).count()
        present = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.course_id == course_id,
            models.Attendance.is_present == True
        ).count()
        result.append({
            "student_id": student.id,
            "full_name": user.full_name if user else "Unknown",
            "roll_number": student.roll_number,
            "total_classes": total,
            "attended": present,
            "attendance_pct": round(present / total * 100, 1) if total > 0 else 0,
        })

    return result


@router.get("/course/{course_id}/dates")
def get_course_attendance_dates(
    course_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    """Get all dates that have attendance records for a course."""
    records = db.query(models.Attendance.date).filter(
        models.Attendance.course_id == course_id
    ).distinct().order_by(models.Attendance.date.desc()).all()
    return [str(r.date) for r in records]


@router.get("/weekly-trend/{student_id}")
def get_weekly_attendance_trend(
    student_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id
    ).order_by(models.Attendance.date).all()

    if not records:
        return []

    from collections import defaultdict
    weekly = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        week_num = r.date.isocalendar()[1]
        key = f"W{week_num}"
        weekly[key]["total"] += 1
        if r.is_present:
            weekly[key]["present"] += 1

    return [
        {
            "week": k,
            "attendance": round(v["present"] / v["total"] * 100, 1) if v["total"] > 0 else 0
        }
        for k, v in sorted(weekly.items())
    ]


@router.get("/course/{course_id}/engagement-suggestions")
def get_engagement_suggestions(
    course_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status == "active"
    ).all()

    suggestions = []
    for enr in enrollments:
        student = enr.student
        eng_score = student.engagement_score if student.engagement_score else 0.0
        
        # Innovative Feature: "Virtual Present" if engagement >= 75%
        suggestion = "Virtual Present" if eng_score >= 75.0 else "Needs Review"
        
        suggestions.append({
            "student_id": student.id,
            "full_name": student.user.full_name,
            "roll_number": student.roll_number,
            "engagement_score": eng_score,
            "suggestion": suggestion,
            "suggested_present": suggestion == "Virtual Present"
        })
        
    return suggestions
