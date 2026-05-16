from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database
from routers.auth import get_current_user, require_role, get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Stats ────────────────────────────────────────────────────────────
@router.get("/stats", response_model=schemas.AdminStats)
def get_admin_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    return {
        "total_users": db.query(models.User).count(),
        "total_students": db.query(models.Student).count(),
        "total_teachers": db.query(models.Teacher).count(),
        "total_courses": db.query(models.Course).count(),
        "total_predictions": db.query(models.AIPrediction).count(),
        "avg_prediction_accuracy": 94.2,
    }


# ── Users ─────────────────────────────────────────────────────────────
@router.get("/users")
def get_all_users(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    users = db.query(models.User).all()
    result = []
    for u in users:
        student = db.query(models.Student).filter(models.Student.user_id == u.id).first()
        teacher = db.query(models.Teacher).filter(models.Teacher.user_id == u.id).first()
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "roll_number": student.roll_number if student else None,
            "department": student.department if student else (teacher.department if teacher else None),
            "semester": student.semester if student else None,
            "designation": teacher.designation if teacher else None,
            "employee_id": teacher.employee_id if teacher else None,
            "profile_id": student.id if student else (teacher.id if teacher else None),
        })
    return result


@router.post("/users")
def create_user(
    data: schemas.AdminUserCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        return {"success": False, "message": "Email already exists"}

    hashed = get_password_hash(data.password)
    user = models.User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hashed,
        role=data.role,
        is_active=data.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile_id = None
    if data.role == "student":
        import random, string
        roll = data.roll_number or f"STU{random.randint(10000, 99999)}"
        student = models.Student(
            user_id=user.id,
            roll_number=roll,
            department=data.department or "General",
            semester=data.semester or 1,
            gpa=0.0,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        profile_id = student.id
    elif data.role == "teacher":
        import random
        emp_id = data.employee_id or f"EMP{random.randint(1000, 9999)}"
        teacher = models.Teacher(
            user_id=user.id,
            employee_id=emp_id,
            department=data.department or "General",
            designation=data.designation or "Lecturer",
        )
        db.add(teacher)
        db.commit()
        db.refresh(teacher)
        profile_id = teacher.id

    log = models.SystemLog(
        action=f"Admin created user: {user.email} ({user.role})",
        user_id=current_user.id,
        level="INFO",
        details=f"New {user.role} account created"
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "User created successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "roll_number": data.roll_number,
            "department": data.department,
            "semester": data.semester,
            "designation": data.designation,
            "employee_id": data.employee_id,
            "profile_id": profile_id,
        }
    }


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    data: schemas.AdminUserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.email is not None:
        user.email = data.email
    if data.password:
        user.hashed_password = get_password_hash(data.password)
    if data.is_active is not None:
        user.is_active = data.is_active

    # Update student profile
    student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
    if student:
        if data.roll_number is not None:
            student.roll_number = data.roll_number
        if data.department is not None:
            student.department = data.department
        if data.semester is not None:
            student.semester = data.semester

    # Update teacher profile
    teacher = db.query(models.Teacher).filter(models.Teacher.user_id == user_id).first()
    if teacher:
        if data.designation is not None:
            teacher.designation = data.designation
        if data.employee_id is not None:
            teacher.employee_id = data.employee_id
        if data.department is not None:
            teacher.department = data.department

    db.commit()
    db.refresh(user)

    log = models.SystemLog(
        action=f"Admin updated user: {user.email}",
        user_id=current_user.id,
        level="INFO",
        details="User profile updated"
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "roll_number": student.roll_number if student else None,
            "department": student.department if student else (teacher.department if teacher else None),
            "semester": student.semester if student else None,
            "designation": teacher.designation if teacher else None,
            "employee_id": teacher.employee_id if teacher else None,
            "profile_id": student.id if student else (teacher.id if teacher else None),
        }
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log = models.SystemLog(
        action=f"Admin deleted user: {user.email} ({user.role})",
        user_id=current_user.id,
        level="WARN",
        details="User account deleted"
    )
    db.add(log)
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}


