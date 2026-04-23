export const COLLEGES = [
  "كلية الطب والجراحة",
  "كلية طب الأسنان",
  "كلية الصيدلة السريرية",
  "كلية العلوم الطبية التطبيقية",
  "كلية الهندسة والحاسوب",
  "كلية التمريض العالي",
  "كلية الطب المخبري",
  "كلية الإدارة الطبية",
  "عمادة البيئة وخدمة المجتمع",
] as const;

export const LEVELS = [
  "المستوى الأول",
  "المستوى الثاني",
  "المستوى الثالث",
  "المستوى الرابع",
  "المستوى الخامس",
] as const;

export const JOIN_YEARS = ["2020","2021","2022","2023","2024","2025","2026","2027"];

// Normalize channel college names from Excel to canonical names
export function normalizeCollege(name: string): string {
  if (!name) return "";
  const n = name.trim();
  const map: Record<string, string> = {
    "التمريض العالي": "كلية التمريض العالي",
    "كلية العلوم الطبية": "كلية العلوم الطبية التطبيقية",
    "كلية الطب والعلوم الصحية": "كلية الطب والجراحة",
    "الطب والعلوم الصحية": "كلية الطب والجراحة",
  };
  return map[n] || n;
}

// Normalize Arabic level keywords from Excel ("أول","ثاني",...) to canonical
export function normalizeLevel(lvl: string): string {
  if (!lvl) return "";
  const n = lvl.trim();
  const map: Record<string, string> = {
    "أول": "المستوى الأول",
    "ثاني": "المستوى الثاني",
    "ثالث": "المستوى الثالث",
    "رابع": "المستوى الرابع",
    "خامس": "المستوى الخامس",
  };
  return map[n] || n;
}
