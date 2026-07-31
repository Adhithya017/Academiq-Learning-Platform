from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database
from routers.auth import get_current_user, require_role

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("/", response_model=List[schemas.CourseDetailResponse])
def get_courses(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    courses = db.query(models.Course).filter(models.Course.is_active == True).all()
    result = []
    for course in courses:
        enrolled_count = db.query(models.Enrollment).filter(
            models.Enrollment.course_id == course.id,
            models.Enrollment.status == "active"
        ).count()

        teacher_name = None
        if course.teacher and course.teacher.user:
            teacher_name = course.teacher.user.full_name

        # Avg score
        assignments = db.query(models.Assignment).filter(
            models.Assignment.course_id == course.id).all()
        all_scores = []
        for a in assignments:
            marks = db.query(models.Mark).filter(
                models.Mark.assignment_id == a.id).all()
            for m in marks:
                if a.max_score > 0:
                    all_scores.append((m.score / a.max_score) * 100)
        avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else None

        result.append(schemas.CourseDetailResponse(
            id=course.id,
            title=course.title,
            code=course.code,
            description=course.description,
            teacher_id=course.teacher_id,
            credits=course.credits,
            semester=course.semester,
            max_students=course.max_students,
            is_active=course.is_active,
            teacher_name=teacher_name,
            enrolled_count=enrolled_count,
            avg_score=avg_score,
        ))
    return result


@router.get("/my")
def get_my_courses(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Returns courses for the logged-in teacher."""
    teacher = db.query(models.Teacher).filter(
        models.Teacher.user_id == current_user.id).first()
    if not teacher:
        if current_user.role == "admin":
            courses = db.query(models.Course).filter(models.Course.is_active == True).all()
        else:
            raise HTTPException(status_code=404, detail="Teacher profile not found")
    else:
        courses = db.query(models.Course).filter(
            models.Course.teacher_id == teacher.id,
            models.Course.is_active == True
        ).all()

    result = []
    for c in courses:
        enrolled = db.query(models.Enrollment).filter(
            models.Enrollment.course_id == c.id,
            models.Enrollment.status == "active"
        ).count()
        result.append({
            "id": c.id,
            "title": c.title,
            "code": c.code,
            "description": c.description,
            "credits": c.credits,
            "semester": c.semester,
            "max_students": c.max_students,
            "enrolled_count": enrolled,
        })
    return result


@router.post("/", response_model=schemas.CourseResponse)
def create_course(
    course_data: schemas.CourseCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    existing = db.query(models.Course).filter(
        models.Course.code == course_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")

    course = models.Course(**course_data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/{course_id}", response_model=schemas.CourseResponse)
def update_course(
    course_id: int,
    data: schemas.CourseUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}


@router.get("/{course_id}/students")
def get_course_students(
    course_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("teacher", "admin"))
):
    """Get all enrolled students for a course."""
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status == "active"
    ).all()

    result = []
    for enr in enrollments:
        student = enr.student
        user = student.user if student else None
        result.append({
            "student_id": student.id,
            "user_id": user.id if user else None,
            "full_name": user.full_name if user else "Unknown",
            "roll_number": student.roll_number,
            "department": student.department,
            "semester": student.semester,
            "enrollment_id": enr.id,
        })
    return result


@router.get("/{course_id}")
def get_course(
    course_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrolled = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status == "active"
    ).count()

    return {
        "id": course.id,
        "title": course.title,
        "code": course.code,
        "description": course.description,
        "teacher_name": course.teacher.user.full_name if course.teacher else None,
        "credits": course.credits,
        "semester": course.semester,
        "enrolled_count": enrolled,
        "max_students": course.max_students,
    }
