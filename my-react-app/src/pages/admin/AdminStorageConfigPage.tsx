import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  Database,
  ExternalLink,
  FolderOpen,
  HardDrive,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { mockAdmin } from '../../data/mockData';
import {
  AdminStorageService,
  type MinioObject,
} from '../../services/api/adminStorage.service';
import {
  SystemConfigService,
  type SystemConfigResponse,
} from '../../services/api/systemConfig.service';

type Tab = 'db' | 'minio';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return iso;
  }
}

const CONFIG_HINTS: Record<string, { link?: string; label?: string }> = {
  privacy_policy: { link: '/admin/system-config', label: 'Trình soạn chính sách' },
  assessment_import_options: {
    link: '/admin/academic-structure',
    label: 'Form import đề (trong Chương trình)',
  },
};

export default function AdminStorageConfigPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('db');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');

  const [bucket, setBucket] = useState('');
  const [prefix, setPrefix] = useState('');
  const [objects, setObjects] = useState<MinioObject[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [loadingObjects, setLoadingObjects] = useState(false);

  const configsQuery = useQuery({
    queryKey: ['admin', 'system-config', 'all'],
    queryFn: () => SystemConfigService.listAll(),
    enabled: tab === 'db',
  });

  const bucketsQuery = useQuery({
    queryKey: ['admin', 'storage', 'buckets'],
    queryFn: () => AdminStorageService.listBuckets(),
    enabled: tab === 'minio',
  });

  const buckets = bucketsQuery.data ?? [];
  const selectedBucketMeta = buckets.find((b) => b.name === bucket);

  const loadObjects = useCallback(
    async (append = false, token?: string | null) => {
      if (!bucket) return;
      setLoadingObjects(true);
      try {
        const res = await AdminStorageService.listObjects({
          bucket,
          prefix,
          maxKeys: 50,
          continuationToken: append && token ? token : undefined,
        });
        setObjects((prev) => (append ? [...prev, ...res.objects] : res.objects));
        setNextToken(res.nextContinuationToken);
        setTruncated(res.truncated);
      } catch (e) {
        showToast({ type: 'error', message: (e as Error).message || 'Không tải được danh sách file' });
      } finally {
        setLoadingObjects(false);
      }
    },
    [bucket, prefix, showToast]
  );

  useEffect(() => {
    if (tab === 'minio' && buckets.length > 0 && !bucket) {
      setBucket(buckets[0].name);
    }
  }, [tab, buckets, bucket]);

  useEffect(() => {
    if (tab === 'minio' && bucket) {
      void loadObjects(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when browsing folders
  }, [tab, bucket, prefix]);

  const updateConfigMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      SystemConfigService.update(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system-config'] });
      showToast({ type: 'success', message: 'Đã lưu cấu hình' });
      setEditingKey(null);
    },
    onError: (e: Error) => showToast({ type: 'error', message: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ b, key }: { b: string; key: string }) => AdminStorageService.deleteObject(b, key),
    onSuccess: () => {
      showToast({ type: 'success', message: 'Đã xóa file' });
      void loadObjects(false);
    },
    onError: (e: Error) => showToast({ type: 'error', message: e.message }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      AdminStorageService.upload({ bucket, file, prefix: prefix || undefined }),
    onSuccess: () => {
      showToast({ type: 'success', message: 'Đã tải lên' });
      void loadObjects(false);
    },
    onError: (e: Error) => showToast({ type: 'error', message: e.message }),
  });

  function startEdit(row: SystemConfigResponse) {
    setEditingKey(row.configKey);
    setDraftValue(row.configValue);
  }

  function tryFormatJson(): void {
    try {
      setDraftValue(JSON.stringify(JSON.parse(draftValue), null, 2));
    } catch {
      showToast({ type: 'error', message: 'JSON không hợp lệ' });
    }
  }

  const prefixParts = prefix ? prefix.replace(/\/$/, '').split('/') : [];

  function navigatePrefix(index: number) {
    if (index < 0) {
      setPrefix('');
    } else {
      setPrefix(prefixParts.slice(0, index + 1).join('/') + '/');
    }
  }

  function openFolder(key: string) {
    setPrefix(key.endsWith('/') ? key : `${key}/`);
  }

  return (
    <DashboardLayout
      user={mockAdmin}
      role="admin"
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 w-full"
      >
        <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#141413] font-[Be_Vietnam_Pro] flex items-center gap-2">
              <HardDrive className="w-7 h-7 text-[#D97757]" />
              Lưu trữ & cấu hình
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-1">
              Quản lý cấu hình hệ thống (database) và file trên MinIO — xem, tải lên, xóa.
            </p>
          </div>
        </motion.div>

        <div className="flex gap-2 border-b border-[#E8E6DC]">
          <button
            type="button"
            onClick={() => setTab('db')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
              tab === 'db'
                ? 'bg-white border border-b-white border-[#E8E6DC] text-[#141413]'
                : 'text-[#6B6B6B] hover:text-[#141413]'
            }`}
          >
            <Database className="w-4 h-4" />
            Cấu hình DB
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('minio');
              if (bucket) void loadObjects(false);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
              tab === 'minio'
                ? 'bg-white border border-b-white border-[#E8E6DC] text-[#141413]'
                : 'text-[#6B6B6B] hover:text-[#141413]'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            MinIO
          </button>
        </div>

        {tab === 'db' && (
          <div className="bg-white rounded-xl border border-[#E8E6DC] shadow-sm overflow-hidden">
            {configsQuery.isLoading && (
              <motion.div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#D97757]" />
              </motion.div>
            )}
            {configsQuery.isError && (
              <p className="p-6 text-red-600 text-sm">Không tải được danh sách cấu hình.</p>
            )}
            {configsQuery.data && (
              <div className="divide-y divide-[#E8E6DC]">
                {configsQuery.data.map((row) => (
                  <motion.div key={row.configKey} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <code className="text-sm font-semibold text-[#141413]">{row.configKey}</code>
                        {row.description && (
                          <p className="text-xs text-[#6B6B6B] mt-1">{row.description}</p>
                        )}
                        <p className="text-xs text-[#9B9B9B] mt-0.5">
                          Cập nhật: {formatDate(row.updatedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {CONFIG_HINTS[row.configKey]?.link && (
                          <Link
                            to={CONFIG_HINTS[row.configKey].link!}
                            className="text-xs px-3 py-1.5 rounded-lg border border-[#E8E6DC] hover:bg-[#FAF9F5] flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {CONFIG_HINTS[row.configKey].label}
                          </Link>
                        )}
                        {editingKey !== row.configKey ? (
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-[#141413] text-white hover:bg-[#30302E]"
                          >
                            Sửa JSON / text
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {editingKey === row.configKey && (
                      <div className="mt-4 space-y-2">
                        <textarea
                          value={draftValue}
                          onChange={(e) => setDraftValue(e.target.value)}
                          rows={12}
                          className="w-full font-mono text-xs border border-[#E8E6DC] rounded-lg p-3"
                          spellCheck={false}
                        />
                        <motion.div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={tryFormatJson}
                            className="text-xs px-3 py-1.5 rounded-lg border border-[#E8E6DC]"
                          >
                            Format JSON
                          </button>
                          <button
                            type="button"
                            disabled={updateConfigMutation.isPending}
                            onClick={() =>
                              updateConfigMutation.mutate({
                                key: row.configKey,
                                value: draftValue,
                              })
                            }
                            className="text-xs px-3 py-1.5 rounded-lg bg-[#D97757] text-white flex items-center gap-1 disabled:opacity-50"
                          >
                            {updateConfigMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingKey(null)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-[#E8E6DC]"
                          >
                            Hủy
                          </button>
                        </motion.div>
                      </div>
                    )}
                    {editingKey !== row.configKey && (
                      <pre className="mt-3 text-xs bg-[#FAF9F5] border border-[#E8E6DC] rounded-lg p-3 max-h-32 overflow-auto whitespace-pre-wrap break-all">
                        {row.configValue.length > 400
                          ? `${row.configValue.slice(0, 400)}…`
                          : row.configValue}
                      </pre>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'minio' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E8E6DC] p-4 flex flex-wrap gap-3 items-end">
              <label className="flex flex-col gap-1 text-xs text-[#6B6B6B]">
                Bucket
                <select
                  value={bucket}
                  onChange={(e) => {
                    setBucket(e.target.value);
                    setPrefix('');
                    setObjects([]);
                  }}
                  className="border border-[#E8E6DC] rounded-lg px-3 py-2 text-sm min-w-[200px]"
                >
                  {buckets.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.label} ({b.name})
                    </option>
                  ))}
                </select>
              </label>
              {selectedBucketMeta?.description && (
                <p className="text-xs text-[#6B6B6B] flex-1 min-w-[200px]">
                  {selectedBucketMeta.description}
                </p>
              )}
              <label className="flex flex-col gap-1 text-xs text-[#6B6B6B] flex-1 min-w-[200px]">
                Tiền tố thư mục (prefix)
                <input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="vd. assessments/pdf-imports/"
                  className="border border-[#E8E6DC] rounded-lg px-3 py-2 text-sm font-mono"
                />
              </label>
              <button
                type="button"
                disabled={!bucket || loadingObjects}
                onClick={() => void loadObjects(false)}
                className="px-4 py-2 rounded-lg bg-[#141413] text-white text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {loadingObjects ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Tải danh sách
              </button>
              <label className="px-4 py-2 rounded-lg border border-[#E8E6DC] text-sm flex items-center gap-2 cursor-pointer hover:bg-[#FAF9F5]">
                <Upload className="w-4 h-4" />
                Tải file lên
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadMutation.mutate(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-sm text-[#6B6B6B]">
              <button type="button" onClick={() => navigatePrefix(-1)} className="hover:text-[#141413]">
                {bucket || '…'}
              </button>
              {prefixParts.map((part, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  <button type="button" onClick={() => navigatePrefix(i)} className="hover:text-[#141413]">
                    {part}
                  </button>
                </span>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-[#E8E6DC] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF9F5] text-left text-xs text-[#6B6B6B]">
                  <tr>
                    <th className="px-4 py-3">Tên</th>
                    <th className="px-4 py-3 w-24">Kích thước</th>
                    <th className="px-4 py-3 w-40">Sửa lúc</th>
                    <th className="px-4 py-3 w-36">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6DC]">
                  {objects.length === 0 && !loadingObjects && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#9B9B9B]">
                        Chọn bucket và bấm «Tải danh sách». Gợi ý:{' '}
                        <code className="text-xs">assessments/pdf-imports/</code>
                      </td>
                    </tr>
                  )}
                  {objects.map((obj) => {
                    const name = obj.key.replace(prefix, '') || obj.key;
                    return (
                      <tr key={obj.key} className="hover:bg-[#FAF9F5]/50">
                        <td className="px-4 py-2 font-mono text-xs break-all">
                          {obj.directory ? (
                            <button
                              type="button"
                              onClick={() => openFolder(obj.key)}
                              className="text-[#D97757] hover:underline flex items-center gap-1"
                            >
                              <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                              {name}
                            </button>
                          ) : (
                            name
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs">{obj.directory ? '—' : formatBytes(obj.size)}</td>
                        <td className="px-4 py-2 text-xs">{formatDate(obj.lastModified)}</td>
                        <td className="px-4 py-2">
                          {!obj.directory && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="text-xs text-[#2563EB] hover:underline"
                                onClick={async () => {
                                  try {
                                    const url = await AdminStorageService.presign(bucket, obj.key);
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                  } catch (e) {
                                    showToast({ type: 'error', message: (e as Error).message });
                                  }
                                }}
                              >
                                Mở
                              </button>
                              <button
                                type="button"
                                className="text-xs text-red-600 hover:underline flex items-center gap-0.5"
                                disabled={deleteMutation.isPending}
                                onClick={() => {
                                  if (
                                    !globalThis.confirm(
                                      `Xóa file "${obj.key}"? Hành động không hoàn tác.`
                                    )
                                  )
                                    return;
                                  deleteMutation.mutate({ b: bucket, key: obj.key });
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                                Xóa
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {truncated && (
                <div className="p-3 border-t border-[#E8E6DC] text-center">
                  <button
                    type="button"
                    disabled={loadingObjects || !nextToken}
                    onClick={() => void loadObjects(true, nextToken)}
                    className="text-sm text-[#D97757] hover:underline disabled:opacity-50"
                  >
                    Tải thêm…
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
      </div>
    </DashboardLayout>
  );
}
