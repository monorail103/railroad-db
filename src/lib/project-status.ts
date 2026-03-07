export const PROJECT_STATUSES = ["IN_PROGRESS", "COMPLETED", "ARCHIVED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_META: Record<ProjectStatus, { label: string; badge: string }> = {
  IN_PROGRESS: { label: "進行中", badge: "bg-blue-100 text-blue-700 border border-blue-200" },
  COMPLETED:   { label: "完成",   badge: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  ARCHIVED:    { label: "保管",   badge: "bg-slate-100 text-slate-600 border border-slate-200" },
};
