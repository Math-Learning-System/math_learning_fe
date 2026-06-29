import { useQuery } from '@tanstack/react-query';
import { Lock, Shield, X } from 'lucide-react';
import React, { useEffect } from 'react';
import {
  SystemConfigService,
  type PrivacyPolicySection,
} from '../../services/api/systemConfig.service';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

// â”€â”€ Fallback sections shown on error / while loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FALLBACK_SECTIONS: PrivacyPolicySection[] = [
  {
    title: '1. Giới thiệu',
    paragraphs: [
      'MathMaster cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn.',
      'Bằng cách hoàn tất quy trình xác thực, bạn xác nhận đã đọc và đồng ý với các điều khoản trong Chính sách này.',
    ],
    bulletPoints: [],
  },
];

const FALLBACK_INTRO_BANNER =
  'MathMaster chỉ yêu cầu tài liệu xác thực duy nhất một lần. Thông tin của bạn được bảo vệ nghiêm ngặt và không bao giờ được chia sẻ với bên thứ ba vì mục đích thương mại.';

const PolicySection: React.FC<{ section: PrivacyPolicySection; isLast: boolean }> = ({
  section,
  isLast,
}) => (
  <section>
    <h3 className="font-[Playfair_Display] text-[17px] font-medium text-[#0f172a] leading-[1.3] mb-3">
      {section.title}
    </h3>
    <div className="font-[Be_Vietnam_Pro] text-[14px] text-[#475569] leading-[1.7]">
      {section.paragraphs.map((p, i) => (
        <p key={i} className={i > 0 ? 'mt-3' : undefined}>
          {p}
        </p>
      ))}
      {section.bulletPoints.length > 0 && (
        <ul className="mt-3 space-y-2">
          {section.bulletPoints.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#0ea5e9] flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {section.footer && <p className="mt-4 text-[13px] text-[#64748b]">{section.footer}</p>}
    </div>
    {!isLast && <div className="mt-7 border-t border-[#e2e8f0]" />}
  </section>
);

const SECTIONS_LEGACY: { title: string; content: React.ReactNode }[] = [];

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ onClose }) => {
  const { data: policy, isLoading } = useQuery({
    queryKey: ['privacy-policy'],
    queryFn: () => SystemConfigService.getPrivacyPolicy(),
    staleTime: 10 * 60 * 1000,
  });

  const sections = policy?.sections ?? (isLoading ? [] : FALLBACK_SECTIONS);
  const introBanner = policy?.introBanner ?? FALLBACK_INTRO_BANNER;
  const lastUpdated = policy?.lastUpdated ?? '';

  // Suppress unused-variable warning on legacy constant
  void SECTIONS_LEGACY;

  // Trap focus & close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#ffffff] rounded-2xl shadow-[rgba(0,0,0,0.18)_0px_20px_60px] border border-[#e2e8f0] overflow-hidden">
        {/* Sticky header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-5 border-b border-[#e2e8f0] bg-[#ffffff]">
          <div className="w-9 h-9 rounded-xl bg-[#e2e8f0] flex items-center justify-center text-[#475569] flex-shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="privacy-modal-title"
              className="font-[Playfair_Display] text-[20px] font-medium leading-[1.2] text-[#0f172a]"
            >
              Chính sách Bảo mật
            </h2>
            {lastUpdated && (
              <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] mt-0.5">
                Cập nhật lần cuối: {lastUpdated}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 flex-shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/*  Scrollable body  */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          {/* Intro banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
            <Lock className="w-4 h-4 text-[#0ea5e9] mt-0.5 flex-shrink-0" />
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#475569] leading-[1.6]">
              {introBanner}
            </p>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-2/5 rounded bg-[#e2e8f0]" />
                  <div className="h-3 w-full rounded bg-[#e2e8f0]" />
                  <div className="h-3 w-4/5 rounded bg-[#e2e8f0]" />
                </div>
              ))}
            </div>
          )}

          {/* Dynamic sections */}
          {!isLoading &&
            sections.map((section, idx) => (
              <PolicySection key={idx} section={section} isLast={idx === sections.length - 1} />
            ))}
        </div>

        {/*  Sticky footer  */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[#e2e8f0] bg-[#ffffff] flex items-center justify-between gap-3">
          <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] leading-[1.5]">
            Bằng cách đóng, bạn xác nhận đã đọc chính sách này.
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 bg-[#0f172a] text-[#ffffff] rounded-xl px-5 py-2.5 font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#1e293b] active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
