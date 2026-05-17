import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileUp,
} from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentPdfImportStepNav } from './AssessmentPdfImportStepNav';
import { AssessmentPdfOcrPanel } from './AssessmentPdfOcrPanel';
import {
  buildPdfImportFileKey,
  buildPreExtractedJson,
  clearAssessmentPdfImportDraft,
  emptyAssessmentPdfImportDraft,
  loadAssessmentPdfImportDraft,
  PDF_IMPORT_WIZARD_STEPS,
  saveAssessmentPdfImportDraft,
  type AssessmentPdfImportWizardStep,
  type PdfImportPageDraft,
} from '../../utils/assessmentPdfImportDraft';
import { isPdfImportExtractConfigValid } from './PdfImportExtractOptions';
import MathText from '../../components/common/MathText';
import { PdfPreviewWithToggle } from '../../components/common/PdfPreviewWithToggle';
import { formatSchoolGradeLabel } from '../../utils/schoolGradeLabel';
import {
  examScopeLabel,
  organizerTypeLabel,
  scopeShowsField,
} from '../../utils/examImportScope';
import {
  useAssessmentImportFormOptions,
  useAssessmentImportSourcePdfUrl,
  useImportAssessmentFromPdf,
} from '../../hooks/useAssessment';
import { useCurriculumHierarchyCatalog } from '../../hooks/useCurriculumHierarchyCatalog';
import { useGetMyQuestionBanks } from '../../hooks/useQuestionBank';
import type { AssessmentImportResponse, CodeLabelOption, PdfImportedExam } from '../../types';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './assessment-builder-flow.css';