# ── Courses ───────────────────────────────────────────────────────────
@router.get("/courses")
def get_all_courses(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    courses = db.query(models.Course).all()
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
            "teacher_id": c.teacher_id,
            "teacher_name": c.teacher.user.full_name if c.teacher and c.teacher.user else None,
            "credits": c.credits,
            "semester": c.semester,
            "max_students": c.max_students,
            "is_active": c.is_active,
            "enrolled_count": enrolled,
        })
    return result


@router.post("/courses", response_model=schemas.CourseResponse)
def create_course(
    data: schemas.CourseCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    existing = db.query(models.Course).filter(models.Course.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")
    course = models.Course(**data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    log = models.SystemLog(
        action=f"Admin created course: {course.title} ({course.code})",
        user_id=current_user.id, level="INFO", details="Course created"
    )
    db.add(log)
    db.commit()
    return course


@router.put("/courses/{course_id}", response_model=schemas.CourseResponse)
def update_course(
    course_id: int,
    data: schemas.CourseUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/courses/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}


# ── Enrollments ───────────────────────────────────────────────────────
@router.get("/enrollments")
def get_enrollments(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    enrollments = db.query(models.Enrollment).all()
    return [
        {
            "id": e.id,
            "student_id": e.student_id,
            "course_id": e.course_id,
            "status": e.status,
            "enrolled_at": e.enrolled_at,
            "student_name": e.student.user.full_name if e.student and e.student.user else None,
            "student_roll": e.student.roll_number if e.student else None,
            "course_title": e.course.title if e.course else None,
            "course_code": e.course.code if e.course else None,
        }
        for e in enrollments
    ]


@router.post("/enrollments", response_model=schemas.EnrollmentResponse)
def enroll_student(
    data: schemas.EnrollmentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    # Check existing
    existing = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == data.student_id,
        models.Enrollment.course_id == data.course_id,
    ).first()
    if existing:
        if existing.status == "active":
            raise HTTPException(status_code=400, detail="Student already enrolled")
        existing.status = "active"
        db.commit()
        db.refresh(existing)
        return existing

    # Capacity check
    course = db.query(models.Course).filter(models.Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    enrolled_count = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == data.course_id,
        models.Enrollment.status == "active"
    ).count()
    if enrolled_count >= course.max_students:
        raise HTTPException(status_code=400, detail="Course is full")

    enrollment = models.Enrollment(
        student_id=data.student_id,
        course_id=data.course_id,
        status="active"
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.delete("/enrollments/{enrollment_id}")
def remove_enrollment(
    enrollment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()
    return {"message": "Enrollment removed"}


# ── Teachers list (for dropdowns) ────────────────────────────────────
@router.get("/teachers-list")
def get_teachers_list(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    teachers = db.query(models.Teacher).all()
    return [
        {
            "id": t.id,
            "user_id": t.user_id,
            "full_name": t.user.full_name if t.user else "Unknown",
            "department": t.department,
            "designation": t.designation,
        }
        for t in teachers
    ]


# ── Logs ──────────────────────────────────────────────────────────────
@router.get("/logs")
def get_system_logs(
    limit: int = 50,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    logs = db.query(models.SystemLog).order_by(
        models.SystemLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "level": log.level,
            "action": log.action,
            "details": log.details,
            "user_id": log.user_id,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]


@router.post("/reseed")
def reseed_database(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    """Trigger re-seeding. Returns status only — actual seeding runs from seed.py."""
    log = models.SystemLog(
        action="Admin triggered reseed",
        user_id=current_user.id,
        level="WARN",
        details="Reseed requested via admin panel"
    )
    db.add(log)
    db.commit()
    return {"message": "Reseed requested. Run seed.py from the backend directory."}
