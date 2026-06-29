import { ExternalLink, FileText, Loader2, Save } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import MathText from '../common/MathText';
import { PdfPreviewWithToggle } from '../common/PdfPreviewWithToggle';
import { useToast } from '../../context/ToastContext';
import {
  useAssessmentImportSourcePdfUrl,
  usePdfImportDocument,
  useUpdatePdfImportDocument,
} from '../../hooks/useAssessment';
import type { AssessmentQuestionItem, AssessmentResponse } from '../../types';
import { buildDocumentFromMergedLatex } from '../../utils/pdfImportDocument';
import {
  countOcrPagesWithText,
  ensureQuestionList,
  resolveMergedLatexFromAssessment,
  resolvePdfImportPages,
} from '../../utils/pdfImportPages';

type Props = {
  assessment: AssessmentResponse;
  questions?: AssessmentQuestionItem[] | null | unknown;
  isDraft: boolean;
  onRefresh: () => Promise<unknown>;
};

export function AssessmentPdfReviewWorkspace({
  assessment,
  questions: questionsProp,
  isDraft,
  onRefresh,
}: Props) {
  const questions = useMemo(() => ensureQuestionList(questionsProp), [questionsProp]);
  const { showToast } = useToast();
  const pdfUrlQuery = useAssessmentImportSourcePdfUrl(assessment.id);
  const documentQuery = usePdfImportDocument(assessment.id, Boolean(assessment.sourcePdfPath));
  const saveMutation = useUpdatePdfImportDocument(assessment.id);

  const resolved = useMemo(
    () =>
      resolveMergedLatexFromAssessment(
        assessment,
        questions,
        documentQuery.data?.result
      ),
    [assessment, questions, documentQuery.data?.result]
  );

  const pageCount = useMemo(
    () => countOcrPagesWithText(resolved.pages),
    [resolved.pages]
  );

  const [latex, setLatex] = useState(resolved.latex);
  const [savedLatex, setSavedLatex] = useState(resolved.latex);
  const userEditedRef = useRef(false);

  useEffect(() => {
    userEditedRef.current = false;
  }, [assessment.id]);

  useEffect(() => {
    if (userEditedRef.current) return;
    if (resolved.latex) {
      setLatex(resolved.latex);
      setSavedLatex(resolved.latex);
    }
  }, [resolved.latex]);

  const isDirty = latex !== savedLatex;

  const handleSave = async () => {
    try {
      const doc = buildDocumentFromMergedLatex(latex, assessment.pdfImportDocument);
      await saveMutation.mutateAsync({
        questionBlocks: doc.questionBlocks,
        answerBlocks: doc.answerBlocks,
      });
      setSavedLatex(latex);
      userEditedRef.current = false;
      showToast({ type: 'success', message: 'Đã lưu nội dung OCR.' });
      await onRefresh();
    } catch (e) {
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Không lưu được nội dung.',
      });
    }
  };

  const pagesFallback = resolvePdfImportPages(assessment.pdfImportPages, questions);
  if (!assessment.sourcePdfPath && pagesFallback.length === 0) {
    return null;
  }

  const loadingOcr =
    documentQuery.isLoading && !resolved.latex && pageCount === 0;

  return (
    <article className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
      <header className="px-4 py-4 lg:px-6 lg:py-5 border-b border-[#e2e8f0] bg-[#ffffff]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-[Playfair_Display] text-[16px] font-medium text-[#0f172a] m-0 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0ea5e9]" aria-hidden />
              Rà soát nội dung PDF
              {pageCount > 0 ? ` (${pageCount} trang OCR)` : ''}
            </h3>
            <p className="mt-1 font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] m-0 max-w-[70ch]">
              Toàn bộ đề gộp thành một khối LaTeX — chỉnh bên trái, xem trước bên phải.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pdfUrlQuery.data?.result?.url ? (
              <button
                type="button"
                className="btn secondary inline-flex items-center gap-2 text-[13px]"
                onClick={() => {
                  const url = pdfUrlQuery.data?.result?.url;
                  if (url) globalThis.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="h-4 w-4" />
                PDF gốc
              </button>
            ) : null}
            {isDraft ? (
              <button
                type="button"
                className="btn inline-flex items-center gap-2 text-[13px]"
                disabled={!isDirty || saveMutation.isPending || loadingOcr}
                onClick={() => void handleSave()}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Lưu nội dung
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 grid gap-4 lg:grid-cols-2 lg:gap-6 min-h-[320px]">
        <div className="flex flex-col min-h-[280px]">
          <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#475569] m-0 mb-2">
            LaTeX / Markdown
            {pageCount > 0 ? ` (đã gộp ${pageCount} trang)` : ''}
          </p>
          {loadingOcr ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-[#64748b] text-[13px]">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Đang tải nội dung OCR…
            </div>
          ) : (
            <textarea
              className="input flex-1 min-h-[min(70vh,520px)] w-full font-mono text-[12px] leading-relaxed resize-y"
              readOnly={!isDraft}
              value={latex}
              onChange={(e) => {
                userEditedRef.current = true;
                setLatex(e.target.value);
              }}
              spellCheck={false}
              placeholder={
                pageCount > 0
                  ? 'Nội dung OCR sau khi gộp trang…'
                  : 'Chưa có OCR — import lại PDF hoặc hoàn tất bước OCR trong wizard.'
              }
            />
          )}
        </div>

        <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 flex flex-col min-h-[280px]">
          <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#475569] m-0 mb-3 shrink-0">
            Xem trước
          </p>
          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            {loadingOcr ? (
              <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] m-0">Đang tải…</p>
            ) : latex.trim() ? (
              <MathText text={latex} />
            ) : (
              <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] m-0">
                Chưa có nội dung OCR để xem trước.
              </p>
            )}
          </div>
        </div>
      </div>

      {pdfUrlQuery.data?.result?.url ? (
        <PdfPreviewWithToggle
          src={pdfUrlQuery.data.result.url}
          collapsible
          defaultOpen={false}
          showLabel="Xem PDF"
          hideLabel="Ẩn"
          variant="warm"
          className="px-4 lg:px-6 pb-4"
          iframeTitle="PDF"
        />
      ) : null}
    </article>
  );
}
