import type {
  AssessmentPdfImportDocument,
  AssessmentQuestionItem,
  AssessmentResponse,
  PdfImportPage,
} from '../types';
import { documentToMergedLatex, isPdfImportPagePlaceholder, mergePdfPagesToLatex } from './pdfImportDocument';

export type FilterExamQuestionsContext = {
  assessment?: AssessmentResponse | null;
};

/** API / query cache may return non-array shapes — always coerce to a list. */
export function ensureQuestionList(
  questions: AssessmentQuestionItem[] | null | undefined | unknown
): AssessmentQuestionItem[] {
  if (Array.isArray(questions)) return questions;
  if (questions && typeof questions === 'object') {
    const record = questions as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as AssessmentQuestionItem[];
    if (Array.isArray(record.content)) return record.content as AssessmentQuestionItem[];
  }
  return [];
}

function ensurePdfImportPageList(
  pdfImportPages: PdfImportPage[] | null | undefined | unknown
): PdfImportPage[] {
  if (Array.isArray(pdfImportPages)) return pdfImportPages;
  if (pdfImportPages && typeof pdfImportPages === 'object') {
    const nested = (pdfImportPages as { pages?: unknown }).pages;
    if (Array.isArray(nested)) return nested as PdfImportPage[];
  }
  return [];
}

/** Exam questions only — excludes full-page OCR placeholders from PDF import. */
export function filterExamQuestions(
  questions: AssessmentQuestionItem[] | null | undefined | unknown,
  context?: FilterExamQuestionsContext
): AssessmentQuestionItem[] {
  const list = ensureQuestionList(questions);
  const pages = context?.assessment
    ? resolvePdfImportPages(context.assessment.pdfImportPages, list)
    : [];
  return list.filter((q) => !isPdfImportPagePlaceholder(q, context?.assessment, pages));
}

export function resolvePdfImportPages(
  pdfImportPages: PdfImportPage[] | undefined | unknown,
  questions: AssessmentQuestionItem[] | null | undefined | unknown
): PdfImportPage[] {
  const pageList = ensurePdfImportPageList(pdfImportPages);
  const questionList = ensureQuestionList(questions);

  if (pageList.length > 0) {
    return [...pageList].sort((a, b) => a.pageNumber - b.pageNumber);
  }
  const fromMeta = new Map<number, PdfImportPage>();
  for (const q of questionList) {
    const pn = q.pageNumber;
    if (!pn || !q.pageSource) continue;
    fromMeta.set(pn, {
      pageNumber: pn,
      text: q.questionText,
      sectionLabel: q.sectionLabel ?? `Trang ${pn}`,
    });
  }
  if (fromMeta.size > 0) {
    return [...fromMeta.values()].sort((a, b) => a.pageNumber - b.pageNumber);
  }
  const byPage = new Map<number, AssessmentQuestionItem[]>();
  for (const q of questionList) {
    const pn = q.pageNumber ?? 0;
    if (pn < 1) continue;
    const list = byPage.get(pn) ?? [];
    list.push(q);
    byPage.set(pn, list);
  }
  const derived: PdfImportPage[] = [];
  for (const [pageNumber, list] of byPage) {
    const anchor =
      list.find((q) => q.pageSource) ??
      list.reduce((a, b) => (a.questionText.length >= b.questionText.length ? a : b));
    derived.push({
      pageNumber,
      text: anchor.questionText,
      sectionLabel: anchor.sectionLabel ?? `Trang ${pageNumber}`,
    });
  }
  return derived.sort((a, b) => a.pageNumber - b.pageNumber);
}

export function questionsForPage(
  questions: AssessmentQuestionItem[],
  pageNumber: number
): AssessmentQuestionItem[] {
  return filterExamQuestions(questions).filter((q) => q.pageNumber === pageNumber);
}

/** OCR gộp cho editor: document API/assessment → pages DB → câu theo trang (import cũ). */
export function resolveMergedLatexFromAssessment(
  assessment: AssessmentResponse,
  questions: AssessmentQuestionItem[] | null | undefined | unknown,
  apiDocument?: AssessmentPdfImportDocument | null
): { latex: string; pages: PdfImportPage[] } {
  const pages = resolvePdfImportPages(assessment.pdfImportPages, questions);

  const fromApiDoc = documentToMergedLatex(apiDocument ?? undefined);
  if (fromApiDoc) {
    return { latex: fromApiDoc, pages };
  }

  const fromAssessmentDoc = documentToMergedLatex(assessment.pdfImportDocument);
  if (fromAssessmentDoc) {
    return { latex: fromAssessmentDoc, pages };
  }

  const fromPages = mergePdfPagesToLatex(pages);
  if (fromPages) {
    return { latex: fromPages, pages };
  }

  return { latex: '', pages };
}

export function countOcrPagesWithText(pages: PdfImportPage[]): number {
  return pages.filter((p) => (p.text?.trim() ?? '').length > 0).length;
}
