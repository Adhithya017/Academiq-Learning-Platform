from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime
import models, schemas, database
from routers.auth import get_current_user, require_role

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.get("/course/{course_id}", response_model=List[schemas.AssignmentResponse])
def get_course_assignments(
    course_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Assignment).filter(
        models.Assignment.course_id == course_id
    ).order_by(models.Assignment.due_date).all()


@router.post("/", response_model=schemas.AssignmentResponse)
def create_assignment(
    data: schemas.AssignmentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    assignment = models.Assignment(
        **data.model_dump(),
        created_by=current_user.id
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.put("/{assignment_id}", response_model=schemas.AssignmentResponse)
def update_assignment(
    assignment_id: int,
    data: schemas.AssignmentUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(assignment, field, value)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted"}


@router.get("/{assignment_id}/marks")
def get_assignment_marks(
    assignment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    """Get all student marks for an assignment, including unsubmitted students."""
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Get enrolled students for this course
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == assignment.course_id,
        models.Enrollment.status == "active"
    ).all()

    result = []
    for enr in enrollments:
        student = enr.student
        user = student.user if student else None
        mark = db.query(models.Mark).filter(
            models.Mark.student_id == student.id,
            models.Mark.assignment_id == assignment_id
        ).first()

        result.append({
            "mark_id": mark.id if mark else None,
            "student_id": student.id,
            "full_name": user.full_name if user else "Unknown",
            "roll_number": student.roll_number,
            "score": mark.score if mark else None,
            "max_score": assignment.max_score,
            "pct": round(mark.score / assignment.max_score * 100, 1) if mark and assignment.max_score > 0 else None,
            "feedback": mark.feedback if mark else None,
            "submitted": mark is not None,
        })

    return result


@router.post("/marks", response_model=schemas.MarkResponse)
def submit_marks(
    data: schemas.MarkCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == data.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if data.score > assignment.max_score:
        raise HTTPException(status_code=400, detail="Score exceeds max score")

    existing = db.query(models.Mark).filter(
        models.Mark.student_id == data.student_id,
        models.Mark.assignment_id == data.assignment_id
    ).first()
    if existing:
        existing.score = data.score
        existing.feedback = data.feedback
        db.commit()
        db.refresh(existing)
        return existing

    mark = models.Mark(**data.model_dump())
    db.add(mark)
    db.commit()
    db.refresh(mark)
    return mark


@router.post("/marks/bulk")
def submit_bulk_marks(
    data: schemas.BulkMarkCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    """Submit marks for multiple students at once."""
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == data.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    saved = 0
    for item in data.marks:
        if item.score > assignment.max_score:
            continue  # Skip invalid scores
        existing = db.query(models.Mark).filter(
            models.Mark.student_id == item.student_id,
            models.Mark.assignment_id == data.assignment_id
        ).first()
        if existing:
            existing.score = item.score
            existing.feedback = item.feedback
        else:
            mark = models.Mark(
                student_id=item.student_id,
                assignment_id=data.assignment_id,
                score=item.score,
                feedback=item.feedback,
            )
            db.add(mark)
        saved += 1
    db.commit()
    return {"message": f"Marks saved for {saved} students"}


@router.put("/marks/{mark_id}", response_model=schemas.MarkResponse)
def update_mark(
    mark_id: int,
    data: schemas.MarkUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    mark = db.query(models.Mark).filter(models.Mark.id == mark_id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    if data.score is not None:
        mark.score = data.score
    if data.feedback is not None:
        mark.feedback = data.feedback
    db.commit()
    db.refresh(mark)
    return mark


@router.get("/student/{student_id}/marks")
def get_student_marks(
    student_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    marks = db.query(models.Mark).filter(
        models.Mark.student_id == student_id).all()

    result = []
    for m in marks:
        a = m.assignment
        course = a.course if a else None
        result.append({
            "mark_id": m.id,
            "assignment_title": a.title if a else "Unknown",
            "course_title": course.title if course else "Unknown",
            "course_code": course.code if course else "",
            "score": m.score,
            "max_score": a.max_score if a else 100,
            "pct": round(m.score / a.max_score * 100, 1) if a and a.max_score > 0 else 0,
            "submitted_at": m.submitted_at,
            "feedback": m.feedback,
        })
    return result
