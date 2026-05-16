"""
AcademiQ Seed Script
====================
Run from the backend/ directory:
    python seed.py

Creates:
- 1 Admin, 3 Teachers, 20 Students
- 6 Courses with enrollments
- 8 weeks of attendance data
- 4 assignments per course with marks
- AI predictions and recommendations for all students
- Notifications for all users
"""

import sys
import os
import datetime
import random

# Ensure imports work from this directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from passlib.context import CryptContext
import ml_models

models.Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_pw(pw: str) -> str:
    return pwd_context.hash(pw)

# ── Sample data pools ────────────────────────────────────────────────
STUDENT_NAMES = [
    ("Aditi Rao", "CS2021001"), ("Priya Sharma", "CS2021002"), ("Raj Patel", "CS2021003"),
    ("Amir Khan", "CS2021004"), ("Divya Menon", "CS2021005"), ("Sri Krishnan", "CS2021006"),
    ("Neel Shah", "CS2021007"), ("Ananya Iyer", "CS2021008"), ("Ravi Kumar", "CS2021009"),
    ("Sneha Reddy", "CS2021010"), ("Arjun Nair", "CS2021011"), ("Meera Pillai", "CS2021012"),
    ("Karan Mehta", "CS2021013"), ("Pooja Joshi", "CS2021014"), ("Vikram Singh", "CS2021015"),
    ("Deepa Nair", "CS2021016"), ("Rahul Gupta", "CS2021017"), ("Isha Verma", "CS2021018"),
    ("Ajay Kumar", "CS2021019"), ("Swati Patil", "CS2021020"),
]

TEACHER_DATA = [
    ("Dr. Jane Smith", "teacher1@academiq.com", "Computer Science", "Associate Professor"),
    ("Prof. Alan Kumar", "teacher2@academiq.com", "Data Science", "Assistant Professor"),
    ("Dr. Meena Rao", "teacher3@academiq.com", "Software Engineering", "Professor"),
]

COURSE_DATA = [
    ("Machine Learning 101", "CS101", "Fundamentals of ML: supervised and unsupervised learning", 4, 1),
    ("Data Structures & Algorithms", "CS102", "Core CS algorithms, complexity analysis, and data structures", 4, 1),
    ("Web Engineering", "CS103", "Full-stack development with React, Node.js, and REST APIs", 3, 2),
    ("Database Systems", "CS104", "RDBMS design, SQL, normalization, and NoSQL fundamentals", 3, 2),
    ("Software Engineering", "CS105", "SDLC, Agile, testing, design patterns, and project management", 3, 3),
    ("Deep Learning", "CS106", "Neural networks, CNNs, RNNs, and transformer architectures", 4, 3),
]

ASSIGNMENT_TITLES = [
    "Quiz 1 — Fundamentals", "Mid-Term Assignment",
    "Lab Exercise", "Final Project",
]

DEPARTMENTS = ["Computer Science", "Data Science", "Software Engineering"]


