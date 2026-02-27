export const ITEM_SCALES = [
  "N",
  "HO",
  "PLARAIL",
  "DECAL",
  "PART_N",
  "PART_HO",
  "OTHER",
] as const;

export type Scale = (typeof ITEM_SCALES)[number];

export const ITEM_SCALE_LABELS: Record<Scale, string> = {
  N: "Nゲージ",
  HO: "HOゲージ",
  PLARAIL: "プラレール",
  DECAL: "インレタ/シール",
  PART_N: "Nパーツ",
  PART_HO: "HOパーツ",
  OTHER: "その他",
};

export const ITEM_SCALE_OPTIONS: ReadonlyArray<{ value: Scale; label: string }> = ITEM_SCALES.map((value) => ({
  value,
  label: value === "N" || value === "HO" ? value : ITEM_SCALE_LABELS[value],
}));