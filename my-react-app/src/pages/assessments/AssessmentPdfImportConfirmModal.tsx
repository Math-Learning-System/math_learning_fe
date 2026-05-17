import { FileText, Sigma, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import ModalCloseButton from '../../components/common/ModalCloseButton';
import type { CodeLabelOption } from '../../types';

type Props = {
  isOpen: boolean;
  pdfLayouts: CodeLabelOption[];
  importContentModes: CodeLabelOption[];
  pdfLayout: string;
  importContentMode: string;
  onPdfLayoutChange: (id: string) => void;
  onImportContentModeChange: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirming?: boolean;
};

export function AssessmentPdfImportConfirmModal({
  isOpen,
  pdfLayouts,
  importContentModes,
  pdfLayout,
  importContentMode,
  onPdfLayoutChange,
  onImportContentModeChange,
  onClose,
  onConfirm,
  confirming = false,
}: Props) {
  if (!isOpen) return null;

  const selectedMode = importContentModes.find((m) => m.id === importContentMode);
  const modeEnabled = selectedMode?.enabled !== false;

  return (
    <Overlay onClose={onClose}>
      <div
        className="relative z-[60] w-full max-w-lg rounded-2xl border border-[#E8E6DC] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-import-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader onClose={onClose} />

        <div className="space-y-5 px-5 py-4">
          <OptionGroup
            title="Dạng file PDF"
            hint="Chọn đúng cấu trúc đề trong file để AI trích xuất chính xác hơn."
            options={pdfLayouts}
            value={pdfLayout}
            onChange={onPdfLayoutChange}
            icon={FileText}
          />

          <OptionGroup
            title="Cách xử lý nội dung"
            hint="Hiện tại hệ thống hỗ trợ import trực tiếp từ PDF."
            options={importContentModes}
            value={importContentMode}
            onChange={onImportContentModeChange}
            icon={Sigma}
            disabledOption={(o) => o.enabled === false}
          />

          {importContentMode === 'latex' && !modeEnabled && (
            <p className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 font-[Be_Vietnam_Pro] text-[12px] text-[#92400E]">
              Chế độ LaTeX đang phát triển. Vui lòng chọn &quot;Giữ nội dung PDF&quot; để tiếp tục.
            </p>
          )}
        </div>

        <Footer
          onClose={onClose}
          onConfirm={onConfirm}
          confirming={confirming}
          confirmDisabled={!pdfLayout || !importContentMode || !modeEnabled}
        />
      </div>
    </Overlay>
  );
}

function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#E8E6DC] px-5 py-4">
      <div>
        <h4
          id="pdf-import-confirm-title"
          className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]"
        >
          Xác nhận trước khi tạo đề
        </h4>
        <p className="mt-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
          Chọn dạng PDF và cách xử lý nội dung. Danh mục do admin cấu hình.
        </p>
      </div>
      <ModalCloseButton onClick={onClose} />
    </div>
  );
}

function OptionGroup({
  title,
  hint,
  options,
  value,
  onChange,
  icon: Icon,
  disabledOption,
}: {
  title: string;
  hint: string;
  options: CodeLabelOption[];
  value: string;
  onChange: (id: string) => void;
  icon: LucideIcon;
  disabledOption?: (o: CodeLabelOption) => boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#87867F]" aria-hidden />
        <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">{title}</p>
      </div>
      <p className="mt-0.5 font-[Be_Vietnam_Pro] text-[11px] text-[#87867F]">{hint}</p>
      <div className="mt-2 space-y-2">
        {options.map((opt) => {
          const disabled = disabledOption?.(opt) ?? false;
          const selected = value === opt.id;
          return (
            <label
              key={opt.id}
              className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                disabled
                  ? 'cursor-not-allowed border-[#F0EEE6] bg-[#FAF9F5] opacity-60'
                  : selected
                    ? 'border-[#C96442] bg-[#FFFBF8]'
                    : 'border-[#E8E6DC] bg-white hover:border-[#D1CFC5]'
              }`}
            >
              <input
                type="radio"
                name={title}
                className="mt-1"
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(opt.id)}
              />
              <span>
                <span className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413]">
                  {opt.label}
                  {disabled ? (
                    <span className="ml-2 rounded-full bg-[#E8E6DC] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#5E5D59]">
                      Sắp có
                    </span>
                  ) : null}
                </span>
                {opt.description ? (
                  <span className="mt-0.5 block font-[Be_Vietnam_Pro] text-[11px] text-[#87867F]">
                    {opt.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function Overlay({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      {children}
    </div>
  );
}

function Footer({
  onClose,
  onConfirm,
  confirming,
  confirmDisabled,
}: {
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
  confirmDisabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E8E6DC] px-5 py-4">
      <button type="button" className="btn secondary" onClick={onClose} disabled={confirming}>
        Hủy
      </button>
      <button
        type="button"
        className="btn"
        disabled={confirming || confirmDisabled}
        onClick={onConfirm}
      >
        {confirming ? 'Đang phân tích PDF…' : 'Bắt đầu tạo đề'}
      </button>
    </div>
  );
}
