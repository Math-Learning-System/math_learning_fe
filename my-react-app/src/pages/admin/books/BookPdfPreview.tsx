import React from 'react';
import { PdfPreviewWithToggle } from '../../../components/common/PdfPreviewWithToggle';
import { useBookPdfPreviewUrl } from '../../../hooks/useBooks';

export type BookPdfPreviewProps = {
  bookId: string;
  /** Local file selected in upload step (preferred over server PDF) */
  file?: File | null;
  /** @deprecated Prefer `file` — blob URL from createObjectURL */
  localObjectUrl?: string | null;
  /** Book has `pdfPath` on server — will fetch presigned URL when no local preview */
  hasServerPdf: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

/**
 * Book wizard PDF preview (MinIO presigned URL or local file blob).
 */
const BookPdfPreview: React.FC<BookPdfPreviewProps> = ({
  bookId,
  file,
  localObjectUrl,
  hasServerPdf,
  collapsible = false,
  defaultOpen = true,
}) => {
  const hasLocal = Boolean(file || localObjectUrl);
  const fetchServer = Boolean(hasServerPdf && !hasLocal);
  const previewQuery = useBookPdfPreviewUrl(bookId, fetchServer);

  const serverSrc = previewQuery.data?.result?.url ?? null;
  const enabled = Boolean(hasLocal || hasServerPdf);

  return (
    <PdfPreviewWithToggle
      file={file}
      src={localObjectUrl ?? serverSrc}
      enabled={enabled}
      loading={fetchServer && previewQuery.isLoading}
      errorMessage={
        fetchServer && previewQuery.isError
          ? 'Không lấy được liên kết xem PDF. Kiểm tra MinIO hoặc thử "Mở tab mới" sau khi tải xong.'
          : null
      }
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      showLabel="Xem Sách"
      hideLabel="Ẩn Sách"
      variant="slate"
      iframeTitle="Xem trước sách PDF"
      subtitle={
        hasLocal
          ? 'Bản xem trước từ file vừa chọn (chưa upload)'
          : 'Kiểm tra lại sách để chuẩn bị OCR.'
      }
    />
  );
};

export default BookPdfPreview;
