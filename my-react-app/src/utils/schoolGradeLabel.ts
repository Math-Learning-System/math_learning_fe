/** Minimal shape for formatting school grade / program labels. */
export type SchoolGradeLabelInput = {
  gradeLevel: number;
  name?: string | null;
};

/**
 * Display: `Lớp 9 — Tên chương trình` (one grade level can have many programs).
 */
export function formatSchoolGradeLabel(grade: SchoolGradeLabelInput): string {
  const levelLabel = `Lớp ${grade.gradeLevel}`;
  const name = grade.name?.trim() ?? '';

  if (!name) return levelLabel;
  if (name.toLowerCase() === levelLabel.toLowerCase()) return levelLabel;

  return `${levelLabel} — ${name}`;
}
