import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileUp,
  UploadCloud,
} from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import MathText from '../../components/common/MathText';
import { PdfPreviewWithToggle } from '../../components/common/PdfPreviewWithToggle';
import { formatSchoolGradeLabel } from '../../utils/schoolGradeLabel';
import {
  examScopeLabel,
  organizerTypeLabel,
  scopeShowsField,
} from '../../utils/examImportScope';
import type { AssessmentImportFromPdfParams } from '../../types';
import {
  useAssessmentImportFormOptions,
  useImportAssessmentFromPdf,
} from '../../hooks/useAssessment';
import { useCurriculumHierarchyCatalog } from '../../hooks/useCurriculumHierarchyCatalog';
import { useGetMyQuestionBanks } from '../../hooks/useQuestionBank';
import type { AssessmentImportResponse, PdfImportedExam } from '../../types';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './assessment-builder-flow.css';

export function AssessmentPdfImportFlow() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [department, setDepartment] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examType, setExamType] = useState('');
  const [schoolGradeId, setSchoolGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [contextHint, setContextHint] = useState('');
  const [questionBankId, setQuestionBankId] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<AssessmentImportResponse | null>(null);

  const importMutation = useImportAssessmentFromPdf();
  const banksQuery = useGetMyQuestionBanks(0, 100);
  const banks = banksQuery.data?.result?.content ?? [];

  function reset() {
    setFile(null);
    setExamTitle('');
    setSchoolYear('');
    setDepartment('');
    setExamDate('');
    setExamType('');
    setSchoolGradeId('');
    setSubjectId('');
    setContextHint('');
    setQuestionBankId('');
    setTimeLimitMinutes('');
    setFormError('');
    setResult(null);
    importMutation.reset();
  }

  async function handleImport(extra: Omit<AssessmentImportFromPdfParams, 'file'>) {
    if (!file) return;
    if (!schoolYear.trim()) {
      setFormError('Vui lòng chọn năm học.');
      return;
    }
    if (!examType.trim()) {
      setFormError('Vui lòng chọn loại đề.');
      return;
    }
    if (!schoolGradeId) {
      setFormError('Vui lòng chọn chương trình (lớp).');
      return;
    }
    if (!subjectId) {
      setFormError('Vui lòng chọn môn học.');
      return;
    }
    setFormError('');
    try {
      const response = await importMutation.mutateAsync({
        file,
        examTitle: examTitle.trim() || undefined,
        schoolYear: schoolYear.trim(),
        department: department.trim() || undefined,
        examDate: examDate || undefined,
        examType: examType.trim(),
        schoolGradeId,
        subjectId,
        contextHint: contextHint.trim() || undefined,
        questionBankId: questionBankId || undefined,
        assessmentType: 'EXAM',
        timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
        ...extra,
      });
      setResult(response.result ?? null);
    } catch {
      // error shown via importMutation.isError
    }
  }

  return (
    <div className="assessment-pdf-import space-y-6">
      <section className="rounded-2xl border border-[#E8E6DC] bg-[#FAF9F5] p-5 sm:p-6">
        <span className="inline-flex items-center rounded-full bg-[#E8E6DC] px-2.5 py-0.5 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#5E5D59]">
          Cách 2
        </span>
        <h3 className="mt-2 font-[Playfair_Display] text-[19px] font-medium text-[#141413]">
          Import đề từ PDF
        </h3>
        <p className="mt-2 max-w-[62ch] font-[Be_Vietnam_Pro] text-[13px] leading-relaxed text-[#87867F]">
          Tải file PDF đề thi có sẵn. Hệ thống dùng AI trích xuất câu hỏi và tạo đề nháp để bạn rà
          soát trước khi công khai.
        </p>

        {!result ? (
          <ImportForm
            inputRef={inputRef}
            file={file}
            setFile={setFile}
            examTitle={examTitle}
            setExamTitle={setExamTitle}
            schoolYear={schoolYear}
            setSchoolYear={setSchoolYear}
            department={department}
            setDepartment={setDepartment}
            examDate={examDate}
            setExamDate={setExamDate}
            examType={examType}
            setExamType={setExamType}
            schoolGradeId={schoolGradeId}
            setSchoolGradeId={setSchoolGradeId}
            subjectId={subjectId}
            setSubjectId={setSubjectId}
            timeLimitMinutes={timeLimitMinutes}
            setTimeLimitMinutes={setTimeLimitMinutes}
            contextHint={contextHint}
            setContextHint={setContextHint}
            questionBankId={questionBankId}
            setQuestionBankId={setQuestionBankId}
            banks={banks}
            formError={formError}
            importMutation={importMutation}
            onReset={reset}
            onImport={(extra) => void handleImport(extra)}
          />
        ) : (
          <ImportResult
            result={result}
            onReset={reset}
            onReview={(id) => navigate(`/teacher/assessments/${id}`)}
          />
        )}
      </section>
    </div>
  );
}

