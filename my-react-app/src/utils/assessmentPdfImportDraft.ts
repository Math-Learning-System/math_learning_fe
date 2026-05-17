/** Persist PDF import form fields across F5 (file must be re-selected). */
const STORAGE_KEY = 'math:assessment-pdf-import-draft:v1';

export interface AssessmentPdfImportDraft {
  examTitle: string;
  schoolYear: string;
  department: string;
  examDate: string;
  examType: string;
  schoolGradeId: string;
  subjectId: string;
  contextHint: string;
  questionBankId: string;
  timeLimitMinutes: string;
  examScope: string;
  organizerType: string;
  provinceCity: string;
  district: string;
  schoolName: string;
}

export const emptyAssessmentPdfImportDraft = (): AssessmentPdfImportDraft => ({
  examTitle: '',
  schoolYear: '',
  department: '',
  examDate: '',
  examType: '',
  schoolGradeId: '',
  subjectId: '',
  contextHint: '',
  questionBankId: '',
  timeLimitMinutes: '',
  examScope: '',
  organizerType: '',
  provinceCity: '',
  district: '',
  schoolName: '',
});

export function loadAssessmentPdfImportDraft(): AssessmentPdfImportDraft | null {
  try {
    const raw = globalThis.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AssessmentPdfImportDraft>;
    return { ...emptyAssessmentPdfImportDraft(), ...parsed };
  } catch {
    return null;
  }
}

export function saveAssessmentPdfImportDraft(draft: AssessmentPdfImportDraft): void {
  try {
    globalThis.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // quota exceeded — ignore
  }
}

export function clearAssessmentPdfImportDraft(): void {
  globalThis.sessionStorage.removeItem(STORAGE_KEY);
}
