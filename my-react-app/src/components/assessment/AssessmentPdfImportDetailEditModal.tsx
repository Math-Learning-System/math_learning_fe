import { useEffect, useState } from 'react';
import ModalCloseButton from '../common/ModalCloseButton';
import {
  useAssessmentImportFormOptions,
  useUpdatePdfImportMetadata,
} from '../../hooks/useAssessment';
import { useCurriculumHierarchyCatalog } from '../../hooks/useCurriculumHierarchyCatalog';
import { useGetMyQuestionBanks } from '../../hooks/useQuestionBank';
import type { AssessmentResponse } from '../../types';
import {
  buildPdfImportDetailFormState,
  pdfImportDetailFormToRequest,
  type PdfImportDetailFormState,
} from '../../utils/assessmentPdfImportDetail';
import { scopeShowsField } from '../../utils/examImportScope';
import { formatSchoolGradeLabel } from '../../utils/schoolGradeLabel';
import '../../pages/assessments/assessment-builder-flow.css';

type Props = {
  assessment: AssessmentResponse;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

const assessmentTypeOptions: { value: PdfImportDetailFormState['assessmentType']; label: string }[] =
  [
    { value: 'QUIZ', label: 'Kiểm tra' },
    { value: 'TEST', label: 'Bài kiểm tra' },
    { value: 'EXAM', label: 'Đề thi' },
    { value: 'HOMEWORK', label: 'Bài tập về nhà' },
  ];

export function AssessmentPdfImportDetailEditModal({
  assessment,
  isOpen,
  onClose,
  onSaved,
}: Props) {
  const optionsQuery = useAssessmentImportFormOptions();
  const opts = optionsQuery.data?.result;
  const saveMutation = useUpdatePdfImportMetadata(assessment.id);

  const [form, setForm] = useState<PdfImportDetailFormState>(() =>
    buildPdfImportDetailFormState(assessment)
  );
  const [error, setError] = useState<string | null>(null);

  const { schoolGrades, subjects, gradesLoading, subjectsLoading } =
    useCurriculumHierarchyCatalog(
      { gradeId: form.schoolGradeId, subjectId: form.subjectId, chapterId: '' },
      { refetchOnMount: 'always', staleTime: 0 }
    );

  const banksQuery = useGetMyQuestionBanks(0, 100);
  const banks = banksQuery.data?.result?.content;
  const bankCount = banks?.length ?? 0;
  const gradeCount = schoolGrades.length;
  const subjectCount = subjects.length;

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildPdfImportDetailFormState(assessment));
    setError(null);
  }, [isOpen, assessment.id]);

  /** Resolve grade/subject/bank IDs from names once catalog loads (stable deps — no array refs). */
  useEffect(() => {
    if (!isOpen) return;
    if (gradeCount === 0 && bankCount === 0) return;

    setForm((prev) => {
      const resolved = buildPdfImportDetailFormState(
        assessment,
        schoolGrades,
        subjects,
        banks ?? []
      );
      const schoolGradeId = prev.schoolGradeId || resolved.schoolGradeId;
      const subjectId = prev.subjectId || resolved.subjectId;
      const questionBankId = prev.questionBankId || resolved.questionBankId;
      if (
        schoolGradeId === prev.schoolGradeId &&
        subjectId === prev.subjectId &&
        questionBankId === prev.questionBankId
      ) {
        return prev;
      }
      return { ...prev, schoolGradeId, subjectId, questionBankId };
    });
  }, [isOpen, assessment.id, gradeCount, subjectCount, bankCount]);

  const schoolYears = opts?.schoolYears ?? [];
  const examTypes = opts?.examTypes ?? [];
  const departments = opts?.departments ?? [];
  const examScopes = opts?.examScopes ?? [];
  const organizerTypes = opts?.organizerTypes ?? [];
  const provinceCities = opts?.provinceCities ?? [];
  const pdfLayouts = opts?.pdfLayouts ?? [];
  const importContentModes = opts?.importContentModes ?? [];
  const selectedScope = examScopes.find((s) => s.id === form.examScope);

  function patch<K extends keyof PdfImportDetailFormState>(key: K, value: PdfImportDetailFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleGradeChange(id: string) {
    setForm((prev) => ({ ...prev, schoolGradeId: id, subjectId: '' }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.schoolYear.trim()) {
      setError('Vui lòng chọn năm học.');
      return;
    }
    if (!form.examType.trim()) {
      setError('Vui lòng chọn loại đề.');
      return;
    }
    if (!form.schoolGradeId) {
      setError('Vui lòng chọn chương trình (lớp).');
      return;
    }
    if (!form.subjectId) {
      setError('Vui lòng chọn môn học.');
      return;
    }
    const minutes = form.timeLimitMinutes.trim();
    if (minutes && (Number.isNaN(Number(minutes)) || Number(minutes) < 1)) {
      setError('Thời gian làm bài phải là số phút >= 1.');
      return;
    }

    try {
      await saveMutation.mutateAsync(pdfImportDetailFormToRequest(form));
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu thông tin chi tiết.');
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#E8E6DC] shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-labelledby="pdf-import-detail-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#F0EEE6] shrink-0">
          <h2
            id="pdf-import-detail-edit-title"
            className="font-[Playfair_Display] text-[18px] font-medium text-[#141413] m-0"
          >
            Chỉnh sửa thông tin chi tiết
          </h2>
          <ModalCloseButton onClick={onClose} />
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="abf-field sm:col-span-2">
              <span className="abf-field__label">Tên đề</span>
              <input
                className="input"
                value={form.examTitle}
                onChange={(e) => patch('examTitle', e.target.value)}
              />
            </label>
            <label className="abf-field">
              <span className="abf-field__label">Năm học</span>
              <select
                className="select"
                value={form.schoolYear}
                onChange={(e) => patch('schoolYear', e.target.value)}
              >
                <option value="">Chọn năm học</option>
                {schoolYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="abf-field">
              <span className="abf-field__label">Loại đề</span>
              <select
                className="select"
                value={form.examType}
                onChange={(e) => patch('examType', e.target.value)}
              >
                <option value="">Chọn loại đề</option>
                {examTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="abf-field">
              <span className="abf-field__label">Cấp đề thi</span>
              <select
                className="select"
                value={form.examScope}
                onChange={(e) => patch('examScope', e.target.value)}
              >
                <option value="">Chọn cấp đề</option>
                {examScopes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="abf-field">
              <span className="abf-field__label">Loại đơn vị ra đề</span>
              <select
                className="select"
                value={form.organizerType}
                onChange={(e) => patch('organizerType', e.target.value)}
              >
                <option value="">Chọn loại đơn vị</option>
                {organizerTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            {scopeShowsField(selectedScope, 'provinceCity') ? (
              <label className="abf-field">
                <span className="abf-field__label">Tỉnh / Thành phố</span>
                <select
                  className="select"
                  value={form.provinceCity}
                  onChange={(e) => patch('provinceCity', e.target.value)}
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {provinceCities.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {scopeShowsField(selectedScope, 'district') ? (
              <label className="abf-field">
                <span className="abf-field__label">Quận / Huyện</span>
                <input
                  className="input"
                  value={form.district}
                  onChange={(e) => patch('district', e.target.value)}
                />
              </label>
            ) : null}
            {scopeShowsField(selectedScope, 'schoolName') ? (
              <label className="abf-field sm:col-span-2">
                <span className="abf-field__label">Tên trường</span>
                <input
                  className="input"
                  value={form.schoolName}
                  onChange={(e) => patch('schoolName', e.target.value)}
                />
              </label>
            ) : null}
            <label className="abf-field sm:col-span-2">
              <span className="abf-field__label">Đơn vị ra đề</span>
              <select
                className="select"
                value={form.department}
                onChange={(e) => patch('department', e.target.value)}
              >
                <option value="">Chọn đơn vị (tùy chọn)</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="abf-field">
              <span className="abf-field__label">Ngày thi</span>
              <input
                className="input"
                type="date"
                value={form.examDate}
                onChange={(e) => patch('examDate', e.target.value)}
              />
            </label>
            <label className="abf-field">
              <span className="abf-field__label">Chương trình</span>
              <select
                className="select"
                value={form.schoolGradeId}
                onChange={(e) => handleGradeChange(e.target.value)}
                disabled={gradesLoading}
              >
                <option value="">Chọn chương trình</option>
                {schoolGrades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {formatSchoolGradeLabel(g)}
                  </option>
                ))}
              </select>
            </label>
            <label className="abf-field">
              <span className="abf-field__label">Môn học</span>
              <select
                className="select"
                value={form.subjectId}
                onChange={(e) => patch('subjectId', e.target.value)}
                disabled={!form.schoolGradeId || subjectsLoading}
              >
                <option value="">{!form.schoolGradeId ? 'Chọn lớp trước' : 'Chọn môn'}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="abf-field">
              <span className="abf-field__label">Thời gian làm bài (phút)</span>
              <input
                className="input"
                type="number"
                min={1}
                value={form.timeLimitMinutes}
                onChange={(e) => patch('timeLimitMinutes', e.target.value)}
              />
            </label>
            <label className="abf-field">
              <span className="abf-field__label">Loại bài kiểm tra</span>
              <select
                className="select"
                value={form.assessmentType}
                onChange={(e) =>
                  patch('assessmentType', e.target.value as PdfImportDetailFormState['assessmentType'])
                }
              >
                {assessmentTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="abf-field">
              <span className="abf-field__label">Bố cục PDF</span>
              <select
                className="select"
                value={form.pdfLayout}
                onChange={(e) => patch('pdfLayout', e.target.value)}
              >
                <option value="">—</option>
                {pdfLayouts.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="abf-field">
              <span className="abf-field__label">Chế độ nội dung</span>
              <select
                className="select"
                value={form.importContentMode}
                onChange={(e) => patch('importContentMode', e.target.value)}
              >
                <option value="">—</option>
                {importContentModes.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.enabled === false}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="abf-field sm:col-span-2">
              <span className="abf-field__label">Gợi ý bối cảnh</span>
              <textarea
                className="input min-h-[72px]"
                value={form.contextHint}
                onChange={(e) => patch('contextHint', e.target.value)}
              />
            </label>
            <label className="abf-field sm:col-span-2">
              <span className="abf-field__label">Ngân hàng câu hỏi</span>
              <select
                className="select"
                value={form.questionBankId}
                onChange={(e) => patch('questionBankId', e.target.value)}
              >
                <option value="">Không chọn</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <p className="px-5 text-[13px] text-red-600 m-0">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#F0EEE6] shrink-0">
            <button type="button" className="btn secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
