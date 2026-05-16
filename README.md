# 🎓 AcademiQ AI — Academic Management System

AcademiQ is a production-ready, AI-powered full-stack academic management system. It integrates a beautifully designed React/Tailwind frontend featuring premium glassmorphism UI with a robust FastAPI backend and MySQL database. The system offers predictive AI analytics using Scikit-Learn to forecast student performance and detect at-risk students before they drop out.

![AcademiQ Premium Design](frontend/public/favicon.ico) <!-- Placeholder -->

## ✨ Features

- **🛡️ Admin Dashboard**: Complete CRUD management for Users (Students, Teachers, Admins), Courses, and Enrollments.
- **👩‍🏫 Teacher Portal**: Manage assignments, seamlessly mark student attendance, enter marks, and view class AI insights.
- **🎓 Student Portal**: Track attendance, upcoming assignment deadlines, and view personalized AI-generated risk levels and recommendations.
- **🧠 AI Analytics Engine**: Uses Random Forest Regression and Classification to predict student performance (GPA) and generate dropout risk probabilities based on engagement, attendance, and assignment scores.
- **📊 Reporting Module**: Export beautifully branded PDF reports for offline analysis (jsPDF integration).
- **💡 Innovative Engagement Attendance**: The AI automatically suggests marking students "Virtual Present" if their online portal engagement score is >= 75%.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** (Vite)
- **TailwindCSS 3.4** (with custom glassmorphism utilities)
- **Lucide React** (Icons)
- **jsPDF & jsPDF-Autotable** (PDF Exports)
- **Recharts** (Data Visualization)
- **Axios** (API Networking)

### Backend
- **Python 3.10+**
- **FastAPI** (REST API & Routing)
- **SQLAlchemy** (ORM)
- **MySQL** (Database)
- **Scikit-Learn & Pandas** (AI Predictions & Modeling)
- **Passlib & JWT** (Authentication & Security)

---

## 🚀 Getting Started

Follow these steps to run the complete system locally.

### 1. Database Setup
Ensure you have MySQL Server running on `localhost:3306`.
Create an empty database named `academiq`:
```sql
CREATE DATABASE academiq;
```

### 2. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Configure Environment Variables (`.env`):
Ensure a `.env` file exists in the `backend` directory with the following:
```ini
DB_HOST=localhost
DB_PORT=3306
DB_NAME=academiq
DB_USER=root
DB_PASSWORD=your_password

SECRET_KEY=academiq_super_secret_jwt_key_2026_x9z3p7q
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```
*(Replace `your_password` with your actual MySQL credentials).*

Seed the Database:
Generate demo users, courses, assignments, and AI data.
```bash
python seed.py --force
```

Start the FastAPI Server:
```bash
uvicorn main:app --reload
```
The backend API will run on **http://localhost:8000** (Swagger UI available at `/docs`).

### 3. Frontend Setup
Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Vite Development Server:
```bash
npm run dev
```
The frontend UI will run on **http://localhost:5173**.

---

## 🔑 Demo Credentials

After running `python seed.py --force`, the following accounts will be available to explore the role-based dashboards:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@academiq.com` | `Admin@123` |
| **Teacher** | `teacher1@academiq.com` | `Teacher@123` |
| **Student** | `cs2021001@academiq.com` | `Student@123` |

*(Note: You can also click the quick-login buttons on the login screen to autofill these credentials).*

---

## 🔄 Usage Workflow

To see the platform's full capabilities, try this end-to-end workflow:

1. **Admin Layer**: Log in as Admin. Navigate to the Admin Panel. Create a new course, register a new teacher, and enroll a few students into the course.
2. **Teacher Layer**: Log out, then log in as the Teacher. Navigate to the Teacher Dashboard.
   - Go to the **Attendance** tab. Select the course and date. Click "Apply AI Suggestions" to let the Engagement AI automatically mark highly active students as present, then save.
   - Go to the **Assignments** tab to create a new quiz.
   - Go to the **Marks** tab to grade submissions.
3. **AI Engine**: (Background Process) As the teacher enters marks and attendance, the AI model recalculates the class's risk distribution.
4. **Student Layer**: Log out, then log in as a Student. View the Student Dashboard to see updated attendance percentages, predicted final scores, risk warnings, and personalized learning recommendations.
5. **Reporting**: Log in as Admin/Teacher, navigate to the **Reports** tab, and download a branded PDF report of the newly added data.

---

## 🔒 Security & CORS
CORS is explicitly configured in `backend/main.py` to securely communicate with the React frontend using credentialed requests (JWTs). Ensure you access the frontend exactly via `http://localhost:5173` to prevent browser CORS blockages.
