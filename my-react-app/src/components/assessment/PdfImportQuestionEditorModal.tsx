import { Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import MathText from '../common/MathText';
import type { AssessmentQuestionItem } from '../../types';
import type { QuestionType } from '../../types/question';

type Props = {
  open: boolean;
  pageNumber: number;
  pageLabel: string;
  initialText?: string;
  editing?: AssessmentQuestionItem | null;
  isDraft: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: {
    questionText: string;
    questionType: QuestionType;
    correctAnswer: string;
    points: number;
  }) => Promise<void>;
};

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'ESSAY', label: 'Tự luận' },
  { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
  { value: 'TRUE_FALSE', label: 'Đúng/Sai' },
  { value: 'SHORT_ANSWER', label: 'Trả lời ngắn' },
];

export function PdfImportQuestionEditorModal({
  open,
  pageNumber,
  pageLabel,
  initialText = '',
  editing,
  isDraft,
  saving,
  onClose,
  onSave,
}: Props) {
  const [questionText, setQuestionText] = useState(initialText);
  const [questionType, setQuestionType] = useState<QuestionType>('ESSAY');
  const [correctAnswer, setCorrectAnswer] = useState('REVIEW_REQUIRED');
  const [points, setPoints] = useState('1');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setQuestionText(editing.questionText);
      setQuestionType((editing.questionType as QuestionType) ?? 'ESSAY');
      setCorrectAnswer(editing.correctAnswer?.trim() || 'REVIEW_REQUIRED');
      setPoints(String(editing.points ?? 1));
    } else {
      setQuestionText(initialText);
      setQuestionType('ESSAY');
      setCorrectAnswer('REVIEW_REQUIRED');
      setPoints('1');
    }
  }, [open, editing, initialText]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = questionText.trim();
    if (!trimmed) return;
    const parsedPoints = Number(points);
    if (Number.isNaN(parsedPoints) || parsedPoints < 0) return;
    await onSave({
      questionText: trimmed,
      questionType,
      correctAnswer: correctAnswer.trim() || 'REVIEW_REQUIRED',
      points: parsedPoints,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-import-question-editor-title"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
          <div>
            <h2 id="pdf-import-question-editor-title" className="font-[Playfair_Display] text-[18px] font-medium text-[#0f172a] m-0">
              {editing ? 'Sửa câu hỏi' : 'Tạo câu hỏi'} · {pageLabel}
            </h2>
            <p className="mt-0.5 font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] m-0">
              Trang {pageNumber} — soạn LaTeX/Markdown.
            </p>
          </div>
          <button type="button" className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#e2e8f0]" disabled={saving} onClick={onClose} aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto px-5 py-4 space-y-4">
            <label className="block">
              <span className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#475569]">Nội dung câu (LaTeX)</span>
              <textarea className="input mt-1 w-full font-mono text-[13px] min-h-[200px]" value={questionText} onChange={(e) => setQuestionText(e.target.value)} disabled={!isDraft || saving} />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#475569]">Loại</span>
                <select className="input mt-1 w-full" value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)} disabled={!isDraft || saving}>
                  {QUESTION_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#475569]">Đáp án</span>
                <input className="input mt-1 w-full" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} disabled={!isDraft || saving} />
              </label>
              <label className="block">
                <span className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#475569]">Điểm</span>
                <input className="input mt-1 w-full" type="number" min={0} step={0.25} value={points} onChange={(e) => setPoints(e.target.value)} disabled={!isDraft || saving} />
              </label>
            </div>
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
              <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase text-[#64748b] m-0 mb-2">Preview</p>
              <MathText text={questionText || '—'} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-5 py-4">
            <button type="button" className="btn secondary" disabled={saving} onClick={onClose}>Hủy</button>
            <button type="submit" className="btn inline-flex items-center gap-2" disabled={!isDraft || saving || !questionText.trim()}>
              {saving ? (<><Loader2 className="h-4 w-4 animate-spin" />Đang lưu…</>) : editing ? 'Lưu câu hỏi' : 'Tạo và thêm vào đề'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
