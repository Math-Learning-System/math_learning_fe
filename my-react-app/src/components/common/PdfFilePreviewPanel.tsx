import { ExternalLink, Loader2 } from 'lucide-react';

export type PdfFilePreviewPanelProps = {
  src: string | null;
  loading?: boolean;
  errorMessage?: string | null;
  fileName?: string;
  subtitle?: string;
  iframeTitle?: string;
  /** `warm` matches assessment/admin cream UI; `slate` matches book wizard */
  variant?: 'warm' | 'slate';
  className?: string;
};

/**
 * Embedded PDF iframe — shared by book wizard and assessment PDF import.
 */
export function PdfFilePreviewPanel({
  src,
  loading = false,
  errorMessage = null,
  fileName,
  subtitle,
  iframeTitle = 'Xem trước PDF',
  variant = 'warm',
  className = '',
}: PdfFilePreviewPanelProps) {
  const isWarm = variant === 'warm';
  const shell = isWarm
    ? 'rounded-xl border border-[#E8E6DC] bg-white overflow-hidden'
    : 'rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm';
  const head = isWarm
    ? 'flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#E8E6DC] bg-[#FAF9F5]'
    : 'flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50';
  const titleCls = isWarm
    ? 'font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]'
    : 'text-sm font-medium text-slate-800';
  const subCls = isWarm
    ? 'font-[Be_Vietnam_Pro] text-[11px] text-[#87867F]'
    : 'text-xs text-slate-500';
  const linkCls = isWarm
    ? 'inline-flex shrink-0 items-center gap-1 font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#C96442] hover:text-[#A84F33]'
    : 'inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800';
  const bodyBg = isWarm ? 'bg-[#F5F4ED]' : 'bg-slate-100';

  return (
    <div className={`${shell} ${className}`}>
      <div className={head}>
        <div className="min-w-0">
          <p className={titleCls}>Xem trước PDF</p>
          {subtitle ? <p className={subCls}>{subtitle}</p> : null}
          {fileName ? (
            <p className={`${subCls} truncate max-w-[min(100%,42rem)]`} title={fileName}>
              {fileName}
            </p>
          ) : null}
        </div>
        {src ? (
          <a href={src} target="_blank" rel="noopener noreferrer" className={linkCls}>
            <ExternalLink size={14} aria-hidden />
            Mở tab mới
          </a>
        ) : null}
      </div>

      <div className={`relative ${bodyBg}`}>
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center py-12">
            <Loader2
              size={28}
              className={`animate-spin ${isWarm ? 'text-[#87867F]' : 'text-slate-400'}`}
              aria-hidden
            />
            <span className="sr-only">Đang tải PDF…</span>
          </div>
        ) : null}

        {errorMessage ? (
          <p
            className={`px-4 py-6 font-[Be_Vietnam_Pro] text-[13px] ${isWarm ? 'text-[#BE123C]' : 'text-sm text-red-600'}`}
          >
            {errorMessage}
          </p>
        ) : null}

        {src && !loading ? (
          <iframe
            key={src}
            title={iframeTitle}
            src={src}
            className="h-[min(70vh,640px)] w-full border-0"
          />
        ) : null}

        {!src && !loading && !errorMessage ? (
          <p className={`px-4 py-8 text-center ${subCls}`}>Chưa có file PDF để xem trước.</p>
        ) : null}
      </div>
    </div>
  );
}
