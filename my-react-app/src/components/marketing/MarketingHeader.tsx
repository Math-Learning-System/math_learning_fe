import React from 'react';
import { Link } from 'react-router-dom';
import type { MarketingNavKey } from '../../constants/marketingRoutes';
import { AuthService } from '../../services/api/auth.service';
import MarketingNavLinks from './MarketingNavLinks';

interface MarketingHeaderProps {
  activeNav?: MarketingNavKey | null;
}

const MarketingHeader: React.FC<MarketingHeaderProps> = ({ activeNav }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  const dashboardUrl = AuthService.getDashboardUrl();

  return (
    <header className="homepage-header">
      <div className="container">
        <nav className="navbar">
          <MarketingNavLinks variant="homepage" activeNav={activeNav} />
          <div className="navbar-actions">
            {isAuthenticated ? (
              <Link to={dashboardUrl} className="btn btn-primary-gradient">
                Vào ứng dụng
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-white">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary-gradient">
                  Đăng ký miễn phí
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default MarketingHeader;
