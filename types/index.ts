// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'staff';
  avatar?: string;
  createdAt: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// Student Types
export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  enrollmentDate: string;
  classId?: string;
  className?: string;
  section?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  healthData?: HealthData;
  createdAt: string;
  updatedAt: string;
}

export interface HealthData {
  bloodGroup?: string;
  allergies?: string[];
  medications?: string[];
  emergencyContact?: string;
  medicalNotes?: string;
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  courseCode?: string;
  grade: string;
  academicYear: string;
  credits: number;
  createdAt: string;
}

// Teacher Types
export interface Teacher {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address?: string;
  qualification: string;
  specialization: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  schedule?: Schedule[];
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  teacherId: string;
  courseId: string;
  courseName: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  room?: string;
  className?: string;
  academicYear?: string;
  section?: string;
}

// Course Types
export interface Course {
  id: string;
  courseCode: string;
  name: string;
  description?: string;
  credits: number;
  teacherId?: string;
  teacherName?: string;
  department: string;
  academicYear: string;
  maxStudents?: number;
  enrolledStudents?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Attendance Types
export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: string;
  notes?: string;
  createdAt: string;
}

export interface AttendanceReport {
  studentId: string;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
  period: {
    start: string;
    end: string;
  };
}

// Admission Types
export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  appliedClass: string;
  academicYear: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'enrolled';
  documents: AdmissionDocument[];
  notes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AdmissionDocument {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  verified: boolean;
}

// Financial Types
export interface FeeStructure {
  id: string;
  name: string;
  description?: string;
  amount: number;
  feeType: 'tuition' | 'library' | 'laboratory' | 'sports' | 'transport' | 'hostel' | 'other';
  academicYear: string;
  dueDate: string;
  applicableTo: 'all' | 'class' | 'student';
  classId?: string;
  studentId?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  feeStructureId: string;
  feeName: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'online' | 'bank_transfer';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paidAt?: string;
  createdAt: string;
}

export interface FinancialReport {
  period: {
    start: string;
    end: string;
  };
  totalRevenue: number;
  totalPending: number;
  totalCollected: number;
  feeBreakdown: {
    feeType: string;
    amount: number;
  }[];
  paymentMethods: {
    method: string;
    count: number;
    amount: number;
  }[];
}

// Academic Types
export interface Gradebook {
  id: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  assignments: AssignmentGrade[];
  exams: ExamGrade[];
  finalGrade?: string;
  gpa?: number;
  academicYear: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string;
  dueDate: string;
  maxScore: number;
  createdBy: string;
  createdAt: string;
  submissions: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  fileUrl?: string;
  status: 'submitted' | 'graded' | 'late';
  score?: number;
  feedback?: string;
}

export interface AssignmentGrade {
  assignmentId: string;
  assignmentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
}

export interface Exam {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string;
  examDate: string;
  duration: number; // minutes
  maxScore: number;
  room?: string;
  createdBy: string;
  createdAt: string;
  results: ExamResult[];
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  publishedAt: string;
}

export interface ExamGrade {
  examId: string;
  examName: string;
  score: number;
  maxScore: number;
  percentage: number;
  examDate: string;
}

export interface Timetable {
  id: string;
  classId: string;
  className: string;
  academicYear: string;
  schedule: TimetableSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  room?: string;
  durationMinutes?: number;
  section?: string;
}

// Communication Types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  subject: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  targetAudience: 'all' | 'students' | 'teachers' | 'parents' | 'staff';
  priority: 'low' | 'medium' | 'high';
  publishedAt: string;
  expiresAt?: string;
  attachments?: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  organizerId: string;
  organizerName: string;
  targetAudience: 'all' | 'students' | 'teachers' | 'parents' | 'staff';
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Holiday Types
export interface Holiday {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  holidayType: 'holiday' | 'festival' | 'exam' | 'break' | 'other';
  isRecurring: boolean;
  recurringPattern?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

// Grade Types
export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  classId: string;
  className: string;
  gradeLevel?: string;
  academicYear: string;
  grade: string;
  marksObtained?: number;
  maxMarks?: number;
  examType: 'unit_test' | 'mid_term' | 'final' | 'assignment' | 'project' | 'practical' | 'other';
  examName?: string;
  remarks?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressCard {
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    name: string;
  };
  class: {
    id: string;
    name: string;
    gradeLevel?: string;
  };
  academicYear: string;
  subjects: Array<{
    courseId: string;
    courseCode: string;
    courseName: string;
    finalGrade: string | null;
    finalMarks: number | null;
    totalMarks: number | null;
    averagePercentage: number | null;
    grades: Array<{
      id: string;
      examType: string;
      examName?: string;
      grade: string;
      marksObtained: number | null;
      maxMarks: number | null;
      remarks?: string;
      createdAt: string;
    }>;
  }>;
  overall: {
    grade: string | null;
    percentage: number | null;
    totalSubjects: number;
    subjectsWithGrades: number;
  };
}

// Common Types
export interface SelectOption {
  label: string;
  value: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
}

