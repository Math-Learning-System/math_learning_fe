import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocalPdfObjectUrl } from '../../hooks/useLocalPdfObjectUrl';
import { PdfFilePreviewPanel, type PdfFilePreviewPanelProps } from './PdfFilePreviewPanel';

export type PdfPreviewWithToggleProps = {
  /** Local PDF file — creates a blob URL for preview */
  file?: File | null;
  /** Remote or blob URL (used when no local file, or overrides after upload) */
  src?: string | null;
  enabled?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  collapsible?: boolean;
  defaultOpen?: boolean;
  showLabel?: string;
  hideLabel?: string;
  toggleClassName?: string;
  iframeTitle?: string;
  variant?: PdfFilePreviewPanelProps['variant'];
  subtitle?: string;
  className?: string;
};

/**
 * Collapsible PDF preview (toggle + iframe). Used for assessment import and book wizard.
 */
export function PdfPreviewWithToggle({
  file,
  src: srcProp,
  enabled: enabledProp,
  loading = false,
  errorMessage = null,
  collapsible = true,
  defaultOpen = false,
  showLabel = 'Xem PDF',
  hideLabel = 'Ẩn PDF',
  toggleClassName,
  iframeTitle,
  variant = 'warm',
  subtitle,
  className = '',
}: PdfPreviewWithToggleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const localUrl = useLocalPdfObjectUrl(file ?? null);
  const src = localUrl ?? srcProp ?? null;
  const enabled = enabledProp ?? Boolean(file || srcProp);

  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);

  useEffect(() => {
    if (file) setOpen(true);
  }, [file]);

  if (!enabled) return null;

  const toggleBtn =
    'inline-flex items-center gap-2 px-3 py-2 rounded-lg border font-[Be_Vietnam_Pro] text-[12px] font-medium transition-colors';
  const toggleWarm =
    `${toggleBtn} border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#ffffff]`;
  const toggleSlate =
    `${toggleBtn} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;
  const toggleCls = toggleClassName ?? (variant === 'slate' ? toggleSlate : toggleWarm);

  const panel = (
    <PdfFilePreviewPanel
      src={src}
      loading={loading}
      errorMessage={errorMessage}
      fileName={file?.name}
      subtitle={subtitle}
      iframeTitle={iframeTitle}
      variant={variant}
    />
  );

  if (!collapsible) {
    return <div className={className}>{panel}</div>;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <button type="button" className={toggleCls} onClick={() => setOpen((v) => !v)}>
        {open ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        {open ? hideLabel : showLabel}
      </button>
      {open ? panel : null}
    </div>
  );
}
