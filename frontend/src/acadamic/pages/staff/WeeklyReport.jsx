import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, Download, FileText, Filter, Users, CheckCircle, XCircle } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import * as XLSX from 'xlsx';
import { getStaffAttendanceReportFilters } from '../../services/staffService';
import API from '../../../api';

const today = new Date();
const formatIso = (d) => d.toISOString().slice(0, 10);

export default function StaffWeeklyReport() {
  const [allocations, setAllocations] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return formatIso(new Date(d.setDate(diff)));
  });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStaffAttendanceReportFilters()
      .then(setAllocations)
      .catch((e) => toast.error(e.message || 'Unable to load subjects'));
  }, []);

  const batches = useMemo(() => [...new Map(allocations.filter(a => a.batchId).map(a => [a.batchId, a])).values()], [allocations]);
  const courses = useMemo(() => [...new Map(allocations.filter(a => !selectedBatch || String(a.batchId) === selectedBatch).map(a => [a.courseId, a])).values()], [allocations, selectedBatch]);
  const sections = useMemo(() => [...new Map(allocations.filter(a => (!selectedBatch || String(a.batchId) === selectedBatch) && (!selectedCourse || String(a.courseId) === selectedCourse)).map(a => [a.sectionId, a])).values()], [allocations, selectedBatch, selectedCourse]);

  const weekEnd = useMemo(() => {
    if (!selectedWeekStart) return '';
    const d = new Date(selectedWeekStart);
    d.setDate(d.getDate() + 6);
    return formatIso(d);
  }, [selectedWeekStart]);

  const fetchWeeklyData = async () => {
    if (!selectedWeekStart) {
      return toast.error('Please select a week starting date');
    }
    setLoading(true);
    try {
      const { data } = await API.get('/staff/attendance-report', {
        params: {
          batchId: selectedBatch,
          courseId: selectedCourse,
          sectionId: selectedSection,
          fromDate: selectedWeekStart,
          toDate: weekEnd
        }
      });
      const rows = data?.data || data || [];
      setReportData(rows);
      if (!rows.length) toast.info('No weekly attendance records found');
    } catch (err) {
      console.error('Error fetching weekly report:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch weekly attendance');
    } finally {
      setLoading(false);
    }
  };

  const exportWeeklyExcel = () => {
    if (!reportData.length) return;
    const exportRows = reportData.map(r => ({
      'Reg No': r.regno,
      'Student Name': r.name,
      'Subject': `${r.courseCode || ''} - ${r.courseTitle || ''}`,
      'Section': r.sectionName || '',
      'Total Classes': r.totalClasses || 0,
      'Present': r.present || 0,
      'Absent': r.absent || 0,
      'OD': r.od || 0,
      'Weekly %': r.percentage ? `${r.percentage.toFixed(2)}%` : '0%'
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Attendance');
    XLSX.writeFile(wb, `Weekly_Attendance_${selectedWeekStart}_to_${weekEnd}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 text-slate-900">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Clock className="text-blue-600" size={28} />
            <h1 className="text-2xl font-bold">Weekly Attendance Report</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Weekly breakdown for your allocated courses ({selectedWeekStart} to {weekEnd})
          </p>
        </div>
        <button
          onClick={exportWeeklyExcel}
          disabled={!reportData.length}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <Download size={18} />
          Export Weekly Excel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Filter size={16} /> Filters
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Week Starting (Monday)</label>
            <input
              type="date"
              value={selectedWeekStart}
              onChange={(e) => setSelectedWeekStart(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Assigned Batches</option>
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>{b.degree} {b.branch} - {b.batchYears || b.batch}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subject</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Assigned Subjects</option>
              {courses.map((c) => (
                <option key={c.courseId} value={c.courseId}>{c.courseCode} - {c.courseTitle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchWeeklyData}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Generate Weekly Report'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-sm text-slate-700">Weekly Attendance Breakdown</h2>
          <span className="text-xs text-slate-500">{reportData.length} records</span>
        </div>
        {reportData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Reg No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center text-emerald-700">Present</th>
                  <th className="px-4 py-3 text-center text-rose-700">Absent</th>
                  <th className="px-4 py-3 text-center text-sky-700">OD</th>
                  <th className="px-4 py-3 text-right">Weekly %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{r.regno}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{r.name}</td>
                    <td className="px-4 py-3">{r.courseCode} - {r.courseTitle}</td>
                    <td className="px-4 py-3">{r.sectionName}</td>
                    <td className="px-4 py-3 text-center font-bold">{r.totalClasses}</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600">{r.present}</td>
                    <td className="px-4 py-3 text-center font-bold text-rose-600">{r.absent}</td>
                    <td className="px-4 py-3 text-center font-bold text-sky-600">{r.od}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-blue-600">
                      {r.percentage ? `${r.percentage.toFixed(2)}%` : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-slate-400 text-sm">
            Select filters and click "Generate Weekly Report" to load weekly attendance.
          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
}
