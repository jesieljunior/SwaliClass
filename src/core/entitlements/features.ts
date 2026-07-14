/**
 * Chaves de features (entitlements) reconhecidas pelo sistema.
 * Devem casar com `plan_entitlements.feature_key` no banco.
 */
export const FEATURES = {
  PORTAL_VIEW: "portal.view",
  AI_CHAT: "ai.chat",
  LIBRARY_READ: "library.read",
  LIBRARY_UPLOAD: "library.upload",
  COMMUNITY_POST: "community.post",
  ACADEMIC_CLASSES: "academic.classes",
  ACADEMIC_GRADES: "academic.grades",
  ACADEMIC_REPORTS: "academic.reports",
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];