import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Coins,
  Edit3,
  History,
  Layout,
  MessageSquare,
  Save,
  ShieldAlert,
  Sparkles,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { mockAdmin } from '../../data/mockData';
import { tokenConfigService } from '../../services/tokenConfig.service';

const featureMeta: Record<string, { icon: React.ReactNode; label: string; description: string }> = {
  slide: {
    icon: <Layout className="w-4 h-4" />,
    label: 'Gen Slide',
    description: 'Tạo bài giảng Slide tự động từ nội dung bài học bằng AI.',
  },
  mindmap: {
    icon: <Zap className="w-4 h-4" />,
    label: 'Gen Mindmap',
    description: 'Tạo bản đồ tư duy trực quan từ từ khóa hoặc đoạn văn bản.',
  },
  chat: {
    icon: <MessageSquare className="w-4 h-4" />,
    label: 'AI Chat',
    description: 'Trò chuyện và giải đáp thắc mắc trực tiếp với trợ lý ảo.',
  },
  'question-blueprint': {
    icon: <Wand2 className="w-4 h-4" />,
    label: 'Tạo mẫu từ câu hỏi',
    description:
      'Giáo viên dán một câu hỏi , AI gợi ý mẫu gồm biến số, ràng buộc và công thức đáp án',
  },
  'question-generate': {
    icon: <Sparkles className="w-4 h-4" />,
    label: 'Sinh câu hỏi từ mẫu',
    description: 'AI sinh nhiều câu hỏi mới từ một mẫu sẵn có.',
  },
};

const TokenConfigPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [showHistory, setShowHistory] = useState(false);
  const initialOrderRef = useRef<string[]>([]);

  const {
    data: configs,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'token-config'],
    queryFn: () => tokenConfigService.getAllConfigs(),
  });

  const { data: historyLogs, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['admin', 'token-config-history'],
    queryFn: () => tokenConfigService.getHistory(),
    enabled: showHistory,
  });

  // Ghim thứ tự card theo lần load đầu tiên, tránh nhảy vị trí sau mỗi mutation
  const stableConfigs = useMemo(() => {
    if (!configs) return [];
    if (initialOrderRef.current.length === 0) {
      initialOrderRef.current = configs.map((c) => c.id);
    }
    return [...configs].sort((a, b) => {
      const ai = initialOrderRef.current.indexOf(a.id);
      const bi = initialOrderRef.current.indexOf(b.id);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [configs]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      costPerUse,
      isActive,
    }: {
      id: string;
      costPerUse?: number;
      isActive?: boolean;
    }) => tokenConfigService.updateConfig(id, { costPerUse, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'token-config'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'token-config-history'] });
      showToast({ type: 'success', message: 'Cập nhật hệ thống thành công!' });
      setEditingId(null);
    },
    onError: (err: any) => {
      showToast({ type: 'error', message: `Lỗi: ${err.message || 'Không thể cập nhật'}` });
    },
  });

  const handleSaveCost = (id: string) => {
    const cost = editValues[id];
    if (cost === undefined) {
      setEditingId(null);
      return;
    }
    if (cost < 0 || cost > 1000) {
      showToast({ type: 'error', message: 'Hạn mức token không hợp lệ (0-1000)' });
      return;
    }
    updateMutation.mutate({ id, costPerUse: cost });
  };

  if (isLoading) {
    return (
      <DashboardLayout
        role="admin"
        user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      >
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-10 h-10 border-4 border-[#e2e8f0] border-t-[#475569] rounded-full animate-spin" />
          <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#64748b]">Đang tải cấu hình...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !configs) {
    return (
      <DashboardLayout
        role="admin"
        user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      >
        <div className="flex flex-col items-center justify-center py-32 space-y-3">
          <div className="w-12 h-12 bg-red-50 text-red-400 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <p className="font-[Be_Vietnam_Pro] text-[14px] text-red-500 text-center">
            Không thể kết nối với máy chủ.
            <br />
            <span className="text-[13px] font-normal opacity-70">
              Vui lòng kiểm tra lại kết nối Database.
            </span>
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e2e8f0] flex items-center justify-center text-[#475569]">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#0f172a]">
                  Cấu hình Chi phí Token
                </h1>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b] mt-0.5">
                  Điều chỉnh số token tiêu tốn cho mỗi tính năng AI
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#e2e8f0] bg-white text-[#475569] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#f8fafc] transition-colors flex-shrink-0"
            >
              <History className="w-3.5 h-3.5" />
              Lịch sử thay đổi
            </button>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {stableConfigs.map((config) => {
              const meta = featureMeta[config.featureKey] || {
                icon: <Coins className="w-4 h-4" />,
                label: config.featureKey,
                description: 'Tính năng hệ thống.',
              };
              const isEditing = editingId === config.id;

              return (
                <div
                  key={config.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 ${
                    isEditing
                      ? 'border-[#0ea5e9] shadow-sm'
                      : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                  }`}
                >
                  <div className="p-5 space-y-5">
                    {/* Top row: icon + label + toggle */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#e2e8f0] flex items-center justify-center text-[#475569] flex-shrink-0">
                          {meta.icon}
                        </div>
                        <div>
                          <h3 className="font-[Be_Vietnam_Pro] text-[15px] font-semibold text-[#0f172a]">
                            {config.featureLabel}
                          </h3>
                          <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] mt-0.5 leading-relaxed line-clamp-2">
                            {meta.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex rounded-md border border-[#e2e8f0] overflow-hidden flex-shrink-0 disabled:opacity-50">
                        <button
                          onClick={() =>
                            !config.isActive &&
                            updateMutation.mutate({ id: config.id, isActive: true })
                          }
                          disabled={updateMutation.isPending}
                          className={`px-2.5 py-1 font-[Be_Vietnam_Pro] text-[11px] font-bold tracking-widest transition-colors ${
                            config.isActive
                              ? 'bg-[#0f172a] text-white'
                              : 'bg-white text-[#C4C3BB] hover:bg-[#f8fafc]'
                          }`}
                        >
                          ON
                        </button>
                        <button
                          onClick={() =>
                            config.isActive &&
                            updateMutation.mutate({ id: config.id, isActive: false })
                          }
                          disabled={updateMutation.isPending}
                          className={`px-2.5 py-1 font-[Be_Vietnam_Pro] text-[11px] font-bold tracking-widest transition-colors ${
                            !config.isActive
                              ? 'bg-[#0f172a] text-white'
                              : 'bg-white text-[#C4C3BB] hover:bg-[#f8fafc]'
                          }`}
                        >
                          OFF
                        </button>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          config.isActive ? 'bg-green-500' : 'bg-[#C4C3BB]'
                        }`}
                      />
                      <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b]">
                        {config.isActive ? 'Đang trừ token' : 'Miễn phí tạm thời'}
                      </span>
                    </div>

                    {/* Cost area */}
                    <div
                      className={`rounded-xl p-4 transition-colors ${
                        isEditing ? 'bg-amber-50 border border-amber-100' : 'bg-[#f8fafc]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#64748b] uppercase tracking-wide">
                          Chi phí mỗi lần dùng
                        </span>
                        {!isEditing && (
                          <button
                            onClick={() => {
                              setEditingId(config.id);
                              setEditValues((prev) => ({
                                ...prev,
                                [config.id]: config.costPerUse,
                              }));
                            }}
                            className="p-1 rounded-md text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              autoFocus
                              value={editValues[config.id] ?? config.costPerUse}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  [config.id]: parseInt(e.target.value) || 0,
                                }))
                              }
                              className="w-full bg-white border border-[#e2e8f0] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[20px] font-bold text-[#0f172a] outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-[Be_Vietnam_Pro] text-[12px] text-[#64748b]">
                              tokens
                            </span>
                          </div>
                          <button
                            onClick={() => handleSaveCost(config.id)}
                            disabled={updateMutation.isPending}
                            className="p-2 bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="font-[Be_Vietnam_Pro] text-[28px] font-bold text-[#0f172a]">
                            {config.costPerUse}
                          </span>
                          <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
                            tokens / lượt
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div className="flex items-center justify-between text-[11px] text-[#A8A7A0]">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Cập nhật: {new Date(config.updatedAt).toLocaleDateString('vi-VN')}
                      </div>
                      <span className="font-mono text-[10px]">{config.featureKey}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom note */}
          <div className="bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#e2e8f0] flex items-center justify-center text-[#475569] flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0f172a] mb-1">
                  Lưu ý bảo mật
                </p>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#475569] leading-relaxed">
                  Mọi thay đổi về chi phí được ghi lại trong nhật ký hệ thống kèm định danh admin.
                  Vui lòng thông báo đến bộ phận CSKH trước khi có sự thay đổi lớn để tránh gây hiểu
                  lầm cho người dùng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-[#0f172a]/50 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#e2e8f0] text-[#475569] rounded-xl flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="font-[Playfair_Display] text-[18px] font-medium text-[#0f172a]">
                  Nhật ký thay đổi
                </h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1.5 hover:bg-[#e2e8f0] rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-[#64748b]" />
              </button>
            </div>

            {/* Modal body */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {isHistoryLoading ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <div className="w-8 h-8 border-4 border-[#e2e8f0] border-t-[#475569] rounded-full animate-spin" />
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
                    Đang tải dữ liệu...
                  </p>
                </div>
              ) : historyLogs && historyLogs.length > 0 ? (
                <div className="space-y-3">
                  {historyLogs.map((log, _idx) => {
                    const meta = featureMeta[log.featureKey];
                    const isStatusChange =
                      log.changeType === 'STATUS_TOGGLE' || log.changeType === 'STATUS_UPDATE';

                    const formatValue = (val: string) => {
                      if (val === 'true')
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0f172a]">
                              Hoạt động
                            </span>
                          </div>
                        );
                      if (val === 'false')
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C4C3BB]" />
                            <span className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#64748b]">
                              Tạm ngắt
                            </span>
                          </div>
                        );
                      return (
                        <span className="font-[Be_Vietnam_Pro] text-[15px] font-bold text-[#0f172a]">
                          {val}{' '}
                          <span className="text-[11px] font-normal text-[#64748b]">tokens</span>
                        </span>
                      );
                    };

                    return (
                      <div
                        key={log.id}
                        className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0f172a]">
                              {meta?.label || log.featureKey}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-[Be_Vietnam_Pro] text-[10px] font-semibold uppercase tracking-wide border ${
                                isStatusChange
                                  ? 'bg-white border-[#e2e8f0] text-[#475569]'
                                  : 'bg-white border-[#e2e8f0] text-[#475569]'
                              }`}
                            >
                              {isStatusChange ? 'Trạng thái' : 'Chi phí'}
                            </span>
                          </div>
                          <time className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b]">
                            {new Date(log.createdAt).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </time>
                        </div>

                        <div className="flex items-center gap-4 bg-white border border-[#e2e8f0] rounded-lg px-4 py-3">
                          <div className="flex flex-col items-center gap-1 flex-1">
                            <span className="font-[Be_Vietnam_Pro] text-[10px] uppercase font-semibold text-[#A8A7A0] tracking-wide">
                              Trước
                            </span>
                            {formatValue(log.oldValue)}
                          </div>
                          <span className="text-[#cbd5e1] text-lg">→</span>
                          <div className="flex flex-col items-center gap-1 flex-1">
                            <span className="font-[Be_Vietnam_Pro] text-[10px] uppercase font-semibold text-[#A8A7A0] tracking-wide">
                              Sau
                            </span>
                            {formatValue(log.newValue)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                          <div className="w-5 h-5 rounded-full bg-[#e2e8f0] flex items-center justify-center font-[Be_Vietnam_Pro] text-[10px] font-bold text-[#475569]">
                            {log.adminName ? log.adminName.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <span className="font-[Be_Vietnam_Pro]">
                            {log.adminName || 'Quản trị viên'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 space-y-2">
                  <History className="w-10 h-10 text-[#e2e8f0] mx-auto" />
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
                    Chưa có lịch sử thay đổi nào.
                  </p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex justify-end">
              <button
                onClick={() => setShowHistory(false)}
                className="px-5 py-2.5 bg-[#0f172a] text-white rounded-xl font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#1e293b] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TokenConfigPage;
