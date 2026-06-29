import { Pencil } from 'lucide-react';
import { useState } from 'react';
import type { AssessmentResponse } from '../../types';
import {
  buildPdfImportDetailRows,
  hasPdfImportMetadata,
  isPdfImportedAssessment,
} from '../../utils/assessmentPdfImportDetail';
import { AssessmentPdfImportDetailEditModal } from './AssessmentPdfImportDetailEditModal';

type Props = {
  assessment: AssessmentResponse;
  modeLabel: string;
  onEditGeneral?: () => void;
  onSaved?: () => void;
};

function DetailRowItem({
  label,
  value,
  isFirst,
}: {
  label: string;
  value: string;
  isFirst?: boolean;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3${isFirst ? ' first:pt-0' : ''}`}
    >
      <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] font-semibold m-0 shrink-0 sm:w-40">
        {label}
      </dt>
      <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#0f172a] font-semibold m-0 sm:flex-1 break-words min-h-[1.25em]">
        {value}
      </dd>
    </div>
  );
}

export function AssessmentPdfImportDetailSection({
  assessment,
  modeLabel,
  onEditGeneral,
  onSaved,
}: Props) {
  const [openDetailEdit, setOpenDetailEdit] = useState(false);
  const pdfImported = isPdfImportedAssessment(assessment);
  const canEdit = assessment.status === 'DRAFT';
  const pdfImportRows = pdfImported
    ? buildPdfImportDetailRows(assessment.pdfImportMetadata, assessment)
    : [];

  function handleEditClick() {
    if (pdfImported) {
      setOpenDetailEdit(true);
    } else {
      onEditGeneral?.();
    }
  }

  return (
    <>
      <article className="bg-white rounded-2xl border border-[#e2e8f0] p-4 lg:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-[Playfair_Display] text-[15px] font-medium text-[#0f172a] m-0">
            Thông tin chi tiết
          </h3>
          {canEdit ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
              onClick={handleEditClick}
            >
              <Pencil size={14} aria-hidden />
              Chỉnh sửa
            </button>
          ) : null}
        </div>
        <dl className="m-0 flex flex-col divide-y divide-[#e2e8f0]">
          {pdfImported ? (
            <>
              {!hasPdfImportMetadata(assessment) ? (
                <div className="py-3 first:pt-0">
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] m-0">
                    Chưa lưu metadata bước 1 — bấm «Chỉnh sửa» để điền hoặc import lại PDF.
                  </p>
                </div>
              ) : null}
              {pdfImportRows.map((item, index) => (
                <DetailRowItem
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  isFirst={index === 0 && hasPdfImportMetadata(assessment)}
                />
              ))}
              <DetailRowItem label="Chế độ tạo đề" value={modeLabel} />
              <DetailRowItem label="Ma trận đề" value="Không có" />
              {(assessment.lessonTitles?.length ?? 0) > 0 ? (
                <DetailRowItem label="Bài học" value={assessment.lessonTitles!.join(', ')} />
              ) : null}
            </>
          ) : (
            <>
              <DetailRowItem
                label="Bài học"
                value={assessment.lessonTitles?.join(', ') || 'Không có'}
                isFirst
              />
              <DetailRowItem
                label="Thời gian làm bài"
                value={
                  assessment.timeLimitMinutes != null
                    ? `${assessment.timeLimitMinutes} phút`
                    : 'Không giới hạn'
                }
              />
              <DetailRowItem label="Chế độ tạo đề" value={modeLabel} />
              <DetailRowItem
                label="Ma trận đề"
                value={assessment.examMatrixName ?? assessment.examMatrixId ?? 'Không có'}
              />
            </>
          )}
        </dl>
      </article>

      {pdfImported ? (
        <AssessmentPdfImportDetailEditModal
          assessment={assessment}
          isOpen={openDetailEdit}
          onClose={() => setOpenDetailEdit(false)}
          onSaved={onSaved}
        />
      ) : null}
    </>
  );
}
