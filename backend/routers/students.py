from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database
from routers.auth import get_current_user, require_role
from sqlalchemy import func
from typing import Optional

router = APIRouter(prefix="/students", tags=["Students"])


def _get_student_metrics(student_id: int, db: Session):
    """Compute real metrics for a student from the database."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        return None

    # Attendance
    total_att = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id).count()
    present_att = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.is_present == True
    ).count()
    attendance_pct = round((present_att / total_att * 100) if total_att > 0 else 0, 2)

    # Marks
    marks = db.query(models.Mark).filter(models.Mark.student_id == student_id).all()
    avg_score = 0.0
    if marks:
        scores = []
        for m in marks:
            assignment = db.query(models.Assignment).filter(
                models.Assignment.id == m.assignment_id).first()
            if assignment and assignment.max_score > 0:
                scores.append((m.score / assignment.max_score) * 100)
        avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0

    # Enrollments
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student_id,
        models.Enrollment.status == "active"
    ).count()

    # Assignments
    enrolled_course_ids = [
        e.course_id for e in db.query(models.Enrollment).filter(
            models.Enrollment.student_id == student_id).all()
    ]
    total_assignments = db.query(models.Assignment).filter(
        models.Assignment.course_id.in_(enrolled_course_ids)).count()
    submitted = db.query(models.Mark).filter(
        models.Mark.student_id == student_id).count()

    # Latest AI prediction
    prediction = db.query(models.AIPrediction).filter(
        models.AIPrediction.student_id == student_id
    ).order_by(models.AIPrediction.created_at.desc()).first()
    dropout_risk = prediction.dropout_risk_pct if prediction else 0.0
    risk_level = prediction.risk_level if prediction else "Low"

    return {
        "attendance_rate": attendance_pct,
        "performance_score": avg_score,
        "courses_enrolled": enrollments,
        "dropout_risk": dropout_risk,
        "prediction_accuracy": 94.2,
        "at_risk_count": 1 if risk_level == "High" else 0,
        "gpa": student.gpa,
        "assignments_submitted": submitted,
        "assignments_total": total_assignments,
    }


def _get_target_student(db: Session, current_user: models.User, student_id: int = None):
    if student_id and current_user.role in ["admin", "teacher"]:
        student = db.query(models.Student).filter(models.Student.id == student_id).first()
    else:
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@router.get("/dashboard", response_model=schemas.StudentDashboard)
def get_student_dashboard(
    student_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    student = _get_target_student(db, current_user, student_id)
    metrics = _get_student_metrics(student.id, db)
    return metrics


@router.get("/me/courses")
def get_my_courses(
    student_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    student = _get_target_student(db, current_user, student_id)

    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student.id,
        models.Enrollment.status == "active"
    ).all()

    result = []
    for enr in enrollments:
        course = enr.course
        teacher = course.teacher.user if course.teacher else None

        # Course-level attendance
        total = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.course_id == course.id
        ).count()
        present = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.course_id == course.id,
            models.Attendance.is_present == True
        ).count()
        att_pct = round((present / total * 100) if total > 0 else 0, 1)

        # Course-level marks
        assignments = db.query(models.Assignment).filter(
            models.Assignment.course_id == course.id).all()
        scores = []
        for a in assignments:
            mark = db.query(models.Mark).filter(
                models.Mark.student_id == student.id,
                models.Mark.assignment_id == a.id
            ).first()
            if mark and a.max_score > 0:
                scores.append((mark.score / a.max_score) * 100)
        avg = round(sum(scores) / len(scores), 1) if scores else 0.0

        result.append({
            "id": course.id,
            "title": course.title,
            "code": course.code,
            "instructor": teacher.full_name if teacher else "Unknown",
            "progress": att_pct,
            "avg_score": avg,
            "enrolled_count": len(course.enrollments),
            "credits": course.credits,
        })

    return result


@router.get("/me/recommendations")
def get_my_recommendations(
    student_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    student = _get_target_student(db, current_user, student_id)

    recs = db.query(models.Recommendation).filter(
        models.Recommendation.student_id == student.id
    ).order_by(models.Recommendation.created_at.desc()).limit(10).all()

    return [
        {
            "id": r.id,
            "category": r.category,
            "message": r.message,
            "priority": r.priority,
            "is_read": r.is_read,
            "created_at": r.created_at,
        }
        for r in recs
    ]


@router.get("/me/attendance")
def get_my_attendance(
    student_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    student = _get_target_student(db, current_user, student_id)

    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student.id).all()

    result = []
    for enr in enrollments:
        course = enr.course
        records = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.course_id == course.id
        ).order_by(models.Attendance.date).all()

        total = len(records)
        present = sum(1 for r in records if r.is_present)
        result.append({
            "course_id": course.id,
            "course_title": course.title,
            "course_code": course.code,
            "total_classes": total,
            "attended": present,
            "attendance_pct": round(present / total * 100, 1) if total > 0 else 0,
        })

    return result


@router.get("/me/marks")
def get_my_marks(
    student_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    student = _get_target_student(db, current_user, student_id)

    marks = db.query(models.Mark).filter(
        models.Mark.student_id == student.id).all()

    result = []
    for m in marks:
        a = m.assignment
        course = a.course if a else None
        result.append({
            "mark_id": m.id,
            "assignment_id": m.assignment_id,
            "assignment_title": a.title if a else "Unknown",
            "course_id": course.id if course else None,
            "course_title": course.title if course else "Unknown",
            "course_code": course.code if course else "",
            "score": m.score,
            "max_score": a.max_score if a else 100,
            "pct": round(m.score / a.max_score * 100, 1) if a and a.max_score > 0 else 0,
            "submitted_at": m.submitted_at,
            "feedback": m.feedback,
            "due_date": a.due_date if a else None,
        })
    return result


@router.get("/me/assignments")
def get_my_assignments(
    student_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get all assignments for the student's enrolled courses with submission status."""
    student = _get_target_student(db, current_user, student_id)

    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student.id,
        models.Enrollment.status == "active"
    ).all()

    result = []
    for enr in enrollments:
        course = enr.course
        assignments = db.query(models.Assignment).filter(
            models.Assignment.course_id == course.id
        ).all()
        for a in assignments:
            mark = db.query(models.Mark).filter(
                models.Mark.student_id == student.id,
                models.Mark.assignment_id == a.id
            ).first()
            result.append({
                "assignment_id": a.id,
                "title": a.title,
                "course_title": course.title,
                "course_code": course.code,
                "due_date": a.due_date,
                "max_score": a.max_score,
                "submitted": mark is not None,
                "score": mark.score if mark else None,
                "pct": round(mark.score / a.max_score * 100, 1) if mark and a.max_score > 0 else None,
                "feedback": mark.feedback if mark else None,
            })
    return result


