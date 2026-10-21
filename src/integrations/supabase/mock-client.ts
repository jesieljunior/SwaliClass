import {
  students as rawStudents,
  courses as rawCourses,
  classes as rawClasses,
  tenants as rawTenants,
} from "@/lib/mock-data";

export const DEMO_USER = {
  id: "demo-user-123",
  email: "admin@swaliclass.com",
  user_metadata: { full_name: "Admin SwaliClass" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

// In-memory tables initialized with mock data
class MockDatabase {
  tenants: any[] = [];
  courses: any[] = [];
  classes: any[] = [];
  students: any[] = [];
  enrollments: any[] = [];
  attendance_sessions: any[] = [];
  attendance_records: any[] = [];
  activities: any[] = [];
  submissions: any[] = [];
  submission_files: any[] = [];
  class_teachers: any[] = [];
  user_roles: any[] = [];
  profiles: any[] = [];
  invites: any[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.tenants = rawTenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      plan: t.plan.toLowerCase(),
      contact_email: `contato@${t.name.toLowerCase().replace(/\s+/g, "")}.com.br`,
      status: t.status === "ativo" ? "active" : "trial",
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    }));

    this.courses = rawCourses.map((c) => ({
      id: c.id,
      tenant_id: "ten1",
      name: c.name,
      description: c.description,
      category: c.category,
      workload_hours: 80,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    }));

    this.classes = rawClasses.map((cl, i) => ({
      id: cl.id,
      tenant_id: "ten1",
      course_id: rawCourses[i % rawCourses.length].id,
      name: cl.name,
      schedule: cl.schedule,
      start_date: "2026-02-01",
      end_date: "2026-12-15",
      room: `Sala ${101 + i}`,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    }));

    this.students = rawStudents.map((s) => ({
      id: s.id,
      tenant_id: "ten1",
      full_name: s.name,
      email: s.email,
      phone: s.phone,
      document: "123.456.789-00",
      birth_date: s.birthDate,
      guardian_name: "Responsável Legal",
      guardian_phone: s.phone,
      notes: "Aluno matriculado normalmente.",
      user_id: s.id === "s1" ? "student-user-1" : null,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    }));

    // Enrollments
    this.enrollments = [
      { id: "e1", tenant_id: "ten1", student_id: "s1", class_id: "t1", active: true },
      { id: "e2", tenant_id: "ten1", student_id: "s2", class_id: "t1", active: true },
      { id: "e3", tenant_id: "ten1", student_id: "s3", class_id: "t1", active: true },
      { id: "e4", tenant_id: "ten1", student_id: "s7", class_id: "t1", active: true },
      { id: "e5", tenant_id: "ten1", student_id: "s10", class_id: "t1", active: true },
      { id: "e6", tenant_id: "ten1", student_id: "s4", class_id: "t2", active: true },
      { id: "e7", tenant_id: "ten1", student_id: "s5", class_id: "t2", active: true },
      { id: "e8", tenant_id: "ten1", student_id: "s8", class_id: "t2", active: true },
      { id: "e9", tenant_id: "ten1", student_id: "s11", class_id: "t2", active: true },
      { id: "e10", tenant_id: "ten1", student_id: "s6", class_id: "t3", active: true },
      { id: "e11", tenant_id: "ten1", student_id: "s9", class_id: "t3", active: true },
      { id: "e12", tenant_id: "ten1", student_id: "s12", class_id: "t3", active: true },
    ];

    // Seed attendance sessions for past 7 days
    this.attendance_sessions = [];
    this.attendance_records = [];
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(Date.now() - dayOffset * 86400000).toISOString().slice(0, 10);
      const sessId = `sess-${dayOffset}`;
      this.attendance_sessions.push({
        id: sessId,
        tenant_id: "ten1",
        class_id: "t1",
        session_date: date,
        teacher_id: DEMO_USER.id,
        topic: `Aula ${7 - dayOffset} — Revisão e Prática`,
        notes: "Participação ativa da turma.",
        created_at: new Date(Date.now() - dayOffset * 86400000).toISOString(),
        updated_at: new Date(Date.now() - dayOffset * 86400000).toISOString(),
      });

      const t1Students = ["s1", "s2", "s3", "s7", "s10"];
      t1Students.forEach((stId, idx) => {
        const statuses = ["presente", "presente", "presente", "atrasado", "ausente"];
        const status =
          stId === "s2" && dayOffset % 2 === 0
            ? "ausente"
            : statuses[(idx + dayOffset) % statuses.length];
        this.attendance_records.push({
          id: `rec-${sessId}-${stId}`,
          tenant_id: "ten1",
          session_id: sessId,
          student_id: stId,
          status,
          created_at: new Date().toISOString(),
        });
      });
    }

    // Class teachers
    this.class_teachers = [
      {
        id: "ct1",
        tenant_id: "ten1",
        class_id: "t1",
        teacher_id: DEMO_USER.id,
        created_at: new Date().toISOString(),
      },
      {
        id: "ct2",
        tenant_id: "ten1",
        class_id: "t2",
        teacher_id: DEMO_USER.id,
        created_at: new Date().toISOString(),
      },
    ];

    // Activities
    this.activities = [
      {
        id: "act1",
        tenant_id: "ten1",
        class_id: "t1",
        title: "Lista de Exercícios 1",
        description: "Exercícios de fixação do capítulo 1 ao 3",
        due_at: new Date(Date.now() + 3 * 86400000).toISOString(),
        max_grade: 10,
        type: "exercicio",
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: "act2",
        tenant_id: "ten1",
        class_id: "t1",
        title: "Redação Dissertativa",
        description: "Tema atual com mínimo de 30 linhas",
        due_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        max_grade: 10,
        type: "redacao",
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ];

    // Submissions
    this.submissions = [
      {
        id: "sub1",
        tenant_id: "ten1",
        activity_id: "act2",
        student_id: "s1",
        grade: 9.5,
        status: "corrigida",
        feedback: "Excelente argumentação e coesão textual.",
        submitted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        graded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: "sub2",
        tenant_id: "ten1",
        activity_id: "act2",
        student_id: "s3",
        grade: 8.0,
        status: "corrigida",
        feedback: "Bom desenvolvimento dos argumentos.",
        submitted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        graded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: "sub3",
        tenant_id: "ten1",
        activity_id: "act1",
        student_id: "s1",
        grade: null,
        status: "entregue",
        feedback: null,
        submitted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        graded_at: null,
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ];

    // User Roles
    this.user_roles = [
      {
        id: "ur1",
        tenant_id: "ten1",
        user_id: DEMO_USER.id,
        role: "super_admin",
        created_at: new Date().toISOString(),
      },
      {
        id: "ur2",
        tenant_id: "ten1",
        user_id: DEMO_USER.id,
        role: "admin_instituicao",
        created_at: new Date().toISOString(),
      },
      {
        id: "ur3",
        tenant_id: "ten1",
        user_id: DEMO_USER.id,
        role: "professor",
        created_at: new Date().toISOString(),
      },
    ];

    // Profiles
    this.profiles = [
      {
        id: DEMO_USER.id,
        tenant_id: "ten1",
        email: DEMO_USER.email,
        full_name: DEMO_USER.user_metadata.full_name,
        created_at: new Date().toISOString(),
      },
    ];

    // Invites
    this.invites = [
      {
        id: "inv1",
        tenant_id: "ten1",
        email: "prof.mariana@escola.com",
        role: "professor",
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        accepted_at: null,
        created_at: new Date().toISOString(),
        token: "token-demo-invite-12345",
      },
    ];
  }
}

