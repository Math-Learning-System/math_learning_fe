export const MARKETING_PATHS = ['/', '/features', '/about', '/pricing', '/contact'] as const;

export type MarketingNavKey = 'features' | 'about' | 'pricing' | 'contact';

export const MARKETING_NAV_LINKS: { key: MarketingNavKey; to: string; label: string }[] = [
  { key: 'features', to: '/features', label: 'Tính năng' },
  { key: 'about', to: '/about', label: 'Về chúng tôi' },
  { key: 'pricing', to: '/pricing', label: 'Giá cả' },
  { key: 'contact', to: '/contact', label: 'Liên hệ' },
];

export const isMarketingPath = (pathname: string): boolean =>
  MARKETING_PATHS.some((path) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`)
  );
