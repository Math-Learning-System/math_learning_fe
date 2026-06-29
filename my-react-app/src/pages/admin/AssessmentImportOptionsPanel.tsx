import { Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useToast } from '../../context/ToastContext';
import { AssessmentService } from '../../services/api/assessment.service';
import { SystemConfigService } from '../../services/api/systemConfig.service';
import type {
  AssessmentImportFormOptions,
  CodeLabelOption,
  ProvinceCityOption,
} from '../../types';

const CONFIG_KEY = 'assessment_import_options';

export function AssessmentImportOptionsPanel() {
  const { showToast } = useToast();
  const [schoolYears, setSchoolYears] = useState<string[]>([]);
  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [provinceCities, setProvinceCities] = useState<ProvinceCityOption[]>([]);
  const [examScopes, setExamScopes] = useState<CodeLabelOption[]>([]);
  const [organizerTypes, setOrganizerTypes] = useState<CodeLabelOption[]>([]);
  const [pdfLayouts, setPdfLayouts] = useState<CodeLabelOption[]>([]);
  const [importContentModes, setImportContentModes] = useState<CodeLabelOption[]>([]);
  const [adminVersion, setAdminVersion] = useState('');
  const [country, setCountry] = useState('');
  const [newScopeId, setNewScopeId] = useState('');
  const [newScopeLabel, setNewScopeLabel] = useState('');
  const [newScopeFields, setNewScopeFields] = useState('');
  const [newOrgId, setNewOrgId] = useState('');
  const [newOrgLabel, setNewOrgLabel] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newType, setNewType] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newProvince, setNewProvince] = useState('');
  const [newProvinceType, setNewProvinceType] = useState<'province' | 'municipality'>('province');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AssessmentService.getImportFormOptions()
      .then((res) => applyOptions(res.result))
      .catch(() =>
        showToast({ type: 'error', message: 'Không tải được cấu hình import đề' })
      )
      .finally(() => setLoading(false));
  }, [showToast]);

  function applyOptions(opts: AssessmentImportFormOptions | undefined) {
    if (!opts) return;
    setSchoolYears(opts.schoolYears ?? []);
    setExamTypes(opts.examTypes ?? []);
    setDepartments(opts.departments ?? []);
    setProvinceCities(opts.provinceCities ?? []);
    setExamScopes(opts.examScopes ?? []);
    setOrganizerTypes(opts.organizerTypes ?? []);
    setPdfLayouts(opts.pdfLayouts ?? []);
    setImportContentModes(opts.importContentModes ?? []);
    setAdminVersion(opts.adminVersion ?? '');
    setCountry(opts.country ?? '');
  }

  function addExamScope() {
    const id = newScopeId.trim();
    const label = newScopeLabel.trim();
    if (!id || !label) return;
    if (examScopes.some((s) => s.id === id)) {
      showToast({ type: 'error', message: 'Mã cấp đề đã tồn tại' });
      return;
    }
    const fields = newScopeFields
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
    setExamScopes((prev) => [...prev, { id, label, fields: fields.length ? fields : undefined }]);
    setNewScopeId('');
    setNewScopeLabel('');
    setNewScopeFields('');
  }

  function addOrganizerType() {
    const id = newOrgId.trim();
    const label = newOrgLabel.trim();
    if (!id || !label) return;
    if (organizerTypes.some((t) => t.id === id)) {
      showToast({ type: 'error', message: 'Mã loại đơn vị đã tồn tại' });
      return;
    }
    setOrganizerTypes((prev) => [...prev, { id, label }]);
    setNewOrgId('');
    setNewOrgLabel('');
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: AssessmentImportFormOptions = {
        schoolYears,
        examTypes,
        departments,
        examScopes,
        organizerTypes,
        provinceCities,
        pdfLayouts,
        importContentModes,
        adminVersion,
        country,
      };
      await SystemConfigService.update(CONFIG_KEY, JSON.stringify(payload, null, 2));
      showToast({ type: 'success', message: 'Đã lưu cấu hình import đề' });
    } catch (e) {
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Lưu thất bại',
      });
    } finally {
      setSaving(false);
    }
  }

  function addYear() {
    const y = newYear.trim().replace(/\s+/g, '');
    if (!y) return;
    if (schoolYears.includes(y)) {
      showToast({ type: 'error', message: 'Năm học đã tồn tại' });
      return;
    }
    setSchoolYears((prev) => [...prev, y].sort());
    setNewYear('');
  }

  function addType() {
    const t = newType.trim();
    if (!t) return;
    if (examTypes.includes(t)) {
      showToast({ type: 'error', message: 'Loại đề đã tồn tại' });
      return;
    }
    setExamTypes((prev) => [...prev, t]);
    setNewType('');
  }

  function addDepartment() {
    const d = newDepartment.trim();
    if (!d) return;
    if (departments.includes(d)) {
      showToast({ type: 'error', message: 'Sở/Kỳ thi đã tồn tại' });
      return;
    }
    setDepartments((prev) => [...prev, d]);
    setNewDepartment('');
  }

  function addProvince() {
    const name = newProvince.trim();
    if (!name) return;
    if (provinceCities.some((p) => p.name === name)) {
      showToast({ type: 'error', message: 'Tỉnh/thành đã tồn tại' });
      return;
    }
    setProvinceCities((prev) => [...prev, { name, type: newProvinceType }]);
    setNewProvince('');
  }

  if (loading) {
    return (
      <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">Đang tải cấu hình import đề…</p>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 space-y-5">
      <div>
        <h3 className="font-[Playfair_Display] text-[17px] font-medium text-[#0f172a]">
          Cấu hình import đề PDF
        </h3>
        <p className="mt-1 font-[Be_Vietnam_Pro] text-[12px] text-[#64748b]">
          Năm học, loại đề, preset đơn vị ra đề và danh mục tỉnh/thành ({provinceCities.length}{' '}
          đơn vị). Phiên bản: {adminVersion || '—'}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="abf-field">
          <span className="abf-field__label">Phiên bản danh mục hành chính</span>
          <input
            className="input"
            value={adminVersion}
            onChange={(e) => setAdminVersion(e.target.value)}
            placeholder="VN_34_PROVINCES_2025"
          />
        </label>
        <label className="abf-field">
          <span className="abf-field__label">Quốc gia</span>
          <input
            className="input"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Việt Nam"
          />
        </label>
      </div>

      <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b]">
        Dạng PDF và chế độ nội dung khi giáo viên bấm &quot;Tạo đề từ PDF&quot;.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CatalogOptionColumn
          title="Dạng PDF"
          items={pdfLayouts}
          onRemove={(id) => setPdfLayouts((prev) => prev.filter((x) => x.id !== id))}
        />
        <CatalogOptionColumn
          title="Chế độ xử lý nội dung"
          items={importContentModes}
          onRemove={(id) => setImportContentModes((prev) => prev.filter((x) => x.id !== id))}
          showEnabled
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CodeLabelColumn
          title="Cấp đề thi"
          hint="fields: provinceCity, district, schoolName"
          items={examScopes}
          onRemove={(id) => setExamScopes((prev) => prev.filter((x) => x.id !== id))}
          input={
            <div className="flex flex-col gap-2">
              <input
                className="input"
                placeholder="id: province_city"
                value={newScopeId}
                onChange={(e) => setNewScopeId(e.target.value)}
              />
              <input
                className="input"
                placeholder="Nhãn hiển thị"
                value={newScopeLabel}
                onChange={(e) => setNewScopeLabel(e.target.value)}
              />
              <input
                className="input"
                placeholder="fields: provinceCity,district"
                value={newScopeFields}
                onChange={(e) => setNewScopeFields(e.target.value)}
              />
              <button type="button" className="btn secondary self-start" onClick={addExamScope}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          }
        />
        <CodeLabelColumn
          title="Loại đơn vị ra đề"
          items={organizerTypes}
          onRemove={(id) => setOrganizerTypes((prev) => prev.filter((x) => x.id !== id))}
          input={
            <div className="flex flex-col gap-2">
              <input
                className="input"
                placeholder="id: department_of_education"
                value={newOrgId}
                onChange={(e) => setNewOrgId(e.target.value)}
              />
              <input
                className="input"
                placeholder="Nhãn hiển thị"
                value={newOrgLabel}
                onChange={(e) => setNewOrgLabel(e.target.value)}
              />
              <button type="button" className="btn secondary self-start" onClick={addOrganizerType}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ListColumn
          title="Năm học"
          items={schoolYears}
          onRemove={(y) => setSchoolYears((prev) => prev.filter((x) => x !== y))}
          input={
            <>
              <input
                className="input flex-1"
                placeholder="2025-2026"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
              />
              <button type="button" className="btn secondary" onClick={addYear}>
                <Plus className="h-4 w-4" />
              </button>
            </>
          }
        />
        <ListColumn
          title="Loại đề"
          items={examTypes}
          onRemove={(t) => setExamTypes((prev) => prev.filter((x) => x !== t))}
          input={
            <>
              <input
                className="input flex-1"
                placeholder="Đề chính thức"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
              <button type="button" className="btn secondary" onClick={addType}>
                <Plus className="h-4 w-4" />
              </button>
            </>
          }
        />
        <ListColumn
          title="Đơn vị ra đề"
          items={departments}
          onRemove={(d) => setDepartments((prev) => prev.filter((x) => x !== d))}
          input={
            <>
              <input
                className="input flex-1"
                placeholder="Sở GD&ĐT Hà Nội"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
              />
              <button type="button" className="btn secondary" onClick={addDepartment}>
                <Plus className="h-4 w-4" />
              </button>
            </>
          }
        />
      </div>

      <div>
        <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold uppercase text-[#64748b]">
          Tỉnh / Thành phố ({country})
        </p>
        <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
          {provinceCities.map((p) => (
            <li
              key={p.name}
              className="flex items-center justify-between rounded-lg bg-[#ffffff] px-3 py-2 font-[Be_Vietnam_Pro] text-[13px]"
            >
              <span>
                {p.name}
                <span className="ml-2 text-[11px] text-[#64748b]">
                  {p.type === 'municipality' ? 'TP TW' : 'Tỉnh'}
                </span>
              </span>
              <button
                type="button"
                className="text-[#BE123C]"
                onClick={() =>
                  setProvinceCities((prev) => prev.filter((x) => x.name !== p.name))
                }
                aria-label={`Xóa ${p.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            className="input min-w-[12rem] flex-1"
            placeholder="Tên tỉnh/thành"
            value={newProvince}
            onChange={(e) => setNewProvince(e.target.value)}
          />
          <select
            className="select w-auto"
            value={newProvinceType}
            onChange={(e) =>
              setNewProvinceType(e.target.value as 'province' | 'municipality')
            }
          >
            <option value="province">Tỉnh</option>
            <option value="municipality">TP trực thuộc TW</option>
          </select>
          <button type="button" className="btn secondary" onClick={addProvince}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="btn inline-flex items-center gap-2"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          <Save className="h-4 w-4" />
          {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
        </button>
      </div>
    </div>
  );
}


function ListColumn({
  title,
  items,
  onRemove,
  input,
}: {
  title: string;
  items: string[];
  onRemove: (item: string) => void;
  input: ReactNode;
}) {
  return (
    <div>
      <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold uppercase text-[#64748b]">
        {title}
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center justify-between rounded-lg bg-[#ffffff] px-3 py-2 font-[Be_Vietnam_Pro] text-[13px]"
          >
            {item}
            <button
              type="button"
              className="text-[#BE123C]"
              onClick={() => onRemove(item)}
              aria-label={`Xóa ${item}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">{input}</div>
    </div>
  );
}

function CatalogOptionColumn({
  title,
  items,
  onRemove,
  showEnabled,
}: {
  title: string;
  items: CodeLabelOption[];
  onRemove: (id: string) => void;
  showEnabled?: boolean;
}) {
  return (
    <div>
      <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold uppercase text-[#64748b]">
        {title}
      </p>
      <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-2 rounded-lg bg-[#ffffff] px-3 py-2 font-[Be_Vietnam_Pro] text-[13px]"
          >
            <span>
              <span className="font-medium">{item.label}</span>
              <span className="ml-2 text-[11px] text-[#64748b]">({item.id})</span>
              {item.description ? (
                <span className="mt-0.5 block text-[11px] text-[#64748b]">{item.description}</span>
              ) : null}
              {showEnabled ? (
                <span className="mt-0.5 block text-[11px] text-[#64748b]">
                  enabled: {item.enabled === false ? 'false' : 'true'}
                </span>
              ) : null}
            </span>
            <button
              type="button"
              className="shrink-0 text-[#BE123C]"
              onClick={() => onRemove(item.id)}
              aria-label={`Xóa ${item.label}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 font-[Be_Vietnam_Pro] text-[11px] text-[#64748b]">
        Thêm/sửa chi tiết qua JSON nâng cao hoặc migration V29.
      </p>
    </div>
  );
}

function CodeLabelColumn({
  title,
  hint,
  items,
  onRemove,
  input,
}: {
  title: string;
  hint?: string;
  items: CodeLabelOption[];
  onRemove: (id: string) => void;
  input: ReactNode;
}) {
  return (
    <div>
      <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold uppercase text-[#64748b]">
        {title}
      </p>
      {hint ? (
        <p className="mt-0.5 font-[Be_Vietnam_Pro] text-[11px] text-[#64748b]">{hint}</p>
      ) : null}
      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-2 rounded-lg bg-[#ffffff] px-3 py-2 font-[Be_Vietnam_Pro] text-[13px]"
          >
            <span>
              <span className="font-medium">{item.label}</span>
              <span className="ml-2 text-[11px] text-[#64748b]">({item.id})</span>
              {item.fields && item.fields.length > 0 ? (
                <span className="mt-0.5 block text-[11px] text-[#64748b]">
                  fields: {item.fields.join(', ')}
                </span>
              ) : null}
            </span>
            <button
              type="button"
              className="shrink-0 text-[#BE123C]"
              onClick={() => onRemove(item.id)}
              aria-label={`Xóa ${item.label}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2">{input}</div>
    </div>
  );
}