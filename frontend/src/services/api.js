import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// ── Request Interceptor: attach JWT ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor: handle 401 ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────
export const authAPI = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const res = await api.post('/token', formData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/users/me');
    return res.data;
  },
  seedDemoDatabase: async () => {
    const res = await api.post('/admin/reseed');
    return res.data;
  },
};

// ── Analytics ────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: async () => {
    const res = await api.get('/analytics/dashboard');
    return res.data;
  },
  predict: async ({ attendance, past_scores, assignments, hours }) => {
    const res = await api.post('/analytics/predict', {
      attendance, past_scores, assignments, hours,
    });
    return res.data;
  },
  getLeaderboard: async (limit = 20) => {
    const res = await api.get(`/analytics/leaderboard?limit=${limit}`);
    return res.data;
  },
  getAtRisk: async () => {
    const res = await api.get('/analytics/at-risk');
    return res.data;
  },
  getModelStats: async () => {
    const res = await api.get('/analytics/model-stats');
    return res.data;
  },
  getRiskDistribution: async () => {
    const res = await api.get('/analytics/risk-distribution');
    return res.data;
  },
};

// ── Students ──────────────────────────────────────────────────────────
export const studentAPI = {
  getDashboard: async (studentId) => {
    const url = studentId ? `/students/dashboard?student_id=${studentId}` : '/students/dashboard';
    const res = await api.get(url);
    return res.data;
  },
  getMyCourses: async (studentId) => {
    const url = studentId ? `/students/me/courses?student_id=${studentId}` : '/students/me/courses';
    const res = await api.get(url);
    return res.data;
  },
  getMyRecommendations: async (studentId) => {
    const url = studentId ? `/students/me/recommendations?student_id=${studentId}` : '/students/me/recommendations';
    const res = await api.get(url);
    return res.data;
  },
  getMyAttendance: async (studentId) => {
    const url = studentId ? `/students/me/attendance?student_id=${studentId}` : '/students/me/attendance';
    const res = await api.get(url);
    return res.data;
  },
  getMyMarks: async (studentId) => {
    const url = studentId ? `/students/me/marks?student_id=${studentId}` : '/students/me/marks';
    const res = await api.get(url);
    return res.data;
  },
  getMyAssignments: async (studentId) => {
    const url = studentId ? `/students/me/assignments?student_id=${studentId}` : '/students/me/assignments';
    const res = await api.get(url);
    return res.data;
  },
  getMyPredictions: async (studentId) => {
    const url = studentId ? `/students/me/predictions?student_id=${studentId}` : '/students/me/predictions';
    const res = await api.get(url);
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/students/');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/students/${id}`);
    return res.data;
  },
};

// ── Teachers ─────────────────────────────────────────────────────────
export const teacherAPI = {
  getDashboard: async () => {
    const res = await api.get('/teachers/dashboard');
    return res.data;
  },
  getAtRiskStudents: async () => {
    const res = await api.get('/teachers/at-risk-students');
    return res.data;
  },
  getClassPerformance: async () => {
    const res = await api.get('/teachers/class-performance');
    return res.data;
  },
  getMyCourses: async () => {
    const res = await api.get('/courses/my');
    return res.data;
  },
  getCourseStudents: async (courseId) => {
    const res = await api.get(`/courses/${courseId}/students`);
    return res.data;
  },
};

// ── Courses ───────────────────────────────────────────────────────────
export const coursesAPI = {
  getAll: async () => {
    const res = await api.get('/courses/');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/courses/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/courses/', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/courses/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/courses/${id}`);
    return res.data;
  },
};

// ── Attendance ─────────────────────────────────────────────────────────
export const attendanceAPI = {
  markSingle: async (data) => {
    const res = await api.post('/attendance/', data);
    return res.data;
  },
  saveBulk: async (data) => {
    const res = await api.post('/attendance/bulk', data);
    return res.data;
  },
  getForDate: async (courseId, date) => {
    const res = await api.get(`/attendance/course/${courseId}/date/${date}`);
    return res.data;
  },
  getCourseSummary: async (courseId) => {
    const res = await api.get(`/attendance/course/${courseId}/summary`);
    return res.data;
  },
  getCourseDates: async (courseId) => {
    const res = await api.get(`/attendance/course/${courseId}/dates`);
    return res.data;
  },
  getEngagementSuggestions: async (courseId) => {
    const res = await api.get(`/attendance/course/${courseId}/engagement-suggestions`);
    return res.data;
  },
};

// ── Assignments ─────────────────────────────────────────────────────────
export const assignmentsAPI = {
  getCourseAssignments: async (courseId) => {
    const res = await api.get(`/assignments/course/${courseId}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/assignments/', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/assignments/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/assignments/${id}`);
    return res.data;
  },
  getMarks: async (assignmentId) => {
    const res = await api.get(`/assignments/${assignmentId}/marks`);
    return res.data;
  },
  saveMark: async (data) => {
    const res = await api.post('/assignments/marks', data);
    return res.data;
  },
  saveBulkMarks: async (data) => {
    const res = await api.post('/assignments/marks/bulk', data);
    return res.data;
  },
  updateMark: async (markId, data) => {
    const res = await api.put(`/assignments/marks/${markId}`, data);
    return res.data;
  },
};

// ── Notifications ─────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: async () => {
    const res = await api.get('/notifications/');
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data.unread_count;
  },
  markRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.patch('/notifications/mark-all-read');
    return res.data;
  },
};

// ── Admin ─────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
  // Users
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  createUser: async (data) => {
    const res = await api.post('/admin/users', data);
    return res.data;
  },
  updateUser: async (id, data) => {
    const res = await api.put(`/admin/users/${id}`, data);
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
  toggleUserActive: async (userId) => {
    const res = await api.patch(`/admin/users/${userId}/toggle-active`);
    return res.data;
  },
  // Courses
  getCourses: async () => {
    const res = await api.get('/admin/courses');
    return res.data;
  },
  createCourse: async (data) => {
    const res = await api.post('/admin/courses', data);
    return res.data;
  },
  updateCourse: async (id, data) => {
    const res = await api.put(`/admin/courses/${id}`, data);
    return res.data;
  },
  deleteCourse: async (id) => {
    const res = await api.delete(`/admin/courses/${id}`);
    return res.data;
  },
  // Enrollments
  getEnrollments: async () => {
    const res = await api.get('/admin/enrollments');
    return res.data;
  },
  enrollStudent: async (data) => {
    const res = await api.post('/admin/enrollments', data);
    return res.data;
  },
  removeEnrollment: async (id) => {
    const res = await api.delete(`/admin/enrollments/${id}`);
    return res.data;
  },
  // Teachers list for dropdowns
  getTeachersList: async () => {
    const res = await api.get('/admin/teachers-list');
    return res.data;
  },
  getLogs: async (limit = 50) => {
    const res = await api.get(`/admin/logs?limit=${limit}`);
    return res.data;
  },
};

// ── Search ────────────────────────────────────────────────────────────
export const searchAPI = {
  global: async (query) => {
    if (!query || query.trim().length < 1) return { students: [], courses: [], teachers: [] };
    const res = await api.get(`/analytics/search?q=${encodeURIComponent(query.trim())}`);
    return res.data;
  },
};

export default api;
