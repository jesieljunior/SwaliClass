// Contract types for the SwaliClass RESTful API (C# .NET 9 / Java 21 / React)

export type UserRole = "super_admin" | "admin" | "coordinator" | "teacher" | "student";

export type TenantPlan = "starter" | "professional" | "business" | "enterprise";

export interface TenantDto {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: "active" | "suspended" | "trial";
  contact_email: string;
  created_at: string;
  user_count?: number;
  student_count?: number;
}

export interface UserProfileDto {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  tenant_id: string;
  avatar_url?: string | null;
}

export interface AuthResponseDto {
  token: string;
  user: UserProfileDto;
  tenant: {
    id: string;
    name: string;
    plan: TenantPlan;
  };
}

export interface CourseDto {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string | null;
  category?: string | null;
  workload_hours?: number | null;
  class_count?: number;
  student_count?: number;
  created_at?: string;
}

export interface ClassGroupDto {
  id: string;
  course_id: string;
  course_name?: string;
  name: string;
  academic_term?: string | null;
  schedule?: string | null;
  max_capacity?: number | null;
  teacher_id?: string | null;
  teacher_name?: string | null;
  student_count?: number;
  created_at?: string;
}

export interface StudentDto {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  enrollment_number?: string | null;
  status: "active" | "inactive" | "transferred" | "graduated";
  birth_date?: string | null;
  guardian_name?: string | null;
  guardian_contact?: string | null;
  classes?: {
    id: string;
    name: string;
    course_name?: string;
  }[];
  attendance_rate?: number;
  average_grade?: number;
  created_at?: string;
}

export interface AttendanceRecordDto {
  student_id: string;
  student_name: string;
  enrollment_number?: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string | null;
}

export interface AttendanceSessionDto {
  id: string;
  class_id: string;
  class_name?: string;
  session_date: string;
  topic?: string | null;
  records: AttendanceRecordDto[];
  total_students: number;
  present_count: number;
  absent_count: number;
  attendance_rate: number;
  created_by?: string;
  updated_at?: string;
}

export interface ActivityDto {
  id: string;
  class_id: string;
  class_name?: string;
  title: string;
  description?: string | null;
  due_date: string;
  max_score: number;
  weight?: number;
  status: "draft" | "published" | "closed";
  submission_count?: number;
  graded_count?: number;
  created_at?: string;
}

export interface SubmissionDto {
  id: string;
  activity_id: string;
  student_id: string;
  student_name: string;
  submitted_at: string;
  file_url?: string | null;
  file_name?: string | null;
  score?: number | null;
  feedback?: string | null;
  graded_at?: string | null;
  graded_by?: string | null;
}

export interface DashboardStatsDto {
  total_students: number;
  total_classes: number;
  total_courses: number;
  attendance_average_30d: number;
  pending_grading_count: number;
  recent_activities: ActivityDto[];
  class_performance: {
    class_id: string;
    class_name: string;
    average_attendance: number;
    student_count: number;
  }[];
}

export interface TeacherDashboardDto {
  classes: ClassGroupDto[];
  pending_submissions_count: number;
  upcoming_sessions: {
    class_id: string;
    class_name: string;
    date: string;
    schedule: string;
  }[];
  recent_grades: {
    activity_title: string;
    class_name: string;
    submissions_graded: number;
    submissions_total: number;
  }[];
}

export interface StudentPortalDto {
  student: StudentDto;
  classes: ClassGroupDto[];
  upcoming_activities: ActivityDto[];
  recent_grades: {
    activity_id: string;
    activity_title: string;
    score: number;
    max_score: number;
    feedback?: string | null;
    graded_at: string;
  }[];
  attendance_summary: {
    class_id: string;
    class_name: string;
    sessions_total: number;
    present_total: number;
    rate: number;
  }[];
}

export interface InviteDto {
  id: string;
  email: string;
  role: UserRole;
  status: "pending" | "accepted" | "expired";
  tenant_id: string;
  token: string;
  invite_url: string;
  created_at: string;
  expires_at: string;
}
