import type {
  AssessmentPdfImportMetadata,
  AssessmentResponse,
  AssessmentType,
  UpdateAssessmentPdfImportMetadataRequest,
} from '../types';

export type PdfImportDetailFormState = {
  examTitle: string;
  schoolYear: string;
  examType: string;
  examScope: string;
  organizerType: string;
  provinceCity: string;
  district: string;
  schoolName: string;
  department: string;
  examDate: string;
  schoolGradeId: string;
  subjectId: string;
  contextHint: string;
  questionBankId: string;
  assessmentType: AssessmentType;
  timeLimitMinutes: string;
  pdfLayout: string;
  importContentMode: string;
};

export type DetailRow = { label: string; value: string };

function display(value?: string | null): string {
  return value?.trim() ?? '';
}

function displayMinutes(minutes?: number | null): string {
  if (minutes == null) return '';
  return `${minutes} phút`;
}

/** All wizard fields (step 1 + step 2 labels), excluding PDF file. Empty values stay blank. */
export function buildPdfImportDetailRows(
  meta: AssessmentPdfImportMetadata | undefined,
  assessment?: AssessmentResponse
): DetailRow[] {
  const m = meta ?? {};

  return [
    { label: 'Tên đề', value: display(m.examTitle) || display(assessment?.title) },
    { label: 'Năm học', value: display(m.schoolYear) },
    { label: 'Loại đề', value: display(m.examType) },
    { label: 'Cấp đề thi', value: display(m.examScopeLabel ?? m.examScope) },
    {
      label: 'Loại đơn vị ra đề',
      value: display(m.organizerTypeLabel ?? m.organizerType),
    },
    { label: 'Tỉnh / Thành phố', value: display(m.provinceCity) },
    { label: 'Quận / Huyện', value: display(m.district) },
    { label: 'Tên trường', value: display(m.schoolName) },
    { label: 'Đơn vị ra đề', value: display(m.department ?? m.organizerName) },
    { label: 'Ngày thi', value: display(m.examDate) },
    { label: 'Chương trình', value: display(m.schoolGradeName) },
    { label: 'Môn học', value: display(m.subjectName) },
    {
      label: 'Thời gian làm bài',
      value: displayMinutes(m.timeLimitMinutes ?? assessment?.timeLimitMinutes),
    },
    {
      label: 'Loại bài kiểm tra',
      value: display(m.assessmentTypeLabel ?? m.assessmentType),
    },
    { label: 'Bố cục PDF', value: display(m.pdfLayoutLabel ?? m.pdfLayout) },
    {
      label: 'Chế độ nội dung',
      value: display(m.importContentModeLabel ?? m.importContentMode),
    },
    { label: 'Gợi ý bối cảnh', value: display(m.contextHint) },
    { label: 'Ngân hàng câu hỏi', value: display(m.questionBankName) },
  ];
}

/** Mô tả thủ công — ẩn chuỗi auto-fill OCR / metadata cũ từ import. */
export function shouldShowAssessmentDescription(
  description?: string | null,
  assessment?: AssessmentResponse
): boolean {
  const t = description?.trim() ?? '';
  if (!t) return false;
  if (t.startsWith('Import từ PDF')) return false;
  if (assessment && isPdfImportedAssessment(assessment) && t.includes('\n\n---\n')) {
    return false;
  }
  return true;
}

export function isPdfImportedAssessment(assessment: AssessmentResponse): boolean {
  return Boolean(assessment.sourcePdfPath);
}

export function hasPdfImportMetadata(assessment: AssessmentResponse): boolean {
  const rows = buildPdfImportDetailRows(assessment.pdfImportMetadata, assessment);
  return rows.some((row) => row.value.trim() !== '');
}

export function buildPdfImportDetailFormState(
  assessment: AssessmentResponse,
  schoolGrades: { id: string; name: string; gradeLevel?: number }[] = [],
  subjects: { id: string; name: string }[] = [],
  questionBanks: { id: string; name: string }[] = []
): PdfImportDetailFormState {
  const m = assessment.pdfImportMetadata ?? {};
  const gradeId =
    schoolGrades.find(
      (g) =>
        m.schoolGradeName &&
        (g.name === m.schoolGradeName ||
          `${g.name}`.includes(m.schoolGradeName) ||
          m.schoolGradeName.includes(g.name))
    )?.id ?? '';
  const subjectId =
    subjects.find((s) => m.subjectName && s.name === m.subjectName)?.id ?? '';

  return {
    examTitle: m.examTitle?.trim() || assessment.title?.trim() || '',
    schoolYear: m.schoolYear?.trim() ?? '',
    examType: m.examType?.trim() ?? '',
    examScope: m.examScope?.trim() ?? '',
    organizerType: m.organizerType?.trim() ?? '',
    provinceCity: m.provinceCity?.trim() ?? '',
    district: m.district?.trim() ?? '',
    schoolName: m.schoolName?.trim() ?? '',
    department: (m.department ?? m.organizerName)?.trim() ?? '',
    examDate: m.examDate?.trim() ?? '',
    schoolGradeId: gradeId,
    subjectId,
    contextHint: m.contextHint?.trim() ?? '',
    questionBankId:
      questionBanks.find((b) => m.questionBankName && b.name === m.questionBankName)?.id ?? '',
    assessmentType: (m.assessmentType as AssessmentType) || assessment.assessmentType || 'EXAM',
    timeLimitMinutes:
      m.timeLimitMinutes != null
        ? String(m.timeLimitMinutes)
        : assessment.timeLimitMinutes != null
          ? String(assessment.timeLimitMinutes)
          : '',
    pdfLayout: m.pdfLayout?.trim() ?? '',
    importContentMode: m.importContentMode?.trim() ?? '',
  };
}

export function pdfImportDetailFormToRequest(
  form: PdfImportDetailFormState
): UpdateAssessmentPdfImportMetadataRequest {
  const minutes = form.timeLimitMinutes.trim();
  return {
    examTitle: form.examTitle.trim() || undefined,
    schoolYear: form.schoolYear.trim() || undefined,
    examType: form.examType.trim() || undefined,
    examScope: form.examScope.trim() || undefined,
    organizerType: form.organizerType.trim() || undefined,
    provinceCity: form.provinceCity.trim() || undefined,
    district: form.district.trim() || undefined,
    schoolName: form.schoolName.trim() || undefined,
    department: form.department.trim() || undefined,
    organizerName: form.department.trim() || undefined,
    examDate: form.examDate || undefined,
    schoolGradeId: form.schoolGradeId || undefined,
    subjectId: form.subjectId || undefined,
    contextHint: form.contextHint.trim() || undefined,
    questionBankId: form.questionBankId || undefined,
    assessmentType: form.assessmentType,
    timeLimitMinutes: minutes ? Number(minutes) : undefined,
    pdfLayout: form.pdfLayout.trim() || undefined,
    importContentMode: form.importContentMode.trim() || undefined,
  };
}
