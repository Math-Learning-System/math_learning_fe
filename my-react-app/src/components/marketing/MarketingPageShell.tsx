import React from 'react';
import type { MarketingNavKey } from '../../constants/marketingRoutes';
import { AuthService } from '../../services/api/auth.service';
import { mockAdmin, mockStudent, mockTeacher } from '../../data/mockData';
import DashboardLayout from '../layout/DashboardLayout/DashboardLayout';
import Footer from '../Footer';
import MarketingHeader from './MarketingHeader';

interface MarketingPageShellProps {
  children: React.ReactNode;
  activeNav?: MarketingNavKey | null;
  showFooter?: boolean;
}

const resolveLayoutRole = (): 'teacher' | 'student' | 'admin' => {
  const role = AuthService.getUserRole();
  if (role === 'teacher') return 'teacher';
  if (role === 'admin') return 'admin';
  return 'student';
};

const MarketingPageShell: React.FC<MarketingPageShellProps> = ({
  children,
  activeNav = null,
  showFooter = true,
}) => {
  const isAuthenticated = AuthService.isAuthenticated();

  if (isAuthenticated) {
    const layoutRole = resolveLayoutRole();
    const currentUser =
      layoutRole === 'teacher'
        ? mockTeacher
        : layoutRole === 'admin'
          ? mockAdmin
          : mockStudent;

    return (
      <DashboardLayout
        role={layoutRole}
        user={{
          name: currentUser.name,
          avatar: currentUser.avatar ?? '',
          role: layoutRole,
        }}
        contentClassName="dashboard-content--flush-bleed"
      >
        <div className="homepage homepage--embedded">{children}</div>
        {showFooter ? <Footer /> : null}
      </DashboardLayout>
    );
  }

  return (
    <div className="homepage">
      <MarketingHeader activeNav={activeNav} />
      {children}
      {showFooter ? <Footer /> : null}
    </div>
  );
};

export default MarketingPageShell;
