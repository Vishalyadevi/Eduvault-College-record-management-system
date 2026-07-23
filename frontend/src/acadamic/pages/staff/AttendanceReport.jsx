import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, FileBarChart, Filter } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import * as XLSX from 'xlsx';
import { generateStaffAttendanceReport, getStaffAttendanceReportFilters } from '../../services/staffService';
import { ACADEMIC_DEGREES } from '../../utils/academicCalendar';

const today = new Date().toISOString().slice(0, 10);
const firstOfMonth = `${today.slice(0, 8)}01`;

export default function StaffAttendanceReport() {
  const [allocations, setAllocations] = useState([]);
  const [filters, setFilters] = useState({
    degree: '',
    batchId: '',
    courseId: '',
    sectionId: '',
    status: 'ALL',
    percentageFilter: false,
    percentageOperator: '<',
    percentageValue: '',
    fromDate: firstOfMonth,
    toDate: today
  });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStaffAttendanceReportFilters().then(setAllocations).catch((e) => toast.error(e.message || 'Unable to load assigned subjects'));
  }, []);

  const degreeAllocations = useMemo(() => allocations.filter((a) => !filters.degree || String(a.degree).toUpperCase() === filters.degree.toUpperCase()), [allocations, filters.degree]);
  const batches = useMemo(() => [...new Map(degreeAllocations.filter((a) => a.batchId).map((a) => [a.batchId, a])).values()], [degreeAllocations]);
  const batchAllocations = useMemo(() => degreeAllocations.filter((a) => !filters.batchId || String(a.batchId) === filters.batchId), [degreeAllocations, filters.batchId]);
  const courses = useMemo(() => [...new Map(batchAllocations.map((a) => [a.courseId, a])).values()], [batchAllocations]);
  const sections = useMemo(() => [...new Map(batchAllocations
    .filter((a) => !filters.courseId || String(a.courseId) === filters.courseId)
    .map((a) => [a.sectionId, a])).values()], [batchAllocations, filters.courseId]);

  const update = (key, value) => setFilters((old) => ({
    ...old,
    [key]: value,
    ...(key === 'degree' ? { batchId: '', courseId: '', sectionId: '' } : {}),
    ...(key === 'batchId' ? { courseId: '', sectionId: '' } : {}),
    ...(key === 'courseId' ? { sectionId: '' } : {})
  }));
  const generate = async () => {
    if (!filters.fromDate || !filters.toDate || filters.fromDate > filters.toDate) return toast.error('Select a valid date range');
    if (filters.percentageFilter) {
      const percentage = Number(filters.percentageValue);
      if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) return toast.error('Attendance percentage must be between 0 and 100');
    }
    setLoading(true);
    try {
      const result = await generateStaffAttendanceReport(filters);
      setRows(result.data || []); setSummary(result.summary || {});
      if (!(result.data || []).length) toast.info('No attendance records match these filters');
    } catch (e) { toast.error(e.response?.data?.message || e.message || 'Report generation failed'); }
    finally { setLoading(false); }
  };

  const exportExcel = () => {
    const exportRows = rows.map((r) => ({
      'Register No': r.regno, 'Student Name': r.name, Subject: `${r.courseCode} - ${r.courseTitle}`,
      Section: r.sectionName, Semester: r.semesterNumber, 'Total Classes': r.totalClasses,
      Present: r.present, Absent: r.absent, OD: r.od, 'Attendance %': r.percentage,
      ...(filters.percentageFilter ? { [`Attendance ${filters.percentageOperator} ${filters.percentageValue}%`]: 'YES' } : {})
    }));
    const sheet = XLSX.utils.json_to_sheet(exportRows);
    sheet['!cols'] = [14, 24, 34, 10, 10, 10, 10, 10, 14, 18].map((wch) => ({ wch }));
    const details = XLSX.utils.aoa_to_sheet([
      ['Faculty Attendance Report'], ['Degree', filters.degree || 'All assigned degrees'], ['Batch', filters.batchId || 'All assigned batches'],
      ['Subject', filters.courseId || 'All assigned subjects'], ['Section', filters.sectionId || 'All assigned sections'],
      ['Percentage Filter', filters.percentageFilter ? `${filters.percentageOperator} ${filters.percentageValue}%` : 'Not applied'],
      ['From Date', filters.fromDate], ['To Date', filters.toDate],
      ['Students', summary?.students || 0],
      ['Note', 'OD is counted as attended. Sundays and third Saturdays are excluded.']
    ]);
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, details, 'Report Details'); XLSX.utils.book_append_sheet(book, sheet, 'Attendance Report');
    XLSX.writeFile(book, `Staff_Attendance_${filters.fromDate}_to_${filters.toDate}.xlsx`);
  };

  return <div className="min-h-screen bg-slate-50 px-3 py-4 text-slate-900 sm:px-6">
    <div className="mb-6">
      <div className="flex items-center gap-3"><FileBarChart className="text-blue-600" /><h1 className="text-2xl font-bold">Generate Attendance Report</h1></div>
      <p className="mt-1 text-sm text-slate-500">Reports include only your allocated subjects, sections, batches, and students. OD is counted as attended.</p>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500"><Filter size={16}/> Report Filters</div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Degree"><select value={filters.degree} onChange={(e) => update('degree', e.target.value)}><option value="">All assigned degrees</option>{ACADEMIC_DEGREES.map((degree) => <option key={degree} value={degree}>{degree}</option>)}</select></Field>
        <Field label="Batch"><select value={filters.batchId} onChange={(e) => update('batchId', e.target.value)}><option value="">All assigned batches</option>{batches.map((b) => <option key={b.batchId} value={b.batchId}>{b.degree} {b.branch} - {b.batchYears || b.batch}</option>)}</select></Field>
        <Field label="Subject"><select value={filters.courseId} onChange={(e) => update('courseId', e.target.value)}><option value="">All assigned subjects</option>{courses.map((c) => <option key={c.courseId} value={c.courseId}>{c.courseCode} - {c.courseTitle}</option>)}</select></Field>
        <Field label="Section"><select value={filters.sectionId} onChange={(e) => update('sectionId', e.target.value)}><option value="">All assigned sections</option>{sections.map((s) => <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>)}</select></Field>
        <Field label="Attendance Status"><select value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="ALL">All statuses</option><option value="P">Has Present</option><option value="A">Has Absent</option><option value="OD">Has OD</option></select></Field>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2 xl:col-span-3">
          <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <input
              type="checkbox"
              checked={filters.percentageFilter}
              onChange={(e) => update('percentageFilter', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Filter with Attendance %
          </label>
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <select
              value={filters.percentageOperator}
              onChange={(e) => update('percentageOperator', e.target.value)}
              disabled={!filters.percentageFilter}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none disabled:opacity-50"
            >
              <option value="<">&lt; Less than</option>
              <option value=">">&gt; Greater than</option>
              <option value="=">= Equal to</option>
            </select>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Attendance percentage"
              value={filters.percentageValue}
              onChange={(e) => update('percentageValue', e.target.value)}
              disabled={!filters.percentageFilter}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none disabled:opacity-50"
            />
          </div>
        </div>
        <Field label="From Date"><input type="date" max={today} value={filters.fromDate} onChange={(e) => update('fromDate', e.target.value)} /></Field>
        <Field label="To Date"><input type="date" min={filters.fromDate} max={today} value={filters.toDate} onChange={(e) => update('toDate', e.target.value)} /></Field>
        <button onClick={generate} disabled={loading} className="h-11 rounded-lg bg-blue-600 px-5 font-bold text-white hover:bg-blue-700 disabled:opacity-50 sm:mt-6">{loading ? 'Generating...' : 'Generate Report'}</button>
      </div>
    </div>

    {summary && <div className="my-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Students" value={summary.students || 0}/>
      <Metric label="Present" value={summary.present || 0} tone="present"/>
      <Metric label="Absent" value={summary.absent || 0} tone="absent"/>
      <Metric label="On Duty" value={summary.od || 0} tone="od"/>
      {summary.percentageFilter && <Metric label={`Attendance ${summary.percentageOperator} ${summary.threshold}%`} value={summary.students || 0} warning />}
    </div>}

    {summary && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h2 className="font-bold">Student Attendance Details</h2><p className="text-xs text-slate-500">{filters.fromDate} to {filters.toDate}</p></div><button disabled={!rows.length} onClick={exportExcel} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50 disabled:opacity-40"><Download size={16}/> Export Excel</button></div>
      <div className="hidden overflow-x-auto md:block"><table className="min-w-[1120px] table-fixed text-sm"><colgroup><col className="w-36" /><col className="w-56" /><col className="w-72" /><col className="w-28" /><col className="w-20" /><col className="w-20" /><col className="w-20" /><col className="w-20" /><col className="w-28" /><col className="w-32" /></colgroup><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{['Register No','Student Name','Subject','Section','Total','Present','Absent','OD','Attendance','Status'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{rows.map((r) => <tr key={`${r.regno}-${r.courseId}-${r.sectionId}`} className={filters.percentageFilter && r.belowThreshold ? 'bg-red-50/60' : ''}><td className="px-4 py-3 font-mono whitespace-nowrap">{r.regno}</td><td className="px-4 py-3 font-semibold"><div className="truncate" title={r.name}>{r.name}</div></td><td className="px-4 py-3"><div className="font-semibold">{r.courseCode}</div><div className="max-h-10 overflow-hidden break-words text-xs leading-5 text-slate-500" title={r.courseTitle}>{r.courseTitle}</div></td><td className="px-4 py-3 whitespace-nowrap">{r.sectionName}</td><td className="px-4 py-3">{r.totalClasses}</td><td className="px-4 py-3 text-emerald-700">{r.present}</td><td className="px-4 py-3 text-red-700">{r.absent}</td><td className="px-4 py-3 text-blue-700">{r.od}</td><td className="px-4 py-3 font-bold">{r.percentage.toFixed(2)}%</td><td className="px-4 py-3">{filters.percentageFilter ? <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${r.belowThreshold ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.belowThreshold && <AlertTriangle size={12}/>} Matched</span> : <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">Included</span>}</td></tr>)}</tbody></table></div>
      {!!rows.length && <div className="space-y-3 p-4 md:hidden">{rows.map((row) => <AttendanceReportCard key={`${row.regno}-${row.courseId}-${row.sectionId}`} row={row} />)}</div>}
      {!rows.length && <div className="p-10 text-center text-sm text-slate-500">No attendance data available for the selected filters.</div>}
    </div>}
    <ToastContainer position="bottom-right" />
  </div>;
}

function Field({ label, children }) { return <label className="block text-xs font-bold uppercase tracking-wide text-slate-500"><span>{label}</span>{React.cloneElement(children, { className: 'mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500' })}</label>; }
const metricTones = {
  present: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
  absent: 'border-rose-200 bg-rose-50/70 text-rose-700',
  od: 'border-sky-200 bg-sky-50/70 text-sky-700',
};

function Metric({ label, value, warning, tone }) {
  const toneClass = warning
    ? 'border-red-200 bg-red-50/70 text-red-700'
    : metricTones[tone] || 'border-slate-200 bg-white text-slate-900';
  return <div className={`rounded-xl border p-4 ${toneClass}`}><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}

function AttendanceReportCard({ row }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-slate-500">{row.regno}</p>
          <h3 className="mt-1 break-words font-bold text-slate-900">{row.name}</h3>
          <p className="mt-2 text-xs font-semibold text-slate-700">{row.courseCode} · {row.sectionName}</p>
          <p className="mt-0.5 break-words text-xs leading-5 text-slate-500">{row.courseTitle}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white">
          {row.percentage.toFixed(2)}%
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <ReportCount label="Total" value={row.totalClasses} className="bg-slate-100 text-slate-700" />
        <ReportCount label="P" value={row.present} className="bg-emerald-50 text-emerald-700" />
        <ReportCount label="A" value={row.absent} className="bg-rose-50 text-rose-700" />
        <ReportCount label="OD" value={row.od} className="bg-sky-50 text-sky-700" />
      </div>
    </article>
  );
}

function ReportCount({ label, value, className }) {
  return <div className={`rounded-lg px-2 py-2 ${className}`}><div className="text-[10px] font-bold uppercase">{label}</div><div className="mt-0.5 text-sm font-bold">{value}</div></div>;
}
