import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, Eye, FileText, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { API_BASE_URL } from '../../config/api.config';
import { mockStudent } from '../../data/mockData';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import type { LessonSlideGeneratedFile, PageResult } from '../../types/lessonSlide.types';

const DEFAULT_PAGE_SIZE = 9;
type SortDirection = 'ASC' | 'DESC';

const getQueryNumber = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

const getQueryDirection = (value: string | null): SortDirection =>
  value === 'ASC' ? 'ASC' : 'DESC';

const getQuerySortBy = (value: string | null): string =>
  value === 'updatedAt' ? 'updatedAt' : 'createdAt';

const getGeneratedDisplayName = (slide: LessonSlideGeneratedFile): string => {
  const preferredName = slide.name?.trim();
  if (preferredName) return preferredName;
  const fallbackName = (slide.fileName || '').trim();
  return fallbackName.replace(/\.[^/.]+$/, '') || 'generated-slide';
};

const resolveThumbnailUrl = (thumbnail?: string | null): string | null => {
  if (!thumbnail) return null;
  if (/^https?:\/\//i.test(thumbnail)) return thumbnail;
  if (thumbnail.startsWith('/api/')) return thumbnail;
  const normalizedThumbnail = thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`;
  return `${API_BASE_URL}${normalizedThumbnail}`;
};

const emptySlidePage = (): PageResult<LessonSlideGeneratedFile> => ({
  content: [],
  number: 0,
  size: DEFAULT_PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
});

export default function StudentPublicSlides() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [slideKeyword, setSlideKeyword] = useState(() => searchParams.get('slideQ') || '');
  const [slideKeywordDebounced, setSlideKeywordDebounced] = useState(() =>
    (searchParams.get('slideQ') || '').trim()
  );
  const [slidePage, setSlidePage] = useState(() =>
    getQueryNumber(searchParams.get('slidePage'), 0)
  );
  const [slideSize, setSlideSize] = useState(() =>
    getQueryNumber(searchParams.get('slideSize'), DEFAULT_PAGE_SIZE)
  );
  const [slideSortBy, setSlideSortBy] = useState(() =>
    getQuerySortBy(searchParams.get('slideSortBy'))
  );
  const [slideDirection, setSlideDirection] = useState<SortDirection>(() =>
    getQueryDirection(searchParams.get('slideDir'))
  );
  const [slidesResult, setSlidesResult] =
    useState<PageResult<LessonSlideGeneratedFile>>(emptySlidePage());
  const [downloadingSlideId, setDownloadingSlideId] = useState('');
  const [previewSlideId, setPreviewSlideId] = useState('');
  const [previewSlidePdfUrl, setPreviewSlidePdfUrl] = useState('');
  const [loadingPreviewSlideId, setLoadingPreviewSlideId] = useState('');
  const [previewIframeLoaded, setPreviewIframeLoaded] = useState(false);
  const previewPdfObjectUrlRef = useRef<string | null>(null);
  const [slidesError, setSlidesError] = useState('');

  const slidesQuery = useQuery({
    queryKey: [
      'public-slides',
      {
        keyword: slideKeywordDebounced,
        page: slidePage,
        size: slideSize,
        sortBy: slideSortBy,
        direction: slideDirection,
      },
    ],
    queryFn: () =>
      LessonSlideService.getAllPublicGeneratedFiles({
        keyword: slideKeywordDebounced || undefined,
        page: slidePage,
        size: slideSize,
        sortBy: slideSortBy,
        direction: slideDirection,
      }),
    staleTime: 30_000,
  });

  const loadingSlides = slidesQuery.isLoading || slidesQuery.isFetching;

  const formatFileSize = (sizeInBytes: number): string => {
    if (!Number.isFinite(sizeInBytes) || sizeInBytes < 0) return '--';
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const blobUrl = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'generated-slide.pptx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(blobUrl);
  };

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setSlideKeywordDebounced(slideKeyword.trim()), 400);
    return () => globalThis.clearTimeout(timer);
  }, [slideKeyword]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (slideKeyword) params.set('slideQ', slideKeyword);
    if (slidePage > 0) params.set('slidePage', String(slidePage));
    if (slideSize !== DEFAULT_PAGE_SIZE) params.set('slideSize', String(slideSize));
    if (slideSortBy !== 'createdAt') params.set('slideSortBy', slideSortBy);
    if (slideDirection !== 'DESC') params.set('slideDir', slideDirection);
    setSearchParams(params, { replace: true });
  }, [slideKeyword, slidePage, slideSize, slideSortBy, slideDirection, setSearchParams]);

  useEffect(() => {
    if (slidesQuery.data?.result) {
      const normalizedContent = (slidesQuery.data.result.content || []).filter(
        (slide) => slide.isPublic
      );
      setSlidesResult({
        ...slidesQuery.data.result,
        content: normalizedContent,
        totalElements: Math.max(
          slidesQuery.data.result.totalElements ?? 0,
          normalizedContent.length
        ),
      });
    }
  }, [slidesQuery.data]);

  useEffect(() => {
    if (slidesQuery.error instanceof Error) {
      setSlidesError(slidesQuery.error.message);
      return;
    }
    if (!loadingSlides) {
      setSlidesError('');
    }
  }, [slidesQuery.error, loadingSlides]);

  const handleDownloadSlide = async (generatedFileId: string) => {
    setDownloadingSlideId(generatedFileId);
    setSlidesError('');

    try {
      const response = await LessonSlideService.downloadPublicGeneratedFile(generatedFileId);
      triggerBlobDownload(response.blob, response.filename || 'generated-slide.pptx');
    } catch (err) {
      setSlidesError(err instanceof Error ? err.message : 'Không thể tải slide công khai');
    } finally {
      setDownloadingSlideId('');
    }
  };

  const handlePreviewSlide = async (generatedFileId: string) => {
    setPreviewSlideId(generatedFileId);
    setPreviewSlidePdfUrl('');
    setPreviewIframeLoaded(false);
    setLoadingPreviewSlideId(generatedFileId);
    setSlidesError('');

    try {
      const response = await LessonSlideService.getPublicGeneratedFilePreviewPdf(generatedFileId);
      const blobUrl = globalThis.URL.createObjectURL(response.blob);

      if (previewPdfObjectUrlRef.current) {
        globalThis.URL.revokeObjectURL(previewPdfObjectUrlRef.current);
      }
      previewPdfObjectUrlRef.current = blobUrl;
      setPreviewSlidePdfUrl(blobUrl);
    } catch (err) {
      setSlidesError(err instanceof Error ? err.message : 'Không thể xem thử slide');
      setPreviewSlideId('');
    } finally {
      setLoadingPreviewSlideId('');
    }
  };

  const closePreview = () => {
    setPreviewSlideId('');
    setPreviewSlidePdfUrl('');
    setPreviewIframeLoaded(false);
    if (previewPdfObjectUrlRef.current) {
      globalThis.URL.revokeObjectURL(previewPdfObjectUrlRef.current);
      previewPdfObjectUrlRef.current = null;
    }
  };

  return (
    <DashboardLayout
      user={mockStudent}
      role="student"
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* ── Page header ── */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e2e8f0] flex items-center justify-center text-[#475569]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#0f172a]">
                  Thư viện Slides
                </h1>
                {!loadingSlides && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#e2e8f0] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#475569]">
                    {slidesResult.totalElements}
                  </span>
                )}
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b] mt-0.5">
                Tìm kiếm và tải slide bài giảng công khai
              </p>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="flex-1 w-full flex items-center gap-3 bg-[#ffffff] border border-[#e2e8f0] rounded-xl shadow-[0px_0px_0px_1px_#e2e8f0] px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150">
              <Search className="text-[#64748b] w-4 h-4 flex-shrink-0" />
              <input
                className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#0f172a] placeholder:text-[#64748b] bg-transparent outline-none"
                placeholder="Tìm theo tên file slide..."
                value={slideKeyword}
                onChange={(e) => {
                  setSlideKeyword(e.target.value);
                  setSlidePage(0);
                }}
              />
              {slideKeyword && (
                <button
                  type="button"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => {
                    setSlideKeyword('');
                    setSlidePage(0);
                  }}
                  className="text-[#64748b] hover:text-[#0f172a] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>

            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#475569] outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] bg-white transition-colors"
                value={slideSortBy}
                onChange={(e) => {
                  setSlideSortBy(e.target.value);
                  setSlidePage(0);
                }}
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="updatedAt">Cập nhật</option>
              </select>
              <select
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#475569] outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] bg-white transition-colors"
                value={slideDirection}
                onChange={(e) => {
                  setSlideDirection(e.target.value as SortDirection);
                  setSlidePage(0);
                }}
              >
                <option value="DESC">Mới nhất</option>
                <option value="ASC">Cũ nhất</option>
              </select>
              <select
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#475569] outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] bg-white transition-colors"
                value={slideSize}
                onChange={(e) => {
                  setSlideSize(Number(e.target.value));
                  setSlidePage(0);
                }}
              >
                <option value={6}>6 / trang</option>
                <option value={9}>9 / trang</option>
                <option value={12}>12 / trang</option>
              </select>
            </div>
          </div>

          {/* ── Loading skeleton ── */}
          {loadingSlides && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] h-52 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {slidesError && !loadingSlides && (
            <div className="flex items-center justify-center py-12">
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333]">{slidesError}</p>
            </div>
          )}

          {/* ── Empty ── */}
          {!loadingSlides && !slidesError && slidesResult.content.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#e2e8f0] flex items-center justify-center text-[#94a3b8]">
                <FileText className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#64748b]">
                Không có slide công khai phù hợp với từ khóa hiện tại.
              </p>
            </div>
          )}

          {/* ── Grid ── */}
          {!loadingSlides && slidesResult.content.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slidesResult.content.map((slide) => (
                  <article
                    key={slide.id}
                    className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden group hover:shadow-[0px_0px_0px_1px_#cbd5e1,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="h-[140px] bg-gradient-to-br from-[#e2e8f0] to-[#cbd5e1] relative flex items-center justify-center overflow-hidden">
                      {resolveThumbnailUrl(slide.thumbnail) ? (
                        <img
                          src={resolveThumbnailUrl(slide.thumbnail) || ''}
                          alt={getGeneratedDisplayName(slide)}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-[#64748b] group-hover:scale-110 transition-transform duration-300">
                          <FileText size={42} strokeWidth={1.3} />
                        </div>
                      )}
                      <span className="absolute top-3 right-3 bg-[#ffffff]/90 rounded-lg px-2 py-1 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#0f172a]">
                        Công khai
                      </span>
                    </div>

                    <div className="p-4 flex flex-col gap-2">
                      <h3
                        className="font-[Playfair_Display] text-[17px] font-medium text-[#0f172a] line-clamp-2 leading-[1.3]"
                        title={getGeneratedDisplayName(slide)}
                      >
                        {getGeneratedDisplayName(slide)}
                      </h3>

                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#64748b]">
                          <FileText className="w-3.5 h-3.5" />
                          {formatFileSize(slide.fileSizeBytes)}
                        </span>
                        <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b]">
                          {new Date(slide.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          className="flex-1 border border-[#e2e8f0] bg-white text-[#475569] rounded-xl py-2.5 font-[Be_Vietnam_Pro] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#f8fafc] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => void handlePreviewSlide(slide.id)}
                          disabled={loadingPreviewSlideId === slide.id}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {loadingPreviewSlideId === slide.id ? 'Đang tải...' : 'Xem'}
                        </button>
                        <button
                          type="button"
                          className="flex-1 bg-[#0f172a] text-[#ffffff] rounded-xl py-2.5 font-[Be_Vietnam_Pro] text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#1e293b] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => void handleDownloadSlide(slide.id)}
                          disabled={downloadingSlideId === slide.id || !slide.isPublic}
                        >
                          <Download className="w-3.5 h-3.5" />
                          {downloadingSlideId === slide.id ? 'Đang tải...' : 'Tải xuống'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* ── Pagination ── */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#e2e8f0] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#475569] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setSlidePage((prev) => Math.max(prev - 1, 0))}
                  disabled={slidesResult.first}
                >
                  <ChevronLeft className="w-4 h-4" /> Trước
                </button>

                <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
                  Trang <strong className="text-[#0f172a]">{slidesResult.number + 1}</strong> /{' '}
                  {Math.max(slidesResult.totalPages, 1)} ·{' '}
                  <span>{slidesResult.totalElements} slide</span>
                </span>

                <button
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#e2e8f0] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#475569] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  onClick={() =>
                    setSlidePage((prev) =>
                      slidesResult.totalPages > 0
                        ? Math.min(prev + 1, slidesResult.totalPages - 1)
                        : prev
                    )
                  }
                  disabled={slidesResult.last || slidesResult.totalPages === 0}
                >
                  Sau <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Preview modal ── */}
      {previewSlideId && (
        <div
          className="fixed inset-0 z-50 bg-[#0f172a]/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="bg-[#ffffff] rounded-2xl shadow-[rgba(0,0,0,0.25)_0px_24px_64px] w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Xem thử slide"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#e2e8f0] flex items-center justify-center text-[#475569] flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-[Playfair_Display] text-[20px] font-medium text-[#0f172a] line-clamp-1 leading-[1.2]">
                    Xem thử slide
                  </h3>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] mt-0.5">
                    Bản xem trước PDF
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-colors flex-shrink-0 ml-4"
                onClick={closePreview}
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden bg-[#f8fafc] min-h-[500px]">
              {loadingPreviewSlideId === previewSlideId && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#f8fafc] z-10"
                  role="status"
                  aria-live="polite"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-[#e2e8f0] border-t-[#0ea5e9] animate-spin" />
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b] animate-pulse">
                    Đang dựng slide toán học...
                  </p>
                </div>
              )}
              {!loadingPreviewSlideId && previewSlidePdfUrl && (
                <>
                  {!previewIframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#f8fafc] z-10">
                      <div className="w-10 h-10 rounded-full border-2 border-[#e2e8f0] border-t-[#0ea5e9] animate-spin" />
                      <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b] animate-pulse">
                        Đang tải slide...
                      </p>
                    </div>
                  )}
                  <iframe
                    className={`w-full h-full min-h-[500px] border-0 transition-opacity duration-300 ${previewIframeLoaded ? 'opacity-100' : 'opacity-0'}`}
                    src={previewSlidePdfUrl}
                    title="Slide preview"
                    loading="eager"
                    onLoad={() => setPreviewIframeLoaded(true)}
                  />
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-white">
              <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#94a3b8] hidden sm:block">
                File Slide sẽ được tải về thiết bị của bạn
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-[#e2e8f0] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
                  onClick={closePreview}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D4795A] text-[#ffffff] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
                  disabled={!previewSlideId || downloadingSlideId === previewSlideId}
                  onClick={() => void handleDownloadSlide(previewSlideId)}
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingSlideId === previewSlideId ? 'Đang tải...' : 'Tải Slide'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
