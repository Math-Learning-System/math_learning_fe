import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MARKETING_NAV_LINKS,
  type MarketingNavKey,
  isMarketingPath,
} from '../../constants/marketingRoutes';
import { AuthService } from '../../services/api/auth.service';
import './MarketingNavLinks.css';

interface MarketingNavLinksProps {
  variant: 'homepage' | 'dashboard';
  className?: string;
  activeNav?: MarketingNavKey | null;
}

const MarketingNavLinks: React.FC<MarketingNavLinksProps> = ({
  variant,
  className,
  activeNav,
}) => {
  const location = useLocation();
  const isAuthenticated = AuthService.isAuthenticated();
  const onMarketing = isMarketingPath(location.pathname);

  const logoTo = isAuthenticated
    ? onMarketing
      ? AuthService.getDashboardUrl()
      : '/'
    : '/';

  const logoAriaLabel = isAuthenticated
    ? onMarketing
      ? 'Quay về bảng điều khiển'
      : 'Xem trang chủ MathMaster'
    : 'Trang chủ MathMaster';

  const isLinkActive = (key: MarketingNavKey, to: string) => {
    if (activeNav) return activeNav === key;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const rootClass = [
    'marketing-nav',
    `marketing-nav--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <Link to={logoTo} className="marketing-nav-logo" aria-label={logoAriaLabel}>
        <span className="marketing-nav-logo-icon">∑π</span>
        <span className="marketing-nav-logo-text">MathMaster</span>
      </Link>
      <div className="marketing-nav-menu" role="navigation" aria-label="Trang giới thiệu">
        {MARKETING_NAV_LINKS.map(({ key, to, label }) => (
          <Link
            key={key}
            to={to}
            className={`marketing-nav-link${isLinkActive(key, to) ? ' is-active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MarketingNavLinks;

