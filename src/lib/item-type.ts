export const ITEM_TYPE_OPTIONS = [
  { value: "SINGLE_CAR", label: "単品車両" },
  { value: "SET",        label: "セット" },
  { value: "PART",       label: "パーツ" },
] as const;

export type ItemType = "SET" | "SINGLE_CAR" | "PART" | "MATERIAL" | "TOOL";

export const ITEM_TYPE_LABELS: Record<string, string> = {
  SINGLE_CAR: "単品車両",
  SET: "セット",
  PART: "パーツ",
  MATERIAL: "素材",
  TOOL: "工具",
};
