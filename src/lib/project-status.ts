export const PROJECT_STATUSES = ["IN_PROGRESS", "COMPLETED", "ARCHIVED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_META: Record<ProjectStatus, { label: string; badge: string }> = {
  IN_PROGRESS: { label: "進行中", badge: "bg-blue-100 text-blue-800" },
  COMPLETED:   { label: "完成",   badge: "bg-green-100 text-green-800" },
  ARCHIVED:    { label: "保管",   badge: "bg-gray-100 text-gray-800" },
};
