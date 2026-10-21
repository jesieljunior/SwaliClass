// SwaliClass REST API Client
// Connects to external C# (.NET 9) / Java 21 (Spring Boot 3) backend,
// with graceful in-memory mock fallback for offline and preview modes.

import {
  AuthResponseDto,
  CourseDto,
  ClassGroupDto,
  StudentDto,
  AttendanceSessionDto,
  ActivityDto,
  SubmissionDto,
  DashboardStatsDto,
  TeacherDashboardDto,
  TenantDto,
  InviteDto,
} from "./api-types";
import { mockSupabase, DEMO_USER } from "@/integrations/supabase/mock-client";

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "";
const AUTH_TOKEN_KEY = "swaliclass_auth_token";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // If an external backend URL is configured, call the live REST API
  if (API_BASE_URL) {
    const url = `${API_BASE_URL.replace(/\/$/, "")}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData,
      );
    }

    return response.json();
  }

  // Fallback to local in-memory simulation for preview environment
  return handleMockRequest<T>(endpoint, options);
}

// In-memory simulation handler replicating C# / Java Controller responses
async function handleMockRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
  const method = options.method?.toUpperCase() || "GET";
  const body = options.body ? JSON.parse(options.body as string) : null;

  // Simulate network latency (50-100ms)
  await new Promise((r) => setTimeout(r, 60));

  // --- Auth Endpoints ---
  if (endpoint.includes("/api/v1/auth/me")) {
    return {
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      full_name: DEMO_USER.user_metadata.full_name,
      role: "admin",
      tenant_id: "tenant-demo-1",
    } as unknown as T;
  }

  if (endpoint.includes("/api/v1/auth/login") && method === "POST") {
    const token = "mock-jwt-token-demo";
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    return {
      token,
      user: {
        id: DEMO_USER.id,
        email: body?.email || DEMO_USER.email,
        full_name: DEMO_USER.user_metadata.full_name,
        role: "admin",
        tenant_id: "tenant-demo-1",
      },
      tenant: {
        id: "tenant-demo-1",
        name: "Colégio Modelo Swali",
        plan: "professional",
      },
    } as unknown as T;
  }

  // --- Courses Endpoints ---
  if (endpoint.includes("/api/v1/courses")) {
    if (method === "GET") {
      const { data } = await mockSupabase.from("courses").select("*");
      return (data || []) as unknown as T;
    }
    if (method === "POST") {
      const { data } = await mockSupabase.from("courses").insert(body).select().single();
      return data as unknown as T;
    }
  }

  // --- Classes Endpoints ---
  if (endpoint.includes("/api/v1/classes")) {
    if (method === "GET") {
      const { data } = await mockSupabase.from("classes").select("*");
      return (data || []) as unknown as T;
    }
    if (method === "POST") {
      const { data } = await mockSupabase.from("classes").insert(body).select().single();
      return data as unknown as T;
    }
  }

  // --- Students Endpoints ---
  if (endpoint.includes("/api/v1/students")) {
    if (method === "GET") {
      const { data } = await mockSupabase.from("students").select("*");
      return (data || []) as unknown as T;
    }
    if (method === "POST") {
      const { data } = await mockSupabase.from("students").insert(body).select().single();
      return data as unknown as T;
    }
  }

  // --- Dashboard Endpoints ---
  if (endpoint.includes("/api/v1/dashboard/stats")) {
    const { data: students } = await mockSupabase.from("students").select("id");
    const { data: classes } = await mockSupabase.from("classes").select("id");
    const { data: courses } = await mockSupabase.from("courses").select("id");
    return {
      total_students: students?.length ?? 128,
      total_classes: classes?.length ?? 8,
      total_courses: courses?.length ?? 4,
      attendance_average_30d: 94.2,
      pending_grading_count: 5,
      recent_activities: [],
      class_performance: [],
    } as unknown as T;
  }

  // Default empty payload
  return {} as T;
}

export const apiClient = {
  getAuthToken: () => localStorage.getItem(AUTH_TOKEN_KEY),
  setAuthToken: (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token),
  clearAuthToken: () => localStorage.removeItem(AUTH_TOKEN_KEY),

  auth: {
    login: (credentials: { email: string; password?: string }) =>
      request<AuthResponseDto>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    me: () => request<any>("/api/v1/auth/me"),
    acceptInvite: (token: string, password: string, fullName: string) =>
      request<AuthResponseDto>("/api/v1/auth/accept-invite", {
        method: "POST",
        body: JSON.stringify({ token, password, full_name: fullName }),
      }),
  },

  courses: {
    list: () => request<CourseDto[]>("/api/v1/courses"),
    create: (course: Partial<CourseDto>) =>
      request<CourseDto>("/api/v1/courses", {
        method: "POST",
        body: JSON.stringify(course),
      }),
    update: (id: string, course: Partial<CourseDto>) =>
      request<CourseDto>(`/api/v1/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify(course),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/courses/${id}`, {
        method: "DELETE",
      }),
  },

  classes: {
    list: () => request<ClassGroupDto[]>("/api/v1/classes"),
    create: (classGroup: Partial<ClassGroupDto>) =>
      request<ClassGroupDto>("/api/v1/classes", {
        method: "POST",
        body: JSON.stringify(classGroup),
      }),
    update: (id: string, classGroup: Partial<ClassGroupDto>) =>
      request<ClassGroupDto>(`/api/v1/classes/${id}`, {
        method: "PUT",
        body: JSON.stringify(classGroup),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/classes/${id}`, {
        method: "DELETE",
      }),
  },

  students: {
    list: () => request<StudentDto[]>("/api/v1/students"),
    create: (student: Partial<StudentDto>) =>
      request<StudentDto>("/api/v1/students", {
        method: "POST",
        body: JSON.stringify(student),
      }),
    update: (id: string, student: Partial<StudentDto>) =>
      request<StudentDto>(`/api/v1/students/${id}`, {
        method: "PUT",
        body: JSON.stringify(student),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/students/${id}`, {
        method: "DELETE",
      }),
    importCsv: (csvRows: any[]) =>
      request<{ imported: number; errors: any[] }>("/api/v1/students/import-csv", {
        method: "POST",
        body: JSON.stringify({ students: csvRows }),
      }),
  },

  attendance: {
    getRoster: (classId: string, date: string) =>
      request<AttendanceSessionDto>(`/api/v1/attendance/roster?classId=${classId}&date=${date}`),
    save: (payload: { classId: string; date: string; records: any[] }) =>
      request<{ success: boolean; session_id: string }>("/api/v1/attendance/save", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  activities: {
    list: (classId?: string) =>
      request<ActivityDto[]>(`/api/v1/activities${classId ? `?classId=${classId}` : ""}`),
    create: (activity: Partial<ActivityDto>) =>
      request<ActivityDto>("/api/v1/activities", {
        method: "POST",
        body: JSON.stringify(activity),
      }),
    gradeSubmission: (submissionId: string, score: number, feedback?: string) =>
      request<SubmissionDto>(`/api/v1/submissions/${submissionId}/grade`, {
        method: "POST",
        body: JSON.stringify({ score, feedback }),
      }),
  },

  dashboard: {
    getStats: () => request<DashboardStatsDto>("/api/v1/dashboard/stats"),
    getTeacherStats: () => request<TeacherDashboardDto>("/api/v1/dashboard/teacher"),
  },

  tenants: {
    list: () => request<TenantDto[]>("/api/v1/admin/tenants"),
    create: (data: Partial<TenantDto> & { admin_email: string }) =>
      request<TenantDto>("/api/v1/admin/tenants", { method: "POST", body: JSON.stringify(data) }),
    getInvites: () => request<InviteDto[]>("/api/v1/admin/invites"),
    createInvite: (email: string, role: string) =>
      request<InviteDto>("/api/v1/admin/invites", {
        method: "POST",
        body: JSON.stringify({ email, role }),
      }),
  },
};