def seed(force: bool = False):
    db = SessionLocal()
    try:
        existing_count = db.query(models.User).count()
        if existing_count > 3 and not force:
            print("Database already seeded. Use --force to re-seed.")
            return

        print("Seeding AcademiQ database...")
        random.seed(42)
        today = datetime.date.today()

        # ── Admin ────────────────────────────────────────────────────
        admin_user = models.User(
            email="admin@academiq.com",
            hashed_password=hash_pw("Admin@123"),
            full_name="System Administrator",
            role="admin",
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print("  - Admin created")

        # ── Teachers ─────────────────────────────────────────────────
        teacher_users = []
        teachers = []
        for name, email, dept, desig in TEACHER_DATA:
            u = models.User(
                email=email,
                hashed_password=hash_pw("Teacher@123"),
                full_name=name,
                role="teacher",
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            t = models.Teacher(
                user_id=u.id,
                employee_id=f"EMP{1000 + len(teachers):04d}",
                department=dept,
                designation=desig
            )
            db.add(t)
            db.commit()
            db.refresh(t)
            teacher_users.append(u)
            teachers.append(t)
        print(f"  - {len(teachers)} teachers created")

        # ── Courses ───────────────────────────────────────────────────
        courses = []
        for i, (title, code, desc, credits, sem) in enumerate(COURSE_DATA):
            teacher = teachers[i % len(teachers)]
            c = models.Course(
                title=title, code=code, description=desc,
                teacher_id=teacher.id, credits=credits, semester=sem,
                max_students=45, is_active=True,
            )
            db.add(c)
            db.commit()
            db.refresh(c)
            courses.append(c)
        print(f"  - {len(courses)} courses created")

        # ── Students ──────────────────────────────────────────────────
        students = []
        student_users = []
        for name, roll in STUDENT_NAMES:
            email = f"{roll.lower()}@academiq.com"
            u = models.User(
                email=email,
                hashed_password=hash_pw("Student@123"),
                full_name=name,
                role="student",
            )
            db.add(u)
            db.commit()
            db.refresh(u)

            dept = random.choice(DEPARTMENTS)
            gpa = round(random.uniform(2.5, 4.0), 2)
            eng_score = round(random.uniform(40.0, 95.0), 1)
            s = models.Student(
                user_id=u.id,
                roll_number=roll,
                department=dept,
                semester=random.choice([3, 4, 5]),
                gpa=gpa,
                engagement_score=eng_score,
            )
            db.add(s)
            db.commit()
            db.refresh(s)
            students.append(s)
            student_users.append(u)
        print(f"  - {len(students)} students created")

        # ── Enrollments ───────────────────────────────────────────────
        for student in students:
            enrolled_courses = random.sample(courses, k=random.randint(3, 5))
            for course in enrolled_courses:
                enr = models.Enrollment(
                    student_id=student.id,
                    course_id=course.id,
                    status="active",
                )
                db.add(enr)
        db.commit()
        print("  - Enrollments created")

        # ── Attendance (8 weeks, Mon/Wed/Fri pattern) ─────────────────
        base_date = today - datetime.timedelta(weeks=8)
        for student in students:
            enrollments = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == student.id,
                models.Enrollment.status == "active"
            ).all()

            # Simulate realistic attendance profile
            base_att_prob = random.uniform(0.55, 0.98)

            for enr in enrollments:
                for week in range(8):
                    for day_offset in [0, 2, 4]:  # Mon, Wed, Fri
                        att_date = base_date + datetime.timedelta(weeks=week, days=day_offset)
                        is_present = random.random() < base_att_prob
                        rec = models.Attendance(
                            student_id=student.id,
                            course_id=enr.course_id,
                            date=att_date,
                            is_present=is_present,
                            marked_by=teacher_users[0].id,
                        )
                        db.add(rec)
        db.commit()
        print("  - Attendance records created (8 weeks)")

        # ── Assignments + Marks ───────────────────────────────────────
        assignments = []
        for course in courses:
            for i, title in enumerate(ASSIGNMENT_TITLES):
                due = today - datetime.timedelta(weeks=7 - i * 2)
                a = models.Assignment(
                    course_id=course.id,
                    title=f"{course.code} — {title}",
                    description=f"Assignment for {course.title}",
                    due_date=due,
                    max_score=100.0,
                    created_by=teacher_users[0].id,
                )
                db.add(a)
                db.commit()
                db.refresh(a)
                assignments.append(a)

        for student in students:
            enrollments = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == student.id,
                models.Enrollment.status == "active"
            ).all()
            enrolled_course_ids = {e.course_id for e in enrollments}

            base_score = random.uniform(40, 95)
            for a in assignments:
                if a.course_id not in enrolled_course_ids:
                    continue
                # 85% chance of submission
                if random.random() > 0.15:
                    score = min(100, max(30, base_score + random.gauss(0, 10)))
                    mark = models.Mark(
                        student_id=student.id,
                        assignment_id=a.id,
                        score=round(score, 1),
                        submitted_at=datetime.datetime.utcnow() - datetime.timedelta(
                            days=random.randint(1, 50)
                        ),
                        feedback="Good effort." if score >= 70 else "Needs improvement.",
                    )
                    db.add(mark)
        db.commit()
        print("  - Assignments & marks seeded")

        # ── AI Predictions for each student ───────────────────────────
        for student in students:
            # Compute real metrics
            total_att = db.query(models.Attendance).filter(
                models.Attendance.student_id == student.id).count()
            present = db.query(models.Attendance).filter(
                models.Attendance.student_id == student.id,
                models.Attendance.is_present == True
            ).count()
            att_pct = (present / total_att * 100) if total_att > 0 else 70

            marks = db.query(models.Mark).filter(
                models.Mark.student_id == student.id).all()
            scores = []
            for m in marks:
                a = db.query(models.Assignment).filter(
                    models.Assignment.id == m.assignment_id).first()
                if a and a.max_score > 0:
                    scores.append((m.score / a.max_score) * 100)
            avg_score = sum(scores) / len(scores) if scores else 60
            assign_ratio = len(marks) / max(1, len([
                a for a in assignments
                if a.course_id in {
                    e.course_id for e in db.query(models.Enrollment).filter(
                        models.Enrollment.student_id == student.id).all()
                }
            ])) * 100

            result = ml_models.ai_engine.predict(
                attendance=att_pct,
                past_scores=avg_score,
                assignments=min(100, assign_ratio),
                hours=random.uniform(8, 25),
            )

            pred = models.AIPrediction(
                student_id=student.id,
                course_id=None,
                predicted_score=result["predicted_performance"],
                dropout_risk_pct=result["dropout_risk"],
                risk_level=result["risk_level"],
                confidence=result["confidence"],
                factors_json={
                    "attendance_pct": round(att_pct, 1),
                    "avg_score": round(avg_score, 1),
                    "assignment_ratio": round(assign_ratio, 1),
                },
            )
            db.add(pred)
            db.commit()
            db.refresh(pred)

            # ── Recommendations ────────────────────────────────────────
            recs = ml_models.ai_engine.generate_recommendations(
                attendance=att_pct,
                past_scores=avg_score,
                assignments=min(100, assign_ratio),
                hours=random.uniform(8, 25),
                risk_level=result["risk_level"],
            )
            for r in recs:
                rec = models.Recommendation(
                    student_id=student.id,
                    category=r["category"],
                    message=r["message"],
                    priority=r["priority"],
                )
                db.add(rec)
            db.commit()

        print("  - AI predictions & recommendations generated")

        # ── Notifications ─────────────────────────────────────────────
        all_users = [admin_user] + teacher_users + student_users
        for user in all_users:
            db.add(models.Notification(
                user_id=user.id,
                title="Welcome to AcademiQ!",
                message="Your account has been set up. Explore the AI-powered dashboard.",
                type="success",
            ))
        for su in student_users[:5]:
            db.add(models.Notification(
                user_id=su.id,
                title="⚠ Attendance Alert",
                message="Your attendance is below 75%. Please attend classes regularly.",
                type="warning",
            ))
        for su in student_users[5:10]:
            db.add(models.Notification(
                user_id=su.id,
                title="📈 Performance Improving",
                message="Your assignment scores are trending upward. Keep it up!",
                type="success",
            ))
        db.commit()
        print("  - Notifications created")

        # ── System Logs ───────────────────────────────────────────────
        logs = [
            ("AcademiQ API v2.0 started on port 8000", "INFO"),
            ("MySQL database connection established", "INFO"),
            (f"ML models trained — RandomForest accuracy: {ml_models.ai_engine.risk_accuracy*100:.1f}%", "INFO"),
            ("Seed data inserted: 20 students, 3 teachers, 6 courses", "INFO"),
            ("AI predictions generated for all 20 students", "INFO"),
            ("CORS middleware configured for localhost:5173", "INFO"),
        ]
        for action, level in logs:
            db.add(models.SystemLog(action=action, user_id=admin_user.id, level=level))
        db.commit()
        print("  - System logs recorded")

        print("\nSeeding complete!")
        print("=" * 50)
        print("Demo Credentials:")
        print("  Admin:   admin@academiq.com    / Admin@123")
        print("  Teacher: teacher1@academiq.com / Teacher@123")
        print("  Student: cs2021001@academiq.com / Student@123")
        print("=" * 50)

    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    force = "--force" in sys.argv
    if force:
        print("Force mode: dropping existing tables...")
        # Close any open connections before dropping
        engine.dispose()
        try:
            models.Base.metadata.drop_all(bind=engine)
            models.Base.metadata.create_all(bind=engine)
            print("  - All tables recreated")
        except Exception as e:
            print(f"Recreate failed: {e}")
            raise
    seed(force=force)