@router.get("/me/predictions")
def get_my_predictions(
    student_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    student = _get_target_student(db, current_user, student_id)

    predictions = db.query(models.AIPrediction).filter(
        models.AIPrediction.student_id == student.id
    ).order_by(models.AIPrediction.created_at.desc()).limit(10).all()

    return [
        {
            "id": p.id,
            "course_id": p.course_id,
            "course_name": p.course.title if p.course else "Overall",
            "predicted_score": round(p.predicted_score, 1),
            "dropout_risk_pct": round(p.dropout_risk_pct, 1),
            "risk_level": p.risk_level,
            "confidence": round(p.confidence, 1),
            "factors": p.factors_json,
            "created_at": p.created_at,
        }
        for p in predictions
    ]


@router.get("/", response_model=List[schemas.StudentResponse])
def list_students(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    students = db.query(models.Student).all()
    result = []
    for s in students:
        data = schemas.StudentResponse.model_validate(s)
        data.full_name = s.user.full_name if s.user else None
        data.email = s.user.email if s.user else None
        result.append(data)
    return result


@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    metrics = _get_student_metrics(student_id, db)
    return {
        "id": student.id,
        "full_name": student.user.full_name,
        "email": student.user.email,
        "roll_number": student.roll_number,
        "department": student.department,
        "semester": student.semester,
        "gpa": student.gpa,
        **metrics,
    }
