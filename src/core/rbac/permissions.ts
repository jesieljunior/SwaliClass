/**
 * Matriz de permissões RBAC central.
 * Em vez de espalhar `if (role === 'professor')` pelo código, use `can(role, action)`.
 *
 * Papéis (do enum `app_role`): super_admin, admin_instituicao, coordenador, professor, aluno.
 */

export type AppRole = "super_admin" | "admin_instituicao" | "coordenador" | "professor" | "aluno";

export const PERMISSIONS = {
  CLASS_MANAGE: "class.manage",
  CLASS_VIEW: "class.view",
  GRADE_WRITE: "grade.write",
  GRADE_VIEW_OWN: "grade.view.own",
  ATTENDANCE_TAKE: "attendance.take",
  ACTIVITY_CREATE: "activity.create",
  ACTIVITY_SUBMIT: "activity.submit",
  STUDENT_MANAGE: "student.manage",
  TENANT_MANAGE: "tenant.manage",
  REPORTS_VIEW: "reports.view",
  LIBRARY_UPLOAD: "library.upload",
  AI_CHAT: "ai.chat",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Matriz: papel → conjunto de permissões.
 * NOTA: permissões restritas a "turmas atribuídas" (professor) devem ser
 * combinadas com verificação de escopo (`teaches_class` no banco).
 */
const MATRIX: Record<AppRole, ReadonlySet<Permission>> = {
  super_admin: new Set(Object.values(PERMISSIONS)),
  admin_instituicao: new Set([
    PERMISSIONS.CLASS_MANAGE,
    PERMISSIONS.CLASS_VIEW,
    PERMISSIONS.GRADE_WRITE,
    PERMISSIONS.ATTENDANCE_TAKE,
    PERMISSIONS.ACTIVITY_CREATE,
    PERMISSIONS.STUDENT_MANAGE,
    PERMISSIONS.TENANT_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.LIBRARY_UPLOAD,
    PERMISSIONS.AI_CHAT,
  ]),
  coordenador: new Set([
    PERMISSIONS.CLASS_MANAGE,
    PERMISSIONS.CLASS_VIEW,
    PERMISSIONS.GRADE_WRITE,
    PERMISSIONS.ATTENDANCE_TAKE,
    PERMISSIONS.ACTIVITY_CREATE,
    PERMISSIONS.STUDENT_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.LIBRARY_UPLOAD,
    PERMISSIONS.AI_CHAT,
  ]),
  professor: new Set([
    PERMISSIONS.CLASS_VIEW,
    PERMISSIONS.GRADE_WRITE,
    PERMISSIONS.ATTENDANCE_TAKE,
    PERMISSIONS.ACTIVITY_CREATE,
    PERMISSIONS.LIBRARY_UPLOAD,
    PERMISSIONS.AI_CHAT,
  ]),
  aluno: new Set([
    PERMISSIONS.GRADE_VIEW_OWN,
    PERMISSIONS.ACTIVITY_SUBMIT,
    PERMISSIONS.LIBRARY_UPLOAD,
    PERMISSIONS.AI_CHAT,
  ]),
};

/** Retorna true se o papel tem a permissão. */
export function can(role: AppRole, permission: Permission): boolean {
  return MATRIX[role]?.has(permission) ?? false;
}

/** Retorna true se ao menos um dos papéis tem a permissão. */
export function canAny(roles: AppRole[], permission: Permission): boolean {
  return roles.some((r) => can(r, permission));
}