export const mockDb = new MockDatabase();

class MockQueryBuilder {
  private tableName: string;
  private filters: ((row: any) => boolean)[] = [];
  private orderFn: ((a: any, b: any) => number) | null = null;
  private limitCount: number | null = null;
  private selectCols: string | null = null;
  private isHeadOnly = false;
  private isCountExact = false;
  private isMaybeSingle = false;
  private isSingle = false;
  private action: "select" | "insert" | "update" | "delete" = "select";
  private payload: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = "*", options?: { count?: string; head?: boolean }) {
    this.selectCols = columns;
    if (options?.head) this.isHeadOnly = true;
    if (options?.count === "exact") this.isCountExact = true;
    return this;
  }

  insert(values: any | any[]) {
    this.action = "insert";
    this.payload = values;
    return this;
  }

  update(values: any) {
    this.action = "update";
    this.payload = values;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  in(column: string, values: any[]) {
    const set = new Set(values);
    this.filters.push((row) => set.has(row[column]));
    return this;
  }

  ilike(column: string, pattern: string) {
    const clean = pattern.replace(/%/g, "").toLowerCase();
    this.filters.push((row) =>
      String(row[column] ?? "")
        .toLowerCase()
        .includes(clean),
    );
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((row) => {
      // Support nested column dot notation like attendance_sessions.session_date
      if (column.includes(".")) {
        const [rel, col] = column.split(".");
        const relData = row[rel];
        if (relData) return relData[col] >= value;
      }
      return row[column] >= value;
    });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((row) => {
      if (column.includes(".")) {
        const [rel, col] = column.split(".");
        const relData = row[rel];
        if (relData) return relData[col] <= value;
      }
      return row[column] <= value;
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending ?? true;
    this.orderFn = (a, b) => {
      const va = a[column];
      const vb = b[column];
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  private resolveRowRelations(row: any, tableName: string): any {
    const cloned = { ...row };
    if (tableName === "classes") {
      cloned.courses = mockDb.courses.find((c) => c.id === row.course_id) ?? null;
      cloned.enrollments = mockDb.enrollments.filter((e) => e.class_id === row.id);
    } else if (tableName === "courses") {
      cloned.classes = mockDb.classes
        .filter((cl) => cl.course_id === row.id)
        .map((cl) => ({
          ...cl,
          students: mockDb.enrollments.filter((e) => e.class_id === cl.id),
        }));
    } else if (tableName === "students") {
      cloned.enrollments = mockDb.enrollments
        .filter((e) => e.student_id === row.id)
        .map((e) => ({
          ...e,
          classes: mockDb.classes.find((cl) => cl.id === e.class_id) ?? null,
        }));
    } else if (tableName === "enrollments") {
      cloned.students = mockDb.students.find((s) => s.id === row.student_id) ?? null;
      cloned.classes = mockDb.classes.find((cl) => cl.id === row.class_id) ?? null;
    } else if (tableName === "attendance_sessions") {
      const cls = mockDb.classes.find((cl) => cl.id === row.class_id);
      cloned.classes = cls
        ? {
            ...cls,
            courses: mockDb.courses.find((c) => c.id === cls.course_id) ?? null,
          }
        : null;
    } else if (tableName === "attendance_records") {
      cloned.students = mockDb.students.find((s) => s.id === row.student_id) ?? null;
      const sess = mockDb.attendance_sessions.find((s) => s.id === row.session_id);
      cloned.attendance_sessions = sess ?? null;
    } else if (tableName === "activities") {
      const cls = mockDb.classes.find((cl) => cl.id === row.class_id);
      cloned.classes = cls
        ? {
            ...cls,
            courses: mockDb.courses.find((c) => c.id === cls.course_id) ?? null,
          }
        : null;
    } else if (tableName === "submissions") {
      cloned.students = mockDb.students.find((s) => s.id === row.student_id) ?? null;
      cloned.activities = mockDb.activities.find((a) => a.id === row.activity_id) ?? null;
    } else if (tableName === "invites") {
      cloned.tenants = mockDb.tenants.find((t) => t.id === row.tenant_id) ?? null;
    } else if (tableName === "class_teachers") {
      const cls = mockDb.classes.find((cl) => cl.id === row.class_id);
      cloned.classes = cls
        ? {
            ...cls,
            courses: mockDb.courses.find((c) => c.id === cls.course_id) ?? null,
          }
        : null;
    }
    return cloned;
  }

  async execute(): Promise<{ data: any; error: any; count?: number }> {
    const table = (mockDb as any)[this.tableName];
    if (!table || !Array.isArray(table)) {
      return { data: [], error: null, count: 0 };
    }

    if (this.action === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted: any[] = [];
      for (const item of items) {
        const row = {
          id: item.id || `gen-${Math.random().toString(36).slice(2, 10)}`,
          created_at: new Date().toISOString(),
          ...item,
        };
        table.push(row);
        inserted.push(this.resolveRowRelations(row, this.tableName));
      }
      const data = this.isSingle
        ? inserted[0]
        : Array.isArray(this.payload)
          ? inserted
          : inserted[0];
      return { data, error: null };
    }

    if (this.action === "update") {
      let updated: any[] = [];
      for (let i = 0; i < table.length; i++) {
        const row = table[i];
        if (this.filters.every((f) => f(row))) {
          table[i] = { ...row, ...this.payload, updated_at: new Date().toISOString() };
          updated.push(this.resolveRowRelations(table[i], this.tableName));
        }
      }
      const data = this.isSingle ? updated[0] : updated;
      return { data, error: null };
    }

    if (this.action === "delete") {
      const kept: any[] = [];
      for (const row of table) {
        if (!this.filters.every((f) => f(row))) {
          kept.push(row);
        }
      }
      (mockDb as any)[this.tableName] = kept;
      return { data: null, error: null };
    }

    // Default: select
    let rows = table.filter((row) => this.filters.every((f) => f(row)));
    const totalCount = rows.length;

    if (this.isHeadOnly) {
      return { data: null, error: null, count: totalCount };
    }

    if (this.orderFn) {
      rows.sort(this.orderFn);
    }

    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    const resolved = rows.map((r) => this.resolveRowRelations(r, this.tableName));

    if (this.isSingle) {
      return {
        data: resolved[0] ?? null,
        error: resolved[0] ? null : { message: "Row not found" },
        count: totalCount,
      };
    }

    if (this.isMaybeSingle) {
      return { data: resolved[0] ?? null, error: null, count: totalCount };
    }

    return {
      data: resolved,
      error: null,
      count: this.isCountExact ? totalCount : undefined,
    };
  }

  // Thenable interface so `await supabase.from(...).select(...)` works directly
  then(
    onfulfilled?: (value: { data: any; error: any; count?: number }) => any,
    onrejected?: (reason: any) => any,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export function createMockSupabaseClient() {
  const listeners = new Set<(event: string, session: any) => void>();

  return {
    auth: {
      getUser: async () => ({
        data: { user: DEMO_USER },
        error: null,
      }),
      getSession: async () => ({
        data: {
          session: {
            access_token: "mock-demo-token",
            token_type: "bearer",
            user: DEMO_USER,
            expires_in: 3600,
          },
        },
        error: null,
      }),
      getClaims: async (_token: string) => ({
        data: {
          claims: {
            sub: DEMO_USER.id,
            email: DEMO_USER.email,
            user_metadata: DEMO_USER.user_metadata,
          },
        },
        error: null,
      }),
      onAuthStateChange: (cb: (event: string, session: any) => void) => {
        listeners.add(cb);
        setTimeout(() => {
          cb("SIGNED_IN", {
            access_token: "mock-demo-token",
            user: DEMO_USER,
          });
        }, 0);
        return {
          data: {
            subscription: {
              unsubscribe: () => listeners.delete(cb),
            },
          },
        };
      },
      signInWithPassword: async () => ({
        data: {
          user: DEMO_USER,
          session: { access_token: "mock-demo-token", user: DEMO_USER },
        },
        error: null,
      }),
      signUp: async () => ({
        data: { user: DEMO_USER },
        error: null,
      }),
      signOut: async () => ({
        error: null,
      }),
      resetPasswordForEmail: async () => ({
        data: {},
        error: null,
      }),
      updateUser: async () => ({
        data: { user: DEMO_USER },
        error: null,
      }),
      admin: {
        createUser: async (params: any) => ({
          data: {
            user: {
              id: `user-${Math.random().toString(36).slice(2, 9)}`,
              email: params.email,
              user_metadata: params.user_metadata ?? {},
            },
          },
          error: null,
        }),
        updateUserById: async () => ({
          data: { user: DEMO_USER },
          error: null,
        }),
      },
    },
    from: (tableName: string) => new MockQueryBuilder(tableName),
    rpc: async (fnName: string, _args?: any) => {
      if (fnName === "current_tenant_id") return { data: "ten1", error: null };
      if (fnName === "is_super_admin") return { data: true, error: null };
      if (fnName === "is_tenant_admin") return { data: true, error: null };
      if (fnName === "is_tenant_staff") return { data: true, error: null };
      return { data: true, error: null };
    },
    storage: {
      from: (_bucket: string) => ({
        createSignedUrl: async (path: string) => ({
          data: { signedUrl: `https://example.com/files/${path}` },
          error: null,
        }),
        remove: async () => ({ data: [], error: null }),
        upload: async () => ({ data: { path: "mock-file.pdf" }, error: null }),
      }),
    },
  } as any;
}

export const mockSupabase = createMockSupabaseClient();
