from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
import datetime


# ─────────────────── Auth ───────────────────
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ─────────────────── Admin User Management ───────────────────
class AdminUserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "student"           # student | teacher | admin
    is_active: bool = True
    # Student-specific
    roll_number: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = 1
    # Teacher-specific
    employee_id: Optional[str] = None
    designation: Optional[str] = None

class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    # Student-specific
    roll_number: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    # Teacher-specific
    employee_id: Optional[str] = None
    designation: Optional[str] = None

class AdminUserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime.datetime
    # Extra profile info
    roll_number: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    designation: Optional[str] = None
    employee_id: Optional[str] = None
    profile_id: Optional[int] = None  # student.id or teacher.id

    class Config:
        from_attributes = True


# ─────────────────── Student ───────────────────
class StudentResponse(BaseModel):
    id: int
    user_id: int
    roll_number: str
    department: Optional[str]
    semester: int
    gpa: float
    full_name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


# ─────────────────── Teacher ───────────────────
class TeacherResponse(BaseModel):
    id: int
    user_id: int
    department: Optional[str]
    designation: Optional[str]
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


# ─────────────────── Course ───────────────────
class CourseCreate(BaseModel):
    title: str
    code: str
    description: Optional[str] = None
    teacher_id: int
    credits: int = 3
    semester: int = 1
    max_students: int = 60

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    teacher_id: Optional[int] = None
    credits: Optional[int] = None
    semester: Optional[int] = None
    max_students: Optional[int] = None
    is_active: Optional[bool] = None

class CourseResponse(BaseModel):
    id: int
    title: str
    code: str
    description: Optional[str]
    teacher_id: int
    credits: int
    semester: int
    max_students: int
    is_active: bool

    class Config:
        from_attributes = True

class CourseDetailResponse(CourseResponse):
    teacher_name: Optional[str] = None
    enrolled_count: int = 0
    avg_score: Optional[float] = None
    avg_attendance: Optional[float] = None


# ─────────────────── Enrollment ───────────────────
class EnrollmentCreate(BaseModel):
    student_id: int
    course_id: int

class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    enrolled_at: datetime.datetime
    status: str

    class Config:
        from_attributes = True

class EnrollmentDetailResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    enrolled_at: datetime.datetime
    status: str
    student_name: Optional[str] = None
    student_roll: Optional[str] = None
    course_title: Optional[str] = None
    course_code: Optional[str] = None


# ─────────────────── Attendance ───────────────────
class AttendanceCreate(BaseModel):
    student_id: int
    course_id: int
    date: datetime.date
    is_present: bool = True

class AttendanceBulkItem(BaseModel):
    student_id: int
    is_present: bool

class AttendanceBulkCreate(BaseModel):
    course_id: int
    date: datetime.date
    records: List[AttendanceBulkItem]

class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    date: datetime.date
    is_present: bool

    class Config:
        from_attributes = True

class AttendanceSummary(BaseModel):
    student_id: int
    course_id: int
    total_classes: int
    attended: int
    attendance_pct: float

class AttendanceDateRecord(BaseModel):
    student_id: int
    full_name: str
    roll_number: str
    is_present: bool


# ─────────────────── Assignment ───────────────────
class AssignmentCreate(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime.datetime] = None
    max_score: float = 100.0

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime.datetime] = None
    max_score: Optional[float] = None

class AssignmentResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: Optional[str]
    due_date: Optional[datetime.datetime]
    max_score: float
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ─────────────────── Marks ───────────────────
class MarkCreate(BaseModel):
    student_id: int
    assignment_id: int
    score: float
    feedback: Optional[str] = None

class MarkUpdate(BaseModel):
    score: Optional[float] = None
    feedback: Optional[str] = None

class MarkResponse(BaseModel):
    id: int
    student_id: int
    assignment_id: int
    score: float
    submitted_at: datetime.datetime
    feedback: Optional[str]

    class Config:
        from_attributes = True

class MarkDetailResponse(BaseModel):
    mark_id: Optional[int] = None
    student_id: int
    full_name: str
    roll_number: str
    score: Optional[float] = None
    max_score: float
    pct: Optional[float] = None
    feedback: Optional[str] = None
    submitted: bool = False

class BulkMarkItem(BaseModel):
    student_id: int
    score: float
    feedback: Optional[str] = None

class BulkMarkCreate(BaseModel):
    assignment_id: int
    marks: List[BulkMarkItem]


# ─────────────────── AI Prediction ───────────────────
class PredictionRequest(BaseModel):
    attendance: float
    past_scores: float
    assignments: float
    hours: float

class PredictionResponse(BaseModel):
    predicted_performance: float
    dropout_risk: float
    risk_level: str
    confidence: float
    recommendations: List[str]

class AIPredictionRecord(BaseModel):
    id: int
    student_id: int
    course_id: Optional[int]
    predicted_score: float
    dropout_risk_pct: float
    risk_level: str
    confidence: float
    factors_json: Optional[Dict[str, Any]]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ─────────────────── Recommendation ───────────────────
class RecommendationResponse(BaseModel):
    id: int
    student_id: int
    category: str
    message: str
    priority: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ─────────────────── Notification ───────────────────
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ─────────────────── Dashboard Responses ───────────────────
class StudentDashboard(BaseModel):
    attendance_rate: float
    performance_score: float
    courses_enrolled: int
    dropout_risk: float
    prediction_accuracy: float
    at_risk_count: int
    gpa: float
    assignments_submitted: int
    assignments_total: int

class TeacherDashboard(BaseModel):
    total_students: int
    active_courses: int
    avg_class_score: float
    avg_attendance: float
    at_risk_count: int
    assignments_graded: int

class DashboardMetrics(BaseModel):
    attendance: float
    performance_score: float
    courses_enrolled: int
    dropout_risk: float
    prediction_accuracy: float

class LeaderboardEntry(BaseModel):
    rank: int
    student_id: int
    full_name: str
    roll_number: str
    department: str
    avg_score: float
    attendance_pct: float
    gpa: float
    risk_level: str

class AtRiskStudent(BaseModel):
    student_id: int
    full_name: str
    roll_number: str
    course_name: str
    risk_score: float
    risk_level: str
    attendance_pct: float
    action: str

class AdminStats(BaseModel):
    total_users: int
    total_students: int
    total_teachers: int
    total_courses: int
    total_predictions: int
    avg_prediction_accuracy: float
