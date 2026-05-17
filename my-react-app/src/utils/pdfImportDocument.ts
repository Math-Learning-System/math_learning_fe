import type { AssessmentPdfImportDocument, AssessmentQuestionItem, AssessmentResponse, PdfImportPage } from '../types';
import type { ContentBlockDto } from '../types/book.types';

/** Gộp nội dung OCR các trang thành một chuỗi LaTeX. */
export function mergePdfPagesToLatex(pages: PdfImportPage[]): string {
  return pages
    .map((p) => p.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n\n');
}

/** Gộp các khối đã lưu (kể cả seed cũ nhiều trang) thành một LaTeX. */
export function mergeDocumentBlocksToLatex(blocks: ContentBlockDto[]): string {
  if (!blocks.length) return '';
  if (blocks.length === 1) {
    const only = blocks[0];
    if ((only.type ?? 'text') === 'text' || (only.type ?? 'text') === 'latex') {
      return only.content?.trim() ?? '';
    }
  }
  const parts: string[] = [];
  for (const block of blocks) {
    const type = block.type ?? 'text';
    const content = block.content?.trim() ?? '';
    if (!content && type !== 'image' && type !== 'figure') continue;
    if (type === 'heading') {
      parts.push(content);
      continue;
    }
    if (type === 'image' || type === 'figure') {
      const url = block.imageUrl ?? block.imagePath ?? '';
      if (url) parts.push(`![${block.caption ?? 'image'}](${url})`);
      continue;
    }
    parts.push(content);
  }
  return parts.join('\n\n').trim();
}

export function latexToSingleDocumentBlock(latex: string): ContentBlockDto[] {
  const trimmed = latex.trim();
  if (!trimmed) return [];
  return [{ order: 1, type: 'text', content: trimmed }];
}

export function documentToMergedLatex(doc: AssessmentPdfImportDocument | undefined): string {
  if (!doc) return '';
  const fromQuestions = mergeDocumentBlocksToLatex(doc.questionBlocks ?? []);
  if (fromQuestions) return fromQuestions;
  return mergeDocumentBlocksToLatex(doc.answerBlocks ?? []);
}

export function buildDocumentFromMergedLatex(
  latex: string,
  previous?: AssessmentPdfImportDocument
): AssessmentPdfImportDocument {
  return {
    questionBlocks: latexToSingleDocumentBlock(latex),
    answerBlocks: previous?.answerBlocks?.length ? previous.answerBlocks : [],
  };
}

/** Câu placeholder 1-trang từ import PDF cũ — không hiển thị trong danh sách đề. */
export function isPdfImportPagePlaceholder(
  question: AssessmentQuestionItem,
  assessment: AssessmentResponse | null | undefined,
  pages: PdfImportPage[]
): boolean {
  if (question.pageSource === true) return true;
  if (!assessment?.sourcePdfPath) return false;

  const pageNumber = question.pageNumber;
  if (pageNumber == null || pageNumber < 1) return false;

  const section = (question.sectionLabel ?? '').trim();
  if (/^Trang\s+\d+$/i.test(section) || section === `Trang ${pageNumber}`) {
    return true;
  }

  const qt = question.questionText?.trim() ?? '';
  if (qt.length < 40) return false;

  const page = pages.find((p) => p.pageNumber === pageNumber);
  if (page?.text?.trim()) {
    const pt = page.text.trim();
    if (qt === pt || pt.startsWith(qt.slice(0, 100)) || qt.startsWith(pt.slice(0, 100))) {
      return true;
    }
  }

  return false;
}
