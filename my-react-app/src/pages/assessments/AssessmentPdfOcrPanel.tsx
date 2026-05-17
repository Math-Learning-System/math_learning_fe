import { AlertCircle, CheckCircle2, Eye, Loader2, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import MathText from '../../components/common/MathText';
import { AssessmentService } from '../../services/api/assessment.service';
import { PdfPreviewWithToggle } from '../../components/common/PdfPreviewWithToggle';
import {
  isPdfImportExtractConfigValid,
  PdfImportExtractOptions,
} from './PdfImportExtractOptions';
import { useOcrAssessmentPdfPage } from '../../hooks/useAssessment';
import type { CodeLabelOption } from '../../types';
import type { PdfImportPageOcrStatus, PdfImportPageDraft } from '../../utils/assessmentPdfImportDraft';
import { buildPdfImportFileKey } from '../../utils/assessmentPdfImportDraft';

type Props = {
  file: File | null;
  fileName: string;
  fileKey: string;
  draftId: string;
  onDraftIdChange: (id: string) => void;
  totalPages: number;
  setTotalPages: (n: number) => void;
  pages: PdfImportPageDraft[];
  setPages: React.Dispatch<React.SetStateAction<PdfImportPageDraft[]>>;
  pdfLayout: string;
  setPdfLayout: (v: string) => void;
  importContentMode: string;
  setImportContentMode: (v: string) => void;
  pdfLayouts: CodeLabelOption[];
  importContentModes: CodeLabelOption[];
  onSelectFile: (f: File | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

function mapDraftPages(
  raw: Array<{
    pageNumber: number;
    text: string;
    confidence: number;
    status: string;
    error?: string;
  }>,
  total: number
): PdfImportPageDraft[] {
  const byNum = new Map(raw.map((p) => [p.pageNumber, p]));
  return Array.from({ length: total }, (_, i) => {
    const pageNumber = i + 1;
    const row = byNum.get(pageNumber);
    if (!row) {
      return { pageNumber, text: '', confidence: 0, status: 'pending' as const };
    }
    const status = (
      ['pending', 'running', 'done', 'error'].includes(row.status)
        ? row.status
        : 'done'
    ) as PdfImportPageOcrStatus;
    return {
      pageNumber,
      text: row.text ?? '',
      confidence: row.confidence ?? 0,
      status,
      error: row.error,
    };
  });
}

export function AssessmentPdfOcrPanel({
  file,
  fileName,
  fileKey,
  draftId,
  onDraftIdChange,
  totalPages,
  setTotalPages,
  pages,
  setPages,
  pdfLayout,
  setPdfLayout,
  importContentMode,
  setImportContentMode,
  pdfLayouts,
  importContentModes,
  onSelectFile,
  inputRef,
}: Props) {
  const ocrPageMutation = useOcrAssessmentPdfPage();
  const [ocrRunning, setOcrRunning] = useState(false);
  const [countingPages, setCountingPages] = useState(false);
  const [pageCountError, setPageCountError] = useState('');
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(null);
  const lastLoadedFileKeyRef = useRef<string | null>(null);
  const pageCountInFlightRef = useRef(false);

  const extractConfigOk = isPdfImportExtractConfigValid(
    pdfLayout,
    importContentMode,
    importContentModes
  );

  const initPages = useCallback(
    (count: number) => {
      setPages(
        Array.from({ length: count }, (_, i) => ({
          pageNumber: i + 1,
          text: '',
          confidence: 0,
          status: 'pending' as const,
        }))
      );
    },
    [setPages]
  );

  const fileIdentity = file
    ? `${file.name}:${file.size}:${file.lastModified}`
    : null;

  const ocrDraftParams = useCallback(
    () => ({
      fileKey: fileKey || (file ? buildPdfImportFileKey(file) : ''),
      draftId: draftId || undefined,
    }),
    [file, fileKey, draftId]
  );

  const loadPageCount = useCallback(
    async (pdfFile: File, options?: { force?: boolean; preservePages?: boolean }) => {
      const key = buildPdfImportFileKey(pdfFile);
      if (!options?.force && lastLoadedFileKeyRef.current === key && pageCountInFlightRef.current) {
        return;
      }
      if (pageCountInFlightRef.current) return;

      pageCountInFlightRef.current = true;
      setCountingPages(true);
      setPageCountError('');
      try {
        const res = await AssessmentService.getAssessmentPdfInfo(pdfFile, ocrDraftParams());
        const total = res.result?.totalPages ?? 0;
        if (res.result?.draftId) onDraftIdChange(res.result.draftId);
        lastLoadedFileKeyRef.current = key;
        if (total < 1) {
          setPageCountError('PDF không có trang hợp lệ.');
          setTotalPages(0);
          setPages([]);
          return;
        }
        setTotalPages(total);
        if (!options?.preservePages) {
          initPages(total);
        }
      } catch (e) {
        setPageCountError(
          (e as Error).message ||
            'Không đọc được số trang. Kiểm tra Java/Python (Mathpix) và endpoint /assessments/pdf-info.'
        );
        setTotalPages(0);
        setPages([]);
      } finally {
        pageCountInFlightRef.current = false;
        setCountingPages(false);
      }
    },
    [initPages, onDraftIdChange, ocrDraftParams, setPages, setTotalPages]
  );

  const restoreFromMongo = useCallback(
    async (pdfFile: File) => {
      const key = fileKey || buildPdfImportFileKey(pdfFile);
      const applyDraft = (
        draft: NonNullable<
          Awaited<ReturnType<typeof AssessmentService.getPdfImportDraftByFileKey>>
        >['result']
      ) => {
        if (!draft?.pages?.length) return false;
        onDraftIdChange(draft.draftId);
        setTotalPages(draft.totalPages);
        setPages(mapDraftPages(draft.pages, draft.totalPages));
        lastLoadedFileKeyRef.current = key;
        return true;
      };

      if (draftId) {
        try {
          const byId = await AssessmentService.getPdfImportDraft(draftId);
          if (applyDraft(byId.result)) return true;
        } catch {
          // stale draftId — fall through to fileKey lookup
        }
      }
      try {
        const byFile = await AssessmentService.getPdfImportDraftByFileKey(key);
        if (byFile && applyDraft(byFile.result)) return true;
      } catch {
        // no draft yet
      }
      return false;
    },
    [draftId, fileKey, onDraftIdChange, setPages, setTotalPages]
  );

  useEffect(() => {
    if (!file || !fileIdentity) {
      lastLoadedFileKeyRef.current = null;
      setPageCountError('');
      return;
    }
    if (lastLoadedFileKeyRef.current === fileIdentity) return;

    const doneCount = pages.filter((p) => p.status === 'done').length;
    const expectedTotal = totalPages > 0 ? totalPages : pages.length;
    const allDoneLocally =
      expectedTotal > 0 && doneCount >= expectedTotal && pages.length >= expectedTotal;
    if (allDoneLocally) {
      lastLoadedFileKeyRef.current = fileIdentity;
      if (totalPages < 1) setTotalPages(pages.length);
      return;
    }

    void (async () => {
      const restored = await restoreFromMongo(file);
      if (!restored) {
        const hasPartial = pages.some(
          (p) => p.status === 'done' || p.status === 'running' || p.status === 'error'
        );
        await loadPageCount(file, { preservePages: hasPartial && pages.length > 0 });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileIdentity]);

  async function ocrOnePage(pageNumber: number) {
    if (!file) return;
    setPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber ? { ...p, status: 'running', error: undefined } : p
      )
    );
    try {
      const res = await ocrPageMutation.mutateAsync({
        file,
        pageNumber,
        ...ocrDraftParams(),
      });
      const row = res.result;
      if (row?.draftId) onDraftIdChange(row.draftId);
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber === pageNumber
            ? {
                ...p,
                status: row?.success ? 'done' : 'error',
                text: row?.text ?? '',
                confidence: row?.confidence ?? 0,
                error: row?.success ? undefined : 'Không trích được text',
              }
            : p
        )
      );
    } catch (e) {
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber === pageNumber
            ? {
                ...p,
                status: 'error',
                error: (e as Error).message || 'OCR thất bại',
              }
            : p
        )
      );
    }
  }

  async function runAllPages() {
    if (!file || totalPages < 1) return;
    if (!extractConfigOk) {
      setPageCountError('Chọn dạng PDF và cách xử lý nội dung trước khi OCR.');
      return;
    }
    setPageCountError('');
    setOcrRunning(true);
    const nextPages: PdfImportPageDraft[] = Array.from({ length: totalPages }, (_, i) => ({
      pageNumber: i + 1,
      text: '',
      confidence: 0,
      status: 'pending' as const,
    }));
    for (let i = 1; i <= totalPages; i++) {
      nextPages[i - 1] = { ...nextPages[i - 1], status: 'running' };
      setPages([...nextPages]);
      try {
        const res = await ocrPageMutation.mutateAsync({
          file,
          pageNumber: i,
          ...ocrDraftParams(),
        });
        const row = res.result;
        if (row?.draftId) onDraftIdChange(row.draftId);
        nextPages[i - 1] = {
          pageNumber: i,
          status: row?.success ? 'done' : 'error',
          text: row?.text ?? '',
          confidence: row?.confidence ?? 0,
          error: row?.success ? undefined : 'Không trích được text',
        };
      } catch (e) {
        nextPages[i - 1] = {
          pageNumber: i,
          status: 'error',
          text: '',
          confidence: 0,
          error: (e as Error).message || 'OCR thất bại',
        };
      }
      setPages([...nextPages]);
    }
    setOcrRunning(false);
  }

  const doneCount = pages.filter((p) => p.status === 'done').length;
  const donePages = pages.filter((p) => p.status === 'done' && p.text.trim());
  const previewPage =
    previewPageNumber != null
      ? pages.find((p) => p.pageNumber === previewPageNumber && p.status === 'done')
      : undefined;

  useEffect(() => {
    if (previewPageNumber == null) return;
    const stillValid = pages.some(
      (p) => p.pageNumber === previewPageNumber && p.status === 'done' && p.text.trim()
    );
    if (!stillValid) setPreviewPageNumber(null);
  }, [pages, previewPageNumber]);

  const isCountingPages = Boolean(file) && countingPages;
  const canStartOcr =
    Boolean(file) && totalPages > 0 && extractConfigOk && !ocrRunning && !isCountingPages;

  let startDisabledReason = '';
  if (!file) startDisabledReason = 'Chọn file PDF trước.';
  else if (isCountingPages) startDisabledReason = 'Đang đọc số trang PDF…';
  else if (totalPages < 1) startDisabledReason = pageCountError || 'Chưa đếm được số trang — thử «Đếm lại trang».';
  else if (!extractConfigOk) startDisabledReason = 'Chọn dạng PDF và cách xử lý nội dung.';

  return (
    <div className="space-y-5">
      <button
        type="button"
        className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#D1CFC5] bg-white px-6 py-8 text-center transition-colors hover:border-[#C96442]/50 hover:bg-[#FFFBF8]"
        onClick={() => inputRef.current?.click()}
        onDrop={(event) => {
          event.preventDefault();
          const next = event.dataTransfer.files?.[0];
          if (
            next &&
            (next.type === 'application/pdf' || next.name.toLowerCase().endsWith('.pdf'))
          ) {
            onSelectFile(next);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
      >
        <span className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
          {file ? file.name : fileName || 'Kéo thả hoặc chọn file PDF'}
        </span>
        <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
          Chỉ .pdf — tối đa 10MB
          {totalPages > 0 ? ` · ${totalPages} trang` : ''}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,application/pdf"
        onChange={(e) => {
          const next = e.target.files?.[0];
          if (next) onSelectFile(next);
        }}
      />

      {file ? (
        <PdfPreviewWithToggle
          file={file}
          collapsible
          defaultOpen={false}
          showLabel="Xem trước PDF"
          hideLabel="Ẩn preview"
          variant="warm"
          iframeTitle="PDF đề thi"
          subtitle="Kiểm tra file trước khi OCR từng trang"
        />
      ) : null}

      <PdfImportExtractOptions
        pdfLayouts={pdfLayouts}
        importContentModes={importContentModes}
        pdfLayout={pdfLayout}
        importContentMode={importContentMode}
        onPdfLayoutChange={setPdfLayout}
        onImportContentModeChange={setImportContentMode}
      />

      <div className="rounded-xl border border-[#E8E6DC] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
              Trích text từng trang (Mathpix PDF)
            </p>
            <p className="mt-0.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
              {file
                ? isCountingPages
                  ? 'Đang đếm số trang PDF…'
                  : totalPages > 0
                    ? `File có ${totalPages} trang · đã OCR ${doneCount}/${totalPages}${
                        draftId ? ' · đã lưu MongoDB' : ''
                      }`
                    : 'Chọn file xong cần đếm trang trước khi OCR.'
                : 'Bước này: chọn file PDF ở trên, rồi bấm nút bên phải.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {file && totalPages < 1 ? (
              <button
                type="button"
                className="btn secondary text-[13px]"
                disabled={isCountingPages || ocrRunning}
                onClick={() => {
                  if (!file) return;
                  lastLoadedFileKeyRef.current = null;
                  void loadPageCount(file, { force: true });
                }}
              >
                Đếm lại trang
              </button>
            ) : null}
            <button
              type="button"
              className="btn inline-flex items-center gap-2 text-[13px]"
              disabled={!canStartOcr}
              title={startDisabledReason}
              onClick={() => void runAllPages()}
            >
              {ocrRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang OCR…
                </>
              ) : isCountingPages ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đếm trang…
                </>
              ) : (
                'Bắt đầu trích text'
              )}
            </button>
          </div>
        </div>

        {!canStartOcr && startDisabledReason ? (
          <p className="mt-3 rounded-lg bg-[#FAF9F5] px-3 py-2 font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
            {startDisabledReason}
          </p>
        ) : null}

        {pageCountError ? (
          <p className="mt-3 font-[Be_Vietnam_Pro] text-[13px] text-[#BE123C]">{pageCountError}</p>
        ) : null}

        {totalPages > 0 ? (
          <ol className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {pages.map((p) => (
              <li
                key={p.pageNumber}
                className="flex flex-wrap items-start gap-2 rounded-lg border border-[#F0EEE6] bg-[#FAF9F5] px-3 py-2"
              >
                <span className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#141413]">
                  Trang {p.pageNumber}
                </span>
                {p.status === 'running' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                ) : p.status === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : p.status === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : null}
                <span className="min-w-0 flex-1 font-[Be_Vietnam_Pro] text-[11px] text-[#87867F]">
                  {p.status === 'done'
                    ? `${p.text.slice(0, 120)}${p.text.length > 120 ? '…' : ''}`
                    : p.error ?? (p.status === 'pending' ? 'Chờ OCR' : '')}
                </span>
                {p.status === 'done' ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-700 hover:underline"
                    onClick={() =>
                      setPreviewPageNumber((cur) =>
                        cur === p.pageNumber ? null : p.pageNumber
                      )
                    }
                  >
                    <Eye className="h-3 w-3" />
                    {previewPageNumber === p.pageNumber ? 'Ẩn preview' : 'Xem preview'}
                  </button>
                ) : null}
                {p.status === 'done' || p.status === 'error' ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] text-[#87867F] hover:underline"
                    disabled={ocrRunning}
                    onClick={() => void ocrOnePage(p.pageNumber)}
                  >
                    <RefreshCw className="h-3 w-3" />
                    OCR lại
                  </button>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}

        {doneCount > 0 ? (
          <p className="mt-3 font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
            {doneCount === totalPages && totalPages > 0
              ? 'OCR xong — bấm «Xem preview» từng trang để kiểm tra nội dung trước bước 3.'
              : 'Trang đã OCR — bấm «Xem preview» để xem full text (công thức hiển thị khi có $…$).'}
          </p>
        ) : null}

        {previewPage ? (
          <div className="mt-4 rounded-xl border border-[#E8E6DC] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                Preview OCR — Trang {previewPage.pageNumber}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F]">
                  {previewPage.text.length.toLocaleString('vi-VN')} ký tự
                  {previewPage.confidence > 0
                    ? ` · tin cậy ${Math.round(previewPage.confidence * 100)}%`
                    : ''}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-[Be_Vietnam_Pro] text-[11px] text-[#5E5D59] hover:bg-[#FAF9F5]"
                  aria-label="Đóng preview"
                  onClick={() => setPreviewPageNumber(null)}
                >
                  <X className="h-3.5 w-3.5" />
                  Đóng
                </button>
              </div>
            </div>

            {donePages.length > 1 ? (
              <div
                className="mt-3 flex flex-wrap gap-1.5"
                role="tablist"
                aria-label="Chọn trang preview"
              >
                {donePages.map((p) => (
                  <button
                    key={p.pageNumber}
                    type="button"
                    role="tab"
                    aria-selected={previewPageNumber === p.pageNumber}
                    className={`rounded-lg px-2.5 py-1 font-[Be_Vietnam_Pro] text-[11px] font-medium transition-colors ${
                      previewPageNumber === p.pageNumber
                        ? 'bg-[#C96442] text-white'
                        : 'bg-[#FAF9F5] text-[#5E5D59] hover:bg-[#F0EEE6]'
                    }`}
                    onClick={() => setPreviewPageNumber(p.pageNumber)}
                  >
                    Trang {p.pageNumber}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-3 max-h-[min(420px,50vh)] overflow-y-auto rounded-lg border border-[#F0EEE6] bg-[#FAF9F5] px-4 py-3 font-[Be_Vietnam_Pro] text-[13px] leading-relaxed text-[#141413]">
              <MathText text={previewPage.text} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
