import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  BookOpen,
  ChevronRight,
  Circle,
  Download,
  GraduationCap,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import {
  AdminDashboardService,
  type AdminUserInfo,
  type DashboardStats,
  type RecentUser,
  type SystemService,
} from '../../../services/api/admin-dashboard.service';
import { TeacherProfileService } from '../../../services/api/teacher-profile.service';
import { formatInBusinessTz } from '../../../utils/dateTime';

function applyApiResult<T>(
  settled: PromiseSettledResult<{ code: number; result: T }>,
  setter: (val: T) => void
): void {
  if (settled.status === 'fulfilled' && settled.value.code === 1000) {
    setter(settled.value.result);
  }
}

const AdminDashboard: React.FC = () => {
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard', 'overview'],
    queryFn: async () => {
      const [myInfo, unread, stats, users, pending, sysStatus] = await Promise.allSettled([
        AdminDashboardService.getMyInfo(),
        AdminDashboardService.getUnreadNotificationCount(),
        AdminDashboardService.getDashboardStats(),
        AdminDashboardService.getRecentUsers(0, 10),
        TeacherProfileService.countPendingProfiles(),
        AdminDashboardService.getSystemStatus(),
      ]);

      const data: {
        adminUser: AdminUserInfo | null;
        notificationCount: number;
        dashboardStats: DashboardStats | null;
        recentUsers: RecentUser[];
        pendingProfiles: number;
        systemServices: SystemService[];
        fetchError: string | null;
      } = {
        adminUser: null,
        notificationCount: 0,
        dashboardStats: null,
        recentUsers: [],
        pendingProfiles: 0,
        systemServices: [],
        fetchError: null,
      };

      applyApiResult(myInfo, (val) => {
        data.adminUser = val;
      });
      if (unread.status === 'fulfilled') data.notificationCount = unread.value;
      applyApiResult(stats, (val) => {
        data.dashboardStats = val;
      });
      if (stats.status === 'rejected') data.fetchError = 'Không thể tải thống kê tổng quan.';
      applyApiResult(users, (page) => {
        data.recentUsers = page.content ?? [];
      });
      applyApiResult(pending, (val) => {
        data.pendingProfiles = val;
      });
      applyApiResult(sysStatus, (val) => {
        data.systemServices = val.services;
      });

      return data;
    },
    staleTime: 30_000,
  });
  const loading = dashboardQuery.isLoading;
  const fetchError = dashboardQuery.data?.fetchError ?? null;
  const adminUser = dashboardQuery.data?.adminUser ?? null;
  const notificationCount = dashboardQuery.data?.notificationCount ?? 0;
  const dashboardStats = dashboardQuery.data?.dashboardStats ?? null;
  const recentUsers = dashboardQuery.data?.recentUsers ?? [];
  const pendingProfiles = dashboardQuery.data?.pendingProfiles ?? 0;
  const systemServices = dashboardQuery.data?.systemServices ?? [];

  const statsCards = dashboardStats
    ? [
        {
          Icon: Users,
          label: 'Tổng người dùng',
          value: dashboardStats.totalUsers.toLocaleString('vi-VN'),
          bg: 'bg-[#F0F9FF]',
          color: 'text-[#4F7EF7]',
        },
        {
          Icon: BookOpen,
          label: 'Enrollment hoạt động',
          value: dashboardStats.activeEnrollments.toLocaleString('vi-VN'),
          bg: 'bg-[#F0F9FF]',
          color: 'text-[#0EA5E9]',
        },
        {
          Icon: BarChart2,
          label: 'Giao dịch',
          value: dashboardStats.totalTransactions.toLocaleString('vi-VN'),
          bg: 'bg-[#F0F9FF]',
          color: 'text-[#0EA5E9]',
        },
      ]
    : [];

  const getUserStatusLabel = (status: RecentUser['status']): string => {
    if (status === 'ACTIVE') return 'Hoạt động';
    if (status === 'INACTIVE') return 'Không hoạt động';
    if (status === 'BANNED') return 'Bị cấm';
    return 'Đã xóa';
  };

  const getUserStatusClass = (status: RecentUser['status']) => {
    if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700';
    if (status === 'BANNED') return 'bg-red-50 text-red-700';
    return 'bg-[#f8fafc] text-[#64748b]';
  };

  const getServiceClass = (status: SystemService['status']) => {
    if (status === 'active') return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' };
    if (status === 'warning') return { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' };
    return { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700' };
  };

  const getServiceLabel = (status: SystemService['status']) => {
    if (status === 'active') return 'Hoạt động';
    if (status === 'warning') return 'Chậm';
    return 'Lỗi';
  };

  const renderUsersTable = () => {
    if (loading)
      return (
        <div className="flex items-center justify-center py-12 font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
          Đang tải...
        </div>
      );
    if (recentUsers.length === 0)
      return (
        <div className="flex items-center justify-center py-12 font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
          Chưa có người dùng nào.
        </div>
      );
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#ffffff]">
              <th className="text-left px-5 py-3 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Tên
              </th>
              <th className="text-left px-5 py-3 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Vai trò
              </th>
              <th className="text-left px-5 py-3 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Ngày tham gia
              </th>
              <th className="text-left px-5 py-3 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[#e2e8f0] hover:bg-[#ffffff]/80 transition-colors duration-150"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FFF7ED] text-[#0ea5e9] flex items-center justify-center font-[Playfair_Display] font-semibold text-[14px] shrink-0">
                      {(user.fullName ?? user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#0f172a]">
                        {user.fullName ?? '—'}
                      </div>
                      <div className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b]">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-[Be_Vietnam_Pro] text-[11px] font-semibold ${
                      (user.roles[0] ?? '').toUpperCase() === 'TEACHER'
                        ? 'bg-[#FFF7ED] text-[#0ea5e9]'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <Circle className="w-1.5 h-1.5 fill-current" />
                    {(user.roles[0] ?? '').toUpperCase() === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-[Be_Vietnam_Pro] text-[13px] text-[#475569]">
                  {formatInBusinessTz(user.createdDate, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-[Be_Vietnam_Pro] text-[11px] font-semibold ${getUserStatusClass(user.status)}`}
                  >
                    <Circle className="w-1.5 h-1.5 fill-current" />
                    {getUserStatusLabel(user.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSystemStatus = () => {
    if (loading)
      return (
        <div className="flex items-center justify-center py-12 font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
          Đang tải...
        </div>
      );
    if (systemServices.length === 0)
      return (
        <div className="flex items-center justify-center py-12 font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
          Không có dữ liệu trạng thái.
        </div>
      );
    return (
      <div className="divide-y divide-[#e2e8f0]">
        {systemServices.map((service) => (
          <div key={service.name} className="flex items-center gap-4 px-5 py-3.5">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${getServiceClass(service.status).dot}`}
            />
            <div className="flex-1 min-w-0">
              <div className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#0f172a]">
                {service.name}
              </div>
              <div className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b]">
                {service.description}
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full font-[Be_Vietnam_Pro] text-[11px] font-semibold ${getServiceClass(service.status).badge}`}
            >
              {getServiceLabel(service.status)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout
      role="admin"
      user={{
        name: adminUser?.fullName ?? adminUser?.email ?? 'Admin',
        avatar: adminUser?.avatar ?? '',
        role: 'admin',
      }}
      notificationCount={notificationCount}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {fetchError && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 font-[Be_Vietnam_Pro] text-[13px] font-medium text-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              {fetchError}
            </div>
          )}

          {/* Header — aligned with /teacher/mindmaps */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#e2e8f0] flex items-center justify-center text-[#475569] shrink-0">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#0f172a]">
                    Tổng quan hệ thống
                  </h1>
                  {!loading && dashboardStats && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#e2e8f0] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#475569]">
                      {dashboardStats.totalUsers.toLocaleString('vi-VN')} người dùng
                    </span>
                  )}
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b] mt-0.5">
                  Tổng quan quản trị hệ thống MathMaster
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0ea5e9] text-[#ffffff] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất báo cáo
            </button>
          </div>

          {/* Stats — same card rhythm as TeacherMindmaps */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {loading || statsCards.length === 0
              ? [0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-4 flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#e2e8f0]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-16 bg-[#e2e8f0] rounded" />
                      <div className="h-3 w-24 bg-[#e2e8f0] rounded" />
                    </div>
                  </div>
                ))
              : statsCards.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex items-center gap-3 hover:shadow-[rgba(0,0,0,0.06)_0px_4px_16px] transition-shadow duration-200"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}
                    >
                      <stat.Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-[Playfair_Display] text-[22px] font-medium text-[#0f172a] leading-none tabular-nums truncate">
                        {stat.value}
                      </p>
                      <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] mt-0.5 truncate">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
          </div>

          {/* Recent users */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0] bg-[#ffffff]">
              <h2 className="font-[Playfair_Display] text-[16px] font-medium text-[#0f172a]">
                Người dùng mới
              </h2>
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-1 font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0ea5e9] hover:text-[#0284c7] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] rounded"
              >
                Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {renderUsersTable()}
          </div>

          {/* Teacher profile review */}
          <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#0ea5e9] flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-[Playfair_Display] text-[16px] font-medium text-[#0f172a]">
                  Duyệt Profile Giáo Viên
                </h2>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b] mt-0.5">
                  Có{' '}
                  <span className="font-semibold text-[#0f172a]">{pendingProfiles}</span> giáo viên
                  đang chờ xác minh danh tính và bằng cấp.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {pendingProfiles > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-[Be_Vietnam_Pro] text-[11px] font-semibold">
                  <Circle className="w-1.5 h-1.5 fill-current" />
                  {pendingProfiles} chờ duyệt
                </span>
              )}
              <Link
                to="/admin/review-profiles"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f172a] text-[#ffffff] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#1e293b] active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2"
              >
                Duyệt ngay <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* System status */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
            <div className="px-5 py-4 border-b border-[#e2e8f0] bg-[#ffffff]">
              <h2 className="font-[Playfair_Display] text-[16px] font-medium text-[#0f172a]">
                Trạng thái hệ thống
              </h2>
            </div>
            {renderSystemStatus()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
