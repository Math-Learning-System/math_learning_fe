import { X } from 'lucide-react';

type Props = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
};

export default function ModalCloseButton({ onClick, ariaLabel = 'Đóng' }: Readonly<Props>) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="w-8 h-8 p-0 rounded-lg bg-[#e2e8f0] flex items-center justify-center text-[#475569] hover:bg-[#cbd5e1] transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