function ImportForm({
  inputRef,
  file,
  setFile,
  examTitle,
  setExamTitle,
  schoolYear,
  setSchoolYear,
  department,
  setDepartment,
  examDate,
  setExamDate,
  examType,
  setExamType,
  schoolGradeId,
  setSchoolGradeId,
  subjectId,
  setSubjectId,
  timeLimitMinutes,
  setTimeLimitMinutes,
  contextHint,
  setContextHint,
  questionBankId,
  setQuestionBankId,
  banks,
  formError,
  importMutation,
  onReset,
  onImport,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  file: File | null;
  setFile: (f: File | null) => void;
  examTitle: string;
  setExamTitle: (v: string) => void;
  schoolYear: string;
  setSchoolYear: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  examDate: string;
  setExamDate: (v: string) => void;
  examType: string;
  setExamType: (v: string) => void;
  schoolGradeId: string;
  setSchoolGradeId: (v: string) => void;
  subjectId: string;
  setSubjectId: (v: string) => void;
  timeLimitMinutes: string;
  setTimeLimitMinutes: (v: string) => void;
  contextHint: string;
  setContextHint: (v: string) => void;
  questionBankId: string;
  setQuestionBankId: (v: string) => void;
  banks: { id: string; name: string }[];
  formError: string;
  importMutation: ReturnType<typeof useImportAssessmentFromPdf>;
  onReset: () => void;
  onImport: (extra: Omit<AssessmentImportFromPdfParams, 'file'>) => void;
}) {
  const optionsQuery = useAssessmentImportFormOptions();
  const opts = optionsQuery.data?.result;
  const schoolYears = opts?.schoolYears ?? [];
  const examTypes = opts?.examTypes ?? [];
  const departments = opts?.departments ?? [];
  const examScopes = opts?.examScopes ?? [];
  const organizerTypes = opts?.organizerTypes ?? [];
  const provinceCities = opts?.provinceCities ?? [];
  const configCountry = opts?.country ?? '';

  const [examScope, setExamScope] = useState('');
  const [organizerType, setOrganizerType] = useState('');
  const [provinceCity, setProvinceCity] = useState('');
  const [district, setDistrict] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const selectedScope = examScopes.find((s) => s.id === examScope);

  const {
    schoolGrades,
    subjects,
    gradesLoading,
    subjectsLoading,
    catalogError,
    refetchGrades,
  } = useCurriculumHierarchyCatalog(
    {
      gradeId: schoolGradeId,
      subjectId,
      chapterId: '',
    },
    { refetchOnMount: 'always', staleTime: 0 }
  );

  useEffect(() => {
    if (!schoolYear && schoolYears.length > 0) {
      setSchoolYear(schoolYears[schoolYears.length - 1]);
    }
  }, [schoolYears, schoolYear, setSchoolYear]);

  useEffect(() => {
    if (!examType && examTypes.length > 0) {
      setExamType(examTypes[0]);
    }
  }, [examTypes, examType, setExamType]);

  useEffect(() => {
    if (!examScope && examScopes.length > 0) {
      setExamScope(examScopes[0].id);
    }
  }, [examScopes, examScope]);

  useEffect(() => {
    if (!organizerType && organizerTypes.length > 0) {
      setOrganizerType(organizerTypes[0].id);
    }
  }, [organizerTypes, organizerType]);

  function handleGradeChange(id: string) {
    setSchoolGradeId(id);
    setSubjectId('');
  }

  return (
    <>
      <button
        type="button"
        className="mt-5 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#D1CFC5] bg-white px-6 py-10 text-center transition-colors hover:border-[#C96442]/50 hover:bg-[#FFFBF8]"
        onClick={() => inputRef.current?.click()}
        onDrop={(event) => {
          event.preventDefault();
          const next = event.dataTransfer.files?.[0];
          if (
            next &&
            (next.type === 'application/pdf' || next.name.toLowerCase().endsWith('.pdf'))
          ) {
            setFile(next);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
      >
        <UploadCloud className="h-8 w-8 text-[#87867F]" aria-hidden />
        <span className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
          {file ? file.name : 'Kéo thả hoặc chọn file PDF'}
        </span>
        <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">Chỉ hỗ trợ .pdf — tối đa 10MB</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,application/pdf"
        onChange={(event) => {
          const next = event.target.files?.[0];
          if (next) setFile(next);
        }}
      />

      {file ? (
        <PdfPreviewWithToggle
          file={file}
          collapsible
          defaultOpen
          showLabel="Xem trước đề PDF"
          hideLabel="Ẩn preview PDF"
          variant="warm"
          iframeTitle="Xem trước đề thi PDF"
          subtitle="Kiểm tra đúng file trước khi AI trích xuất câu hỏi"
          className="mt-4"
        />
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="abf-field sm:col-span-2">
          <span className="abf-field__label">Tên đề</span>
          <input
            className="input"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            placeholder="VD: Đề kiểm tra 15 phút Chương 3"
          />
        </label>
        <label className="abf-field">
          <span className="abf-field__label">Năm học</span>
          <select
            className="select"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            disabled={optionsQuery.isLoading && schoolYears.length === 0}
          >
            <option value="">
              {optionsQuery.isLoading && schoolYears.length === 0
                ? 'Đang tải…'
                : schoolYears.length === 0
                  ? 'Chưa cấu hình — liên hệ admin'
                  : 'Chọn năm học'}
            </option>
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
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            disabled={optionsQuery.isLoading && examTypes.length === 0}
          >
            <option value="">
              {optionsQuery.isLoading && examTypes.length === 0
                ? 'Đang tải…'
                : examTypes.length === 0
                  ? 'Chưa cấu hình — liên hệ admin'
                  : 'Chọn loại đề'}
            </option>
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
            value={examScope}
            onChange={(e) => setExamScope(e.target.value)}
            disabled={optionsQuery.isLoading && examScopes.length === 0}
          >
            <option value="">
              {examScopes.length === 0 ? 'Đang tải…' : 'Chọn cấp đề'}
            </option>
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
            value={organizerType}
            onChange={(e) => setOrganizerType(e.target.value)}
            disabled={organizerTypes.length === 0}
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
              value={provinceCity}
              onChange={(e) => setProvinceCity(e.target.value)}
            >
              <option value="">Chọn tỉnh/thành (tùy chọn)</option>
              {provinceCities.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                  {p.type === 'municipality' ? ' (TP trực thuộc TW)' : ''}
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
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="VD: Quận Ba Đình"
            />
          </label>
        ) : null}
        {scopeShowsField(selectedScope, 'schoolName') ? (
          <label className="abf-field sm:col-span-2">
            <span className="abf-field__label">Tên trường</span>
            <input
              className="input"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="VD: THPT Chuyên Hà Nội - Amsterdam"
            />
          </label>
        ) : null}
        <label className="abf-field sm:col-span-2">
          <span className="abf-field__label">Đơn vị ra đề</span>
          <select
            className="select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={optionsQuery.isLoading && departments.length === 0}
          >
            <option value="">
              {departments.length === 0
                ? 'Chưa cấu hình — liên hệ admin'
                : 'Chọn đơn vị ra đề (tùy chọn)'}
            </option>
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
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </label>
        <label className="abf-field">
          <span className="abf-field__label">Chương trình (theo lớp)</span>
          <select
            className="select"
            value={schoolGradeId}
            onChange={(e) => handleGradeChange(e.target.value)}
            disabled={gradesLoading}
          >
            <option value="">
              {gradesLoading
                ? 'Đang tải…'
                : schoolGrades.length === 0
                  ? 'Chưa có chương trình đang hoạt động'
                  : 'Chọn chương trình'}
            </option>
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
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={!schoolGradeId || subjectsLoading}
          >
            <option value="">
              {!schoolGradeId
                ? 'Chọn lớp trước'
                : subjectsLoading
                  ? 'Đang tải…'
                  : subjects.length === 0
                    ? 'Chưa có môn đang hoạt động'
                    : 'Chọn môn'}
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="abf-field">
          <span className="abf-field__label">Thời gian (phút)</span>
          <input
            className="input"
            type="number"
            min={1}
            value={timeLimitMinutes}
            onChange={(e) => setTimeLimitMinutes(e.target.value)}
            placeholder="45"
          />
        </label>
        <label className="abf-field sm:col-span-2">
          <span className="abf-field__label">Gợi ý bối cảnh (tùy chọn)</span>
          <input
            className="input"
            value={contextHint}
            onChange={(e) => setContextHint(e.target.value)}
            placeholder="Đề giữa kỳ, trắc nghiệm + tự luận ngắn"
          />
        </label>
        <label className="abf-field sm:col-span-2">
          <span className="abf-field__label">Lưu câu vào ngân hàng (tùy chọn)</span>
          <select
            className="select"
            value={questionBankId}
            onChange={(e) => setQuestionBankId(e.target.value)}
          >
            <option value="">Không gán ngân hàng</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {optionsQuery.isError && (
        <p className="mt-4 font-[Be_Vietnam_Pro] text-[13px] text-[#BE123C]">
          Không tải được năm học / loại đề. Liên hệ admin cấu hình tại Cấu trúc học thuật.
        </p>
      )}

      {!gradesLoading && !catalogError && schoolGrades.length === 0 && (
        <p className="mt-4 font-[Be_Vietnam_Pro] text-[13px] text-[#B45309]">
          Chưa có chương trình/lớp đang bật. Admin cần tạo hoặc kích hoạt lớp (vd. Lớp 9) tại{' '}
          <strong>Cấu trúc học thuật</strong> — mục bị vô hiệu hóa sẽ không hiện ở đây.
        </p>
      )}

      {catalogError && (
        <p className="mt-4 font-[Be_Vietnam_Pro] text-[13px] text-[#BE123C]">
          Không tải được danh mục lớp/môn.{' '}
          <button
            type="button"
            className="underline font-medium"
            onClick={() => void refetchGrades()}
          >
            Thử tải lại
          </button>
        </p>
      )}

      {schoolGradeId && !subjectsLoading && subjects.length === 0 && (
        <p className="mt-4 font-[Be_Vietnam_Pro] text-[13px] text-[#B45309]">
          Lớp đã chọn chưa có môn đang hoạt động. Kiểm tra môn Toán (và các môn khác) đã gắn lớp và
          đang bật trong Cấu trúc học thuật.
        </p>
      )}

      {formError && (
        <p className="mt-4 font-[Be_Vietnam_Pro] text-[13px] text-[#BE123C]">{formError}</p>
      )}

      {importMutation.isError && (
        <p className="mt-4 font-[Be_Vietnam_Pro] text-[13px] text-[#BE123C]">
          {(importMutation.error as Error)?.message || 'Import PDF thất bại'}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <button type="button" className="btn secondary" onClick={onReset} disabled={importMutation.isPending}>
          Xóa form
        </button>
        <button
          type="button"
          className="btn inline-flex items-center gap-2"
          disabled={!file || importMutation.isPending}
          onClick={() =>
            onImport({
              examScope: examScope || undefined,
              organizerName: department.trim() || undefined,
              organizerType: organizerType || undefined,
              provinceCity: provinceCity.trim() || undefined,
              district: district.trim() || undefined,
              schoolName: schoolName.trim() || undefined,
              country: configCountry || undefined,
            })
          }
        >
          <FileUp className="h-4 w-4" aria-hidden />
          {importMutation.isPending ? 'Đang phân tích PDF…' : 'Tạo đề từ PDF'}
        </button>
      </div>
    </>
  );
}

function ImportResult({
  result,
  onReset,
  onReview,
}: {
  result: AssessmentImportResponse;
  onReset: () => void;
  onReview: (id: string) => void;
}) {
  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-[#D1FAE5] bg-[#ECFDF5] p-4">
        {result.analysisSuccessful ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#047857]" />
        ) : (
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" />
        )}
        <div>
          <p className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
            Đã tạo đề nháp: {result.assessment?.title}
          </p>
          <p className="mt-1 font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">
            {result.questionsImported} câu đã import
            {result.questionsSkipped > 0 ? ` · ${result.questionsSkipped} câu bỏ qua` : ''}
            {result.confidenceScore != null
              ? ` · Độ tin cậy ${Math.round(result.confidenceScore * 100)}%`
              : ''}
          </p>
          {result.warnings && result.warnings.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {result.exam && <ExamMetadataCard exam={result.exam} />}

      {result.parsedQuestions && result.parsedQuestions.length > 0 && (
        <ParsedQuestionsList items={result.parsedQuestions} />
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" className="btn secondary" onClick={onReset}>
          Import file khác
        </button>
        {result.assessment?.id && (
          <button
            type="button"
            className="btn inline-flex items-center gap-2"
            onClick={() => onReview(result.assessment.id)}
          >
            Rà soát đề
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

function ExamMetadataCard({ exam }: { exam: PdfImportedExam }) {
  const optionsQuery = useAssessmentImportFormOptions();
  const opts = optionsQuery.data?.result;

  const rows: { label: string; value?: string | number }[] = [
    { label: 'Tên đề', value: exam.examTitle },
    {
      label: 'Cấp đề',
      value: examScopeLabel(opts?.examScopes, exam.examScope),
    },
    {
      label: 'Đơn vị ra đề',
      value: exam.organizerName ?? exam.department,
    },
    {
      label: 'Loại đơn vị',
      value: organizerTypeLabel(opts?.organizerTypes, exam.organizerType),
    },
    { label: 'Tỉnh/Thành', value: exam.provinceCity },
    { label: 'Quận/Huyện', value: exam.district },
    { label: 'Trường', value: exam.schoolName },
    { label: 'Quốc gia', value: exam.country },
    { label: 'Môn', value: exam.subject },
    { label: 'Năm học', value: exam.schoolYear },
    { label: 'Ngày thi', value: exam.examDate },
    {
      label: 'Thời gian',
      value: exam.durationMinutes != null ? `${exam.durationMinutes} phút` : undefined,
    },
    { label: 'Loại đề', value: exam.examType },
    { label: 'Khối/lớp', value: exam.gradeLevel },
    { label: 'Số trang', value: exam.totalPages },
    { label: 'File nguồn', value: exam.sourceFile },
  ].filter((r) => r.value != null && String(r.value).trim() !== '');

  return (
    <div className="rounded-xl border border-[#E8E6DC] bg-white p-4">
      <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold uppercase tracking-wide text-[#87867F]">
        Thông tin đề (cấp đề thi)
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-[#FAF9F5] px-3 py-2">
            <dt className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F]">{row.label}</dt>
            <dd className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {exam.rawHeaderText && (
        <details className="mt-3">
          <summary className="cursor-pointer font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59]">
            Phần đầu đề (raw_header_text)
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-[#F0EEE6] bg-[#FAF9F5] p-3 font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
            {exam.rawHeaderText}
          </pre>
        </details>
      )}
    </div>
  );
}

function ParsedQuestionsList({
  items,
}: {
  items: NonNullable<AssessmentImportResponse['parsedQuestions']>;
}) {
  return (
    <div className="rounded-xl border border-[#E8E6DC] bg-white p-4">
      <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold uppercase tracking-wide text-[#87867F]">
        Câu hỏi đã phân tích (cấp câu / ý)
      </p>
      <ol className="mt-3 max-h-80 list-none space-y-2 overflow-y-auto p-0">
        {items.map((q) => (
          <li
            key={`${q.orderIndex}-${q.displayLabel ?? ''}-${q.imported}`}
            className="rounded-lg border border-[#F0EEE6] bg-[#FAF9F5] px-3 py-2.5 text-[13px]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#141413]">
                {q.displayLabel ?? `Câu ${q.orderIndex}`}
              </span>
              {q.questionType && (
                <span className="rounded-full bg-[#E8E6DC] px-2 py-0.5 text-[10px] font-medium uppercase text-[#5E5D59]">
                  {q.questionType}
                </span>
              )}
              {q.hasTable && (
                <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-medium text-[#1D4ED8]">
                  Bảng
                </span>
              )}
              <span
                className={`ml-auto text-[11px] ${q.imported ? 'text-[#047857]' : 'text-[#B45309]'}`}
              >
                {q.imported ? 'Đã thêm' : q.skipReason ?? 'Bỏ qua'}
              </span>
            </div>
            <div className="mt-1.5 min-w-0">
              <MathText text={q.questionText} />
            </div>
            {q.detail?.mathLatex && q.detail.mathLatex.length > 0 && (
              <p className="mt-1 font-mono text-[11px] text-[#6D28D9]">
                LaTeX: {q.detail.mathLatex.slice(0, 2).join(' · ')}
                {q.detail.mathLatex.length > 2 ? '…' : ''}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
