/** Persist PDF import wizard across F5 (file must be re-selected). */
const STORAGE_KEY = 'math:assessment-pdf-import-draft:v4';

/** Stable key for Mongo draft (same file → same OCR session). */
export function buildPdfImportFileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export type AssessmentPdfImportWizardStep = 1 | 2 | 3;

export type PdfImportPageOcrStatus = 'pending' | 'running' | 'done' | 'error';

export interface PdfImportPageDraft {
  pageNumber: number;
  text: string;
  confidence: number;
  status: PdfImportPageOcrStatus;
  error?: string;
}

export interface AssessmentPdfImportDraft {
  step: AssessmentPdfImportWizardStep;
  draftId: string;
  fileKey: string;
  fileName: string;
  totalPages: number;
  pdfLayout: string;
  importContentMode: string;
  extractedPages: PdfImportPageDraft[];
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

export const PDF_IMPORT_WIZARD_STEPS = [
  { n: 1 as const, title: 'Thông tin đề', hint: 'Năm học, môn, cấp đề' },
  { n: 2 as const, title: 'Trích text PDF', hint: 'Tải PDF · OCR Mathpix (lưu MongoDB)' },
  { n: 3 as const, title: 'Xác nhận', hint: 'Kiểm tra và tạo đề nháp' },
];

export const emptyAssessmentPdfImportDraft = (): AssessmentPdfImportDraft => ({
  step: 1,
  draftId: '',
  fileKey: '',
  fileName: '',
  totalPages: 0,
  pdfLayout: '',
  importContentMode: '',
  extractedPages: [],
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

function migrateV2Step(step: number): AssessmentPdfImportWizardStep {
  if (step === 2) return 1;
  if (step === 1) return 2;
  if (step === 4) return 3;
  if (step === 3) return 2;
  return 1;
}

function migrateLegacyDraft(raw: string, version: 'v1' | 'v2'): AssessmentPdfImportDraft | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AssessmentPdfImportDraft> & { step?: number };
    const base = emptyAssessmentPdfImportDraft();
    const { extractedPages: _ep, totalPages: _tp, step: oldStep, ...rest } = parsed;
    const step =
      version === 'v2' && typeof oldStep === 'number'
        ? migrateV2Step(oldStep)
        : base.step;
    return { ...base, ...rest, step };
  } catch {
    return null;
  }
}

export function loadAssessmentPdfImportDraft(): AssessmentPdfImportDraft | null {
  try {
    const raw = globalThis.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const v2 = globalThis.sessionStorage.getItem('math:assessment-pdf-import-draft:v2');
      if (v2) return migrateLegacyDraft(v2, 'v2');
      const v1 = globalThis.sessionStorage.getItem('math:assessment-pdf-import-draft:v1');
      if (v1) return migrateLegacyDraft(v1, 'v1');
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<AssessmentPdfImportDraft>;
    const base = emptyAssessmentPdfImportDraft();
    const step = parsed.step;
    const safeStep: AssessmentPdfImportWizardStep =
      step === 1 || step === 2 || step === 3 ? step : base.step;
    return {
      ...base,
      ...parsed,
      step: safeStep,
      draftId: typeof parsed.draftId === 'string' ? parsed.draftId : '',
      fileKey: typeof parsed.fileKey === 'string' ? parsed.fileKey : '',
      extractedPages: Array.isArray(parsed.extractedPages) ? parsed.extractedPages : [],
      totalPages: typeof parsed.totalPages === 'number' ? parsed.totalPages : 0,
    };
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
  globalThis.sessionStorage.removeItem('math:assessment-pdf-import-draft:v2');
  globalThis.sessionStorage.removeItem('math:assessment-pdf-import-draft:v1');
}

export function buildPreExtractedJson(params: {
  fileName: string;
  examTitle: string;
  pdfLayout: string;
  pages: PdfImportPageDraft[];
  totalPages: number;
}): string {
  const donePages = params.pages.filter((p) => p.status === 'done' && p.text.trim());
  const combined = donePages
    .map((p) => `--- Trang ${p.pageNumber} ---\n${p.text}`)
    .join('\n\n');
  const confidences = donePages.map((p) => p.confidence).filter((c) => c > 0);
  const avgConf =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;
  const firstText = donePages[0]?.text ?? '';
  const questions = donePages.map((p, idx) => ({
    orderIndex: idx + 1,
    sectionLabel: `Trang ${p.pageNumber}`,
    questionText: p.text,
    questionType: 'tu_luan',
    pageNumber: p.pageNumber,
    rawText: p.text,
    mathLatex: [],
  }));
  const payload = {
    analysisSuccessful: questions.length > 0,
    confidenceScore: Math.round(avgConf * 10000) / 10000,
    warnings: [
      `Đã OCR ${questions.length}/${params.totalPages} trang (Gemini + Mathpix). Tách câu/ý trong Rà soát đề.`,
    ],
    extractedText: combined,
    exam: {
      examTitle: params.examTitle.trim() || params.fileName.replace(/\.pdf$/i, ''),
      sourceFile: params.fileName,
      rawHeaderText: firstText.slice(0, 2000),
      totalPages: params.totalPages,
    },
    questions,
    pages: donePages.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.text,
      latex: '',
      confidence: p.confidence,
      mathpixSuccess: true,
    })),
  };
  return JSON.stringify(payload);
}
