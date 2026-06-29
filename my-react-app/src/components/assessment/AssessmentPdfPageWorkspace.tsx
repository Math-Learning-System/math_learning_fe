import { ExternalLink, FileText, Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import MathText from '../common/MathText';
import { PdfPreviewWithToggle } from '../common/PdfPreviewWithToggle';
import { useToast } from '../../context/ToastContext';
import { useAddQuestion, useAssessmentImportSourcePdfUrl } from '../../hooks/useAssessment';
import { useCreateQuestion, useUpdateQuestion } from '../../hooks/useQuestion';
import type { AssessmentQuestionItem, AssessmentResponse } from '../../types';
import type { QuestionType } from '../../types/question';
import {
  filterExamQuestions,
  questionsForPage,
  resolvePdfImportPages,
} from '../../utils/pdfImportPages';
import { PdfImportQuestionEditorModal } from './PdfImportQuestionEditorModal';

type Props = {
  assessment: AssessmentResponse;
  questions: AssessmentQuestionItem[];
  isDraft: boolean;
  onRefresh: () => Promise<unknown>;
};

function getQuestionId(q: AssessmentQuestionItem) {
  return q.questionId || q.id || '';
}

export function AssessmentPdfPageWorkspace({ assessment, questions, isDraft, onRefresh }: Props) {
  const { showToast } = useToast();
  const pages = useMemo(
    () => resolvePdfImportPages(assessment.pdfImportPages, questions),
    [assessment.pdfImportPages, questions]
  );
  const [activePage, setActivePage] = useState(pages[0]?.pageNumber ?? 1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AssessmentQuestionItem | null>(null);

  const pdfUrlQuery = useAssessmentImportSourcePdfUrl(assessment.id);
  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const addQuestionMutation = useAddQuestion();

  const examQuestions = useMemo(() => filterExamQuestions(questions), [questions]);
  const pageQuestions = useMemo(
    () => questionsForPage(questions, activePage),
    [questions, activePage]
  );
  const activePageMeta = pages.find((p) => p.pageNumber === activePage);

  if (!assessment.sourcePdfPath || pages.length === 0) {
    return null;
  }

  const saving = createQuestionMutation.isPending || updateQuestionMutation.isPending;

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(q: AssessmentQuestionItem) {
    setEditing(q);
    setEditorOpen(true);
  }

  async function handleSave(payload: {
    questionText: string;
    questionType: QuestionType;
    correctAnswer: string;
    points: number;
  }) {
    const meta = {
      source: 'PDF_IMPORT',
      assessmentId: assessment.id,
      pageNumber: activePage,
      sectionLabel: activePageMeta?.sectionLabel ?? `Trang ${activePage}`,
      pageSource: false,
    };
    try {
      if (editing) {
        const qid = getQuestionId(editing);
        await updateQuestionMutation.mutateAsync({
          questionId: qid,
          request: {
            questionText: payload.questionText,
            correctAnswer: payload.correctAnswer,
            points: payload.points,
            generationMetadata: meta,
          },
        });
        showToast({ type: 'success', message: 'Đã cập nhật câu hỏi.' });
      } else {
        const createdRes = await createQuestionMutation.mutateAsync({
          questionText: payload.questionText,
          questionType: payload.questionType,
          correctAnswer: payload.correctAnswer,
          points: payload.points,
          explanation: 'Tạo từ OCR PDF — chỉnh đáp án khi rà soát.',
          generationMetadata: meta,
        });
        const newQuestionId = createdRes.result?.id ?? (createdRes as { id?: string }).id;
        if (!newQuestionId) {
          throw new Error('Không lấy được ID câu hỏi mới.');
        }
        const nextOrder =
          examQuestions.length > 0
            ? Math.max(...examQuestions.map((q) => q.orderIndex)) + 1
            : 1;
        await addQuestionMutation.mutateAsync({
          assessmentId: assessment.id,
          data: {
            questionId: newQuestionId,
            orderIndex: nextOrder,
            pointsOverride: payload.points,
          },
        });
        showToast({ type: 'success', message: 'Đã thêm câu hỏi vào đề.' });
      }
      setEditorOpen(false);
      setEditing(null);
      await onRefresh();
    } catch (e) {
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Không lưu được câu hỏi.',
      });
    }
  }

  return (
    <article className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
      <div className="px-4 py-4 lg:px-6 lg:py-5 border-b border-[#e2e8f0] bg-[#ffffff]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-[Playfair_Display] text-[16px] font-medium text-[#0f172a] m-0 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0ea5e9]" aria-hidden />
              Rà soát theo trang PDF ({pages.length} trang)
            </h3>
            <p className="mt-1 font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] m-0 max-w-[62ch]">
              Mỗi tab là một trang OCR. Tạo và sửa từng câu hỏi từ LaTeX — không gộp cả trang thành một câu.
            </p>
          </div>
          {pdfUrlQuery.data?.result?.url ? (
            <button
              type="button"
              className="btn secondary inline-flex items-center gap-2 text-[13px]"
              onClick={() =>
                globalThis.open(pdfUrlQuery.data!.result!.url, '_blank', 'noopener,noreferrer')
              }
            >
              <ExternalLink className="h-4 w-4" />
              PDF gốc
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {pages.map((p) => {
            const count = questionsForPage(questions, p.pageNumber).length;
            const selected = p.pageNumber === activePage;
            return (
              <button
                key={p.pageNumber}
                type="button"
                className={`rounded-full px-3 py-1.5 font-[Be_Vietnam_Pro] text-[12px] font-semibold border transition-colors ${
                  selected
                    ? 'bg-[#0ea5e9] text-[#ffffff] border-[#0ea5e9]'
                    : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-[#0ea5e9]/40'
                }`}
                onClick={() => setActivePage(p.pageNumber)}
              >
                Trang {p.pageNumber}
                {count > 0 ? ` · ${count} câu` : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 lg:p-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 min-h-[200px]">
          <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#475569] m-0 mb-2">
            Nội dung OCR — {activePageMeta?.sectionLabel ?? `Trang ${activePage}`}
          </p>
          <div className="max-h-[min(70vh,520px)] overflow-y-auto pr-1">
            <MathText text={activePageMeta?.text ?? ''} />
          </div>
        </div>

        <div className="space-y-3">
            <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0f172a] m-0">
              Câu hỏi trên trang này ({pageQuestions.length})
            </p>
            {isDraft ? (
              <button type="button" className="btn inline-flex items-center gap-1.5 text-[13px]" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Thêm câu
              </button>
            ) : null}
          {pageQuestions.length === 0 ? (
            <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] m-0">Chưa có câu.</p>
          ) : (
            <ul className="m-0 p-0 space-y-2">
              {pageQuestions.map((q) => (
                <li key={getQuestionId(q)} className="rounded-lg border border-[#e2e8f0] bg-white p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#64748b]">Câu {q.orderIndex}</span>
                    {isDraft ? (
                      <button type="button" className="inline-flex items-center gap-1 text-[11px] text-indigo-700 hover:underline" onClick={() => openEdit(q)}>
                        <Pencil className="h-3.5 w-3.5" /> Sửa
                      </button>
                    ) : null}
                  </div>
                  <MathText text={q.questionText.slice(0, 280)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {pdfUrlQuery.data?.result?.url ? (
        <PdfPreviewWithToggle src={pdfUrlQuery.data.result.url} collapsible defaultOpen={false} showLabel="Xem PDF" hideLabel="An" variant="warm" className="px-4 lg:px-6 pb-4" iframeTitle="PDF" />
      ) : null}

      <PdfImportQuestionEditorModal open={editorOpen} pageNumber={activePage} pageLabel={activePageMeta?.sectionLabel ?? `Trang ${activePage}`} initialText={activePageMeta?.text ?? ''} editing={editing} isDraft={isDraft} saving={saving} onClose={() => { setEditorOpen(false); setEditing(null); }} onSave={handleSave} />
    </article>
  );
}
