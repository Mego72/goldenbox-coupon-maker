export const BRANCHES = [
  "مدينتي",
  "ذايد",
  "أجورة",
  "القرية",
  "الشروق",
] as const;

export type BranchName = typeof BRANCHES[number];