export function AssessmentPdfImportFlow() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const savedDraft = loadAssessmentPdfImportDraft();
  const [step, setStep] = useState<AssessmentPdfImportWizardStep>(savedDraft?.step ?? 1);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState(savedDraft?.fileName ?? '');
  const [draftId, setDraftId] = useState(savedDraft?.draftId ?? '');
  const [fileKey, setFileKey] = useState(savedDraft?.fileKey ?? '');
  const [totalPages, setTotalPages] = useState(savedDraft?.totalPages ?? 0);
  const [extractedPages, setExtractedPages] = useState<PdfImportPageDraft[]>(
    savedDraft?.extractedPages ?? []
  );
  const [examTitle, setExamTitle] = useState(savedDraft?.examTitle ?? '');
  const [schoolYear, setSchoolYear] = useState(savedDraft?.schoolYear ?? '');
  const [department, setDepartment] = useState(savedDraft?.department ?? '');
  const [examDate, setExamDate] = useState(savedDraft?.examDate ?? '');
  const [examType, setExamType] = useState(savedDraft?.examType ?? '');
  const [schoolGradeId, setSchoolGradeId] = useState(savedDraft?.schoolGradeId ?? '');
  const [subjectId, setSubjectId] = useState(savedDraft?.subjectId ?? '');
  const [contextHint, setContextHint] = useState(savedDraft?.contextHint ?? '');
  const [questionBankId, setQuestionBankId] = useState(savedDraft?.questionBankId ?? '');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(savedDraft?.timeLimitMinutes ?? '');
  const [examScope, setExamScope] = useState(savedDraft?.examScope ?? '');
  const [organizerType, setOrganizerType] = useState(savedDraft?.organizerType ?? '');
  const [provinceCity, setProvinceCity] = useState(savedDraft?.provinceCity ?? '');
  const [district, setDistrict] = useState(savedDraft?.district ?? '');
  const [schoolName, setSchoolName] = useState(savedDraft?.schoolName ?? '');
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<AssessmentImportResponse | null>(null);
  const [pdfLayout, setPdfLayout] = useState(savedDraft?.pdfLayout ?? '');
  const [importContentMode, setImportContentMode] = useState(
    savedDraft?.importContentMode ?? ''
  );

  const importMutation = useImportAssessmentFromPdf();
  const optionsQuery = useAssessmentImportFormOptions();
  const opts = optionsQuery.data?.result;
  const banksQuery = useGetMyQuestionBanks(0, 100);
  const banks = banksQuery.data?.result?.content ?? [];
  const { schoolGrades, subjects } = useCurriculumHierarchyCatalog(
    { gradeId: schoolGradeId, subjectId, chapterId: '' },
    { refetchOnMount: 'always', staleTime: 0 }
  );

  useEffect(() => {
    saveAssessmentPdfImportDraft({
      step,
      draftId,
      fileKey,
      fileName,
      totalPages,
      extractedPages,
      pdfLayout,
      importContentMode,
      examTitle,
      schoolYear,
      department,
      examDate,
      examType,
      schoolGradeId,
      subjectId,
      contextHint,
      questionBankId,
      timeLimitMinutes,
      examScope,
      organizerType,
      provinceCity,
      district,
      schoolName,
    });
  }, [
    step,
    draftId,
    fileKey,
    fileName,
    totalPages,
    extractedPages,
    pdfLayout,
    importContentMode,
    examTitle,
    schoolYear,
    department,
    examDate,
    examType,
    schoolGradeId,
    subjectId,
    contextHint,
    questionBankId,
    timeLimitMinutes,
    examScope,
    organizerType,
    provinceCity,
    district,
    schoolName,
  ]);

  function selectFile(next: File | null) {
    setFile(next);
    setFileName(next?.name ?? '');
    if (next) {
      const key = buildPdfImportFileKey(next);
      if (fileKey && fileKey !== key) {
        setDraftId('');
        setExtractedPages([]);
        setTotalPages(0);
      }
      setFileKey(key);
    } else {
      setFileKey('');
      setDraftId('');
      setExtractedPages([]);
      setTotalPages(0);
    }
  }

  function validateStep(target: AssessmentPdfImportWizardStep): string | null {
    if (target === 1) {
      if (!schoolYear.trim()) return 'Vui lòng chọn năm học.';
      if (!examType.trim()) return 'Vui lòng chọn loại đề.';
      if (!schoolGradeId) return 'Vui lòng chọn chương trình (lớp).';
      if (!subjectId) return 'Vui lòng chọn môn học.';
      return null;
    }
    if (target === 2) {
      if (!file) return 'Vui lòng chọn file PDF (kéo thả hoặc chọn file ở đầu bước 2).';
      if (
        !isPdfImportExtractConfigValid(
          pdfLayout,
          importContentMode,
          opts?.importContentModes ?? []
        )
      ) {
        return 'Chọn dạng PDF và cách xử lý nội dung (ngay trên nút trích text).';
      }
      if (totalPages < 1) {
        return 'Đợi đếm xong số trang PDF hoặc bấm «Đếm lại trang» nếu lỗi.';
      }
      const done = extractedPages.filter((p) => p.status === 'done' && p.text.trim());
      if (done.length === 0) {
        return 'Bấm nút «Bắt đầu trích text» (góc phải khối trắng) và đợi ít nhất một trang xong.';
      }
      return null;
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError('');
    if (step < 3) {
      setStep((s) => (s + 1) as AssessmentPdfImportWizardStep);
    }
  }

  function goBack() {
    setFormError('');
    if (step > 1) {
      setStep((s) => (s - 1) as AssessmentPdfImportWizardStep);
    }
  }

  function jumpTo(target: AssessmentPdfImportWizardStep) {
    if (target >= step) return;
    setFormError('');
    setStep(target);
  }

  useEffect(() => {
    const layouts = opts?.pdfLayouts ?? [];
    if (!pdfLayout && layouts.length > 0) {
      setPdfLayout(layouts[0].id);
    }
    const modes = opts?.importContentModes ?? [];
    if (!importContentMode && modes.length > 0) {
      const enabled = modes.find((m) => m.enabled !== false) ?? modes[0];
      setImportContentMode(enabled.id);
    }
  }, [opts?.pdfLayouts, opts?.importContentModes, pdfLayout, importContentMode]);

  function reset() {
    setStep(1);
    setFile(null);
    setFileName('');
    setDraftId('');
    setFileKey('');
    setTotalPages(0);
    setExtractedPages([]);
    const empty = emptyAssessmentPdfImportDraft();
    setExamTitle(empty.examTitle);
    setSchoolYear(empty.schoolYear);
    setDepartment(empty.department);
    setExamDate(empty.examDate);
    setExamType(empty.examType);
    setSchoolGradeId(empty.schoolGradeId);
    setSubjectId(empty.subjectId);
    setContextHint(empty.contextHint);
    setQuestionBankId(empty.questionBankId);
    setTimeLimitMinutes(empty.timeLimitMinutes);
    setExamScope(empty.examScope);
    setOrganizerType(empty.organizerType);
    setProvinceCity(empty.provinceCity);
    setDistrict(empty.district);
    setSchoolName(empty.schoolName);
    setPdfLayout(empty.pdfLayout);
    setImportContentMode(empty.importContentMode);
    setFormError('');
    setResult(null);
    clearAssessmentPdfImportDraft();
    importMutation.reset();
  }

  async function handleImport() {
    for (const s of [1, 2, 3] as const) {
      const err = validateStep(s);
      if (err) {
        setFormError(err);
        setStep(s);
        return;
      }
    }
    if (!file || !pdfLayout || !importContentMode) return;
    setFormError('');
    try {
      const response = await importMutation.mutateAsync({
        file,
        examTitle: examTitle.trim() || undefined,
        schoolYear: schoolYear.trim(),
        department: department.trim() || undefined,
        examDate: examDate || undefined,
        examType: examType.trim(),
        examScope: examScope || undefined,
        organizerName: department.trim() || undefined,
        organizerType: organizerType || undefined,
        provinceCity: provinceCity.trim() || undefined,
        district: district.trim() || undefined,
        schoolName: schoolName.trim() || undefined,
        country: opts?.country || undefined,
        schoolGradeId,
        subjectId,
        contextHint: contextHint.trim() || undefined,
        questionBankId: questionBankId || undefined,
        assessmentType: 'EXAM',
        timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
        pdfLayout,
        importContentMode,
        preExtractedJson: buildPreExtractedJson({
          fileName: file.name,
          examTitle,
          pdfLayout,
          pages: extractedPages,
          totalPages: totalPages || extractedPages.length,
          wizardForm: {
            examTitle: examTitle.trim() || undefined,
            schoolYear: schoolYear.trim() || undefined,
            department: department.trim() || undefined,
            examDate: examDate || undefined,
            examType: examType.trim() || undefined,
            examScope: examScope || undefined,
            organizerType: organizerType || undefined,
            provinceCity: provinceCity.trim() || undefined,
            district: district.trim() || undefined,
            schoolName: schoolName.trim() || undefined,
            organizerName: department.trim() || undefined,
            schoolGradeId: schoolGradeId || undefined,
            subjectId: subjectId || undefined,
            contextHint: contextHint.trim() || undefined,
            questionBankId: questionBankId || undefined,
            timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
            pdfLayout,
            importContentMode,
            schoolGradeName:
              schoolGrades.find((g) => g.id === schoolGradeId) != null
                ? formatSchoolGradeLabel(schoolGrades.find((g) => g.id === schoolGradeId)!)
                : undefined,
            subjectName: subjects.find((s) => s.id === subjectId)?.name,
          },
        }),
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
          Bước 1: thông tin đề. Bước 2: tải PDF và OCR từng trang (Mathpix PDF).
          OCR lưu MongoDB (7 ngày); form lưu tạm trên trình duyệt. File PDF chọn lại sau F5.
        </p>

        {!result ? (
          <>
            <AssessmentPdfImportStepNav current={step} onJump={jumpTo} />

            {step === 2 && !file && fileName ? (
              <p className="mt-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 font-[Be_Vietnam_Pro] text-[12px] text-[#92400E]">
                Đã lưu OCR trước đó với file <strong>{fileName}</strong>. Chọn lại PDF ở bước 2 để
                import.
              </p>
            ) : null}

            <PdfImportWizardSteps
              step={step}
              stepMeta={PDF_IMPORT_WIZARD_STEPS[step - 1]}
              inputRef={inputRef}
              file={file}
              fileName={fileName}
              onSelectFile={selectFile}
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
              examScope={examScope}
              setExamScope={setExamScope}
              organizerType={organizerType}
              setOrganizerType={setOrganizerType}
              provinceCity={provinceCity}
              setProvinceCity={setProvinceCity}
              district={district}
              setDistrict={setDistrict}
              schoolName={schoolName}
              setSchoolName={setSchoolName}
              pdfLayout={pdfLayout}
              setPdfLayout={setPdfLayout}
              importContentMode={importContentMode}
              setImportContentMode={setImportContentMode}
              draftId={draftId}
              setDraftId={setDraftId}
              fileKey={fileKey}
              setFileKey={setFileKey}
              totalPages={totalPages}
              setTotalPages={setTotalPages}
              extractedPages={extractedPages}
              setExtractedPages={setExtractedPages}
              pdfLayouts={opts?.pdfLayouts ?? []}
              importContentModes={opts?.importContentModes ?? []}
              banks={banks}
              formError={formError}
              importMutation={importMutation}
              onBack={goBack}
              onNext={goNext}
              onReset={reset}
              onImport={() => void handleImport()}
            />
          </>
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

function PdfImportWizardSteps({
  step,
  stepMeta,
  inputRef,
  file,
  fileName,
  onSelectFile,
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
  examScope,
  setExamScope,
  organizerType,
  setOrganizerType,
  provinceCity,
  setProvinceCity,
  district,
  setDistrict,
  schoolName,
  setSchoolName,
  pdfLayout,
  setPdfLayout,
  importContentMode,
  setImportContentMode,
  draftId,
  setDraftId,
  fileKey,
  setFileKey,
  totalPages,
  setTotalPages,
  extractedPages,
  setExtractedPages,
  pdfLayouts,
  importContentModes,
  banks,
  formError,
  importMutation,
  onBack,
  onNext,
  onReset,
  onImport,
}: {
  step: AssessmentPdfImportWizardStep;
  stepMeta: (typeof PDF_IMPORT_WIZARD_STEPS)[number];
  inputRef: RefObject<HTMLInputElement | null>;
  file: File | null;
  fileName: string;
  onSelectFile: (f: File | null) => void;
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
  examScope: string;
  setExamScope: (v: string) => void;
  organizerType: string;
  setOrganizerType: (v: string) => void;
  provinceCity: string;
  setProvinceCity: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  schoolName: string;
  setSchoolName: (v: string) => void;
  pdfLayout: string;
  setPdfLayout: (v: string) => void;
  importContentMode: string;
  setImportContentMode: (v: string) => void;
  draftId: string;
  setDraftId: (v: string) => void;
  fileKey: string;
  setFileKey: (v: string) => void;
  totalPages: number;
  setTotalPages: (n: number) => void;
  extractedPages: PdfImportPageDraft[];
  setExtractedPages: React.Dispatch<React.SetStateAction<PdfImportPageDraft[]>>;
  pdfLayouts: CodeLabelOption[];
  importContentModes: CodeLabelOption[];
  banks: { id: string; name: string }[];
  formError: string;
  importMutation: ReturnType<typeof useImportAssessmentFromPdf>;
  onBack: () => void;
  onNext: () => void;
  onReset: () => void;
  onImport: () => void;
}) {
  const optionsQuery = useAssessmentImportFormOptions();
  const opts = optionsQuery.data?.result;
  const schoolYears = opts?.schoolYears ?? [];
  const examTypes = opts?.examTypes ?? [];
  const departments = opts?.departments ?? [];
  const examScopes = opts?.examScopes ?? [];
  const organizerTypes = opts?.organizerTypes ?? [];
  const provinceCities = opts?.provinceCities ?? [];

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

  const layoutLabel = pdfLayouts.find((l) => l.id === pdfLayout)?.label ?? '—';
  const modeLabel = importContentModes.find((m) => m.id === importContentMode)?.label ?? '—';
  const selectedGrade = schoolGrades.find((g) => g.id === schoolGradeId);
  const gradeLabel = selectedGrade ? formatSchoolGradeLabel(selectedGrade) : '—';
  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? '—';
  const scopeLabel = examScopes.find((s) => s.id === examScope)?.label ?? '—';

  return (
    <>
      <div className="mt-5">
        <h4 className="assessment-pdf-import__panel-title">
          Bước {step}: {stepMeta.title}
        </h4>
        <p className="assessment-pdf-import__panel-hint">{stepMeta.hint}</p>
      </div>

      {step === 1 ? (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      ) : null}

      {step === 2 ? (
        <AssessmentPdfOcrPanel
          file={file}
          fileName={fileName}
          fileKey={fileKey}
          draftId={draftId}
          onDraftIdChange={setDraftId}
          totalPages={totalPages}
          setTotalPages={setTotalPages}
          pages={extractedPages}
          setPages={setExtractedPages}
          pdfLayout={pdfLayout}
          setPdfLayout={setPdfLayout}
          importContentMode={importContentMode}
          setImportContentMode={setImportContentMode}
          pdfLayouts={pdfLayouts}
          importContentModes={importContentModes}
          onSelectFile={onSelectFile}
          inputRef={inputRef}
        />
      ) : null}

      {step === 3 ? (
        <div className="mt-1 space-y-3 rounded-xl border border-[#E8E6DC] bg-white p-4">
          <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
            Tóm tắt trước khi tạo đề
          </p>
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SummaryRow label="File PDF" value={file?.name ?? (fileName || '—')} />
            <SummaryRow label="Tên đề" value={examTitle.trim() || '(tự đặt sau import)'} />
            <SummaryRow label="Năm học" value={schoolYear} />
            <SummaryRow label="Loại đề" value={examType} />
            <SummaryRow label="Cấp đề" value={scopeLabel} />
            <SummaryRow label="Chương trình" value={gradeLabel} />
            <SummaryRow label="Môn học" value={subjectName} />
            <SummaryRow label="Thời gian" value={timeLimitMinutes ? `${timeLimitMinutes} phút` : '—'} />
            <SummaryRow label="Dạng PDF" value={layoutLabel} />
            <SummaryRow label="Xử lý nội dung" value={modeLabel} />
          </dl>
          <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
            Mỗi trang PDF sẽ thành một khối text trong đề nháp. Bạn tách câu/ý trong Rà soát đề.
          </p>
        </div>
      ) : null}

      {step === 1 && optionsQuery.isError && (
        <p className="mt-4 font-[Be_Vietnam_Pro] text-[13px] text-[#BE123C]">
          Không tải được năm học / loại đề. Liên hệ admin cấu hình tại Cấu trúc học thuật.
        </p>
      )}

      {step === 2 && !gradesLoading && !catalogError && schoolGrades.length === 0 && (
        <p className="mt-4 font-[Be_Vietnam_Pro] text-[13px] text-[#B45309]">
          Chưa có chương trình/lớp đang bật. Admin cần tạo hoặc kích hoạt lớp (vd. Lớp 9) tại{' '}
          <strong>Cấu trúc học thuật</strong> — mục bị vô hiệu hóa sẽ không hiện ở đây.
        </p>
      )}

      {step === 2 && catalogError && (
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

      {step === 2 && schoolGradeId && !subjectsLoading && subjects.length === 0 && (
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

      <PdfImportWizardFooter
        step={step}
        onBack={onBack}
        onNext={onNext}
        onReset={onReset}
        onImport={onImport}
        importPending={importMutation.isPending}
      />
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#FAF9F5] px-3 py-2">
      <dt className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F]">{label}</dt>
      <dd className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413]">{value}</dd>
    </div>
  );
}

function PdfImportWizardFooter({
  step,
  onBack,
  onNext,
  onReset,
  onImport,
  importPending,
}: {
  step: AssessmentPdfImportWizardStep;
  onBack: () => void;
  onNext: () => void;
  onReset: () => void;
  onImport: () => void;
  importPending: boolean;
}) {
  return (
    <div className="assessment-pdf-import__wizard-footer">
      <button
        type="button"
        className="btn secondary text-[13px]"
        onClick={onReset}
        disabled={importPending}
      >
        Xóa toàn bộ
      </button>
      <div className="assessment-pdf-import__wizard-footer-actions">
        {step > 1 ? (
          <button
            type="button"
            className="btn secondary inline-flex items-center gap-1.5"
            onClick={onBack}
            disabled={importPending}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Quay lại
          </button>
        ) : null}
        {step < 3 ? (
          <button
            type="button"
            className="btn inline-flex items-center gap-1.5"
            onClick={onNext}
            disabled={importPending}
          >
            Tiếp theo
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            className="btn inline-flex items-center gap-2"
            disabled={importPending}
            onClick={onImport}
          >
            <FileUp className="h-4 w-4" aria-hidden />
            {importPending ? 'Đang trích text PDF…' : 'Tạo đề từ PDF'}
          </button>
        )}
      </div>
    </div>
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

      {result.assessment?.sourcePdfPath ? (
        <ImportSourcePdfPanel
          assessmentId={result.assessment.id}
          fileName={result.assessment.sourcePdfOriginalName ?? result.exam?.sourceFile}
        />
      ) : null}

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

function ImportSourcePdfPanel({
  assessmentId,
  fileName,
}: {
  assessmentId: string;
  fileName?: string;
}) {
  const pdfUrlQuery = useAssessmentImportSourcePdfUrl(assessmentId);
  const url = pdfUrlQuery.data?.result?.url;
  const displayName =
    fileName ?? pdfUrlQuery.data?.result?.fileName ?? 'PDF gốc';

  return (
    <div className="rounded-xl border border-[#E8E6DC] bg-white p-4">
      <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold uppercase tracking-wide text-[#87867F]">
        File PDF nguồn (MinIO)
      </p>
      <p className="mt-1 font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">{displayName}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn secondary inline-flex items-center gap-2 text-[13px]"
          disabled={pdfUrlQuery.isLoading || !url}
          onClick={() => url && globalThis.open(url, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {pdfUrlQuery.isLoading ? 'Đang lấy link…' : 'Mở PDF gốc'}
        </button>
      </div>
      {pdfUrlQuery.isError && (
        <p className="mt-2 font-[Be_Vietnam_Pro] text-[12px] text-[#BE123C]">
          Không tải được link PDF. Kiểm tra MinIO đang chạy.
        </p>
      )}
      {url ? (
        <PdfPreviewWithToggle
          src={url}
          collapsible
          defaultOpen={false}
          showLabel="Xem PDF đã lưu"
          hideLabel="Ẩn PDF đã lưu"
          variant="warm"
          iframeTitle="PDF nguồn đã lưu trên MinIO"
          className="mt-4"
        />
      ) : null}
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
        Nội dung theo trang (tự tách câu/ý khi rà soát)
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
