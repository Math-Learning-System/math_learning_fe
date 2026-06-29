import { FileText, Sigma, type LucideIcon } from 'lucide-react';
import type { CodeLabelOption } from '../../types';

type Props = {
  pdfLayouts: CodeLabelOption[];
  importContentModes: CodeLabelOption[];
  pdfLayout: string;
  importContentMode: string;
  onPdfLayoutChange: (id: string) => void;
  onImportContentModeChange: (id: string) => void;
};

export function PdfImportExtractOptions({
  pdfLayouts,
  importContentModes,
  pdfLayout,
  importContentMode,
  onPdfLayoutChange,
  onImportContentModeChange,
}: Props) {
  const selectedMode = importContentModes.find((m) => m.id === importContentMode);
  const modeEnabled = selectedMode?.enabled !== false;

  return (
    <div className="space-y-5">
      <OptionGroup
        title="Dạng file PDF"
        hint="Chọn đề chỉ phần làm bài hay kèm đáp án (trích theo trang, không tách câu tự động)."
        options={pdfLayouts}
        value={pdfLayout}
        onChange={onPdfLayoutChange}
        icon={FileText}
      />

      <OptionGroup
        title="Cách xử lý nội dung"
        hint="Mỗi trang PDF → một khối text (Mathpix). Bạn tự tách câu/ý khi rà soát."
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
  );
}

export function isPdfImportExtractConfigValid(
  pdfLayout: string,
  importContentMode: string,
  importContentModes: CodeLabelOption[]
): boolean {
  if (!pdfLayout || !importContentMode) return false;
  const mode = importContentModes.find((m) => m.id === importContentMode);
  return mode?.enabled !== false;
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
        <Icon className="h-4 w-4 text-[#64748b]" aria-hidden />
        <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0f172a]">{title}</p>
      </div>
      <p className="mt-0.5 font-[Be_Vietnam_Pro] text-[11px] text-[#64748b]">{hint}</p>
      <div className="mt-2 space-y-2">
        {options.map((opt) => {
          const disabled = disabledOption?.(opt) ?? false;
          const selected = value === opt.id;
          return (
            <label
              key={opt.id}
              className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                disabled
                  ? 'cursor-not-allowed border-[#e2e8f0] bg-[#ffffff] opacity-60'
                  : selected
                    ? 'border-[#0ea5e9] bg-[#FFFBF8]'
                    : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
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
                <span className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#0f172a]">
                  {opt.label}
                  {disabled ? (
                    <span className="ml-2 rounded-full bg-[#e2e8f0] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#475569]">
                      Sắp có
                    </span>
                  ) : null}
                </span>
                {opt.description ? (
                  <span className="mt-0.5 block font-[Be_Vietnam_Pro] text-[11px] text-[#64748b]">
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
