import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Filter, X, ChevronDown, FileSpreadsheet, Users, GraduationCap, Award, History, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../records/pages/auth/AuthContext';
import api from '../../../records/services/api';

const StaffEligibleStudents = () => {
  const [filters, setFilters] = useState({
    batch: '',
    year: '',
    deptId: '',
    minTenth: '',
    maxTenth: '',
    minTwelfth: '',
    maxTwelfth: '',
    minCgpa: '',
    maxCgpa: '',
    hasArrearsHistory: '',
    hasStandingArrears: '',
    minTenthMaths: '',
    maxTenthMaths: '',
    minTwelfthPhysics: '',
    maxTwelfthPhysics: '',
    minTwelfthChemistry: '',
    maxTwelfthChemistry: '',
    minTwelfthMaths: '',
    maxTwelfthMaths: '',
    tenthMedium: '',
    twelfthMedium: '',
    degreeMedium: '',
    hasGapAfterTenth: '',
    hasGapAfterTwelfth: '',
    hasGapDuringDegree: '',
    hasAnyGap: '',
    staffId: '', // For "My Ward" filtering
  });

  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    batches: [],
    years: [1, 2, 3, 4],
    mediumOptions: ['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam'],
  });

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isWardOnly, setIsWardOnly] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    withArrears: 0,
    noArrears: 0
  });

  const { token, user } = useAuth();
  const userId = user?.id || user?.userId;

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await api.get("/placement/eligibility/filter-options");
      if (response.data.success) {
        setFilterOptions({
          departments: response.data.data.departments || [],
          batches: response.data.data.batches || [],
          years: response.data.data.years || [1, 2, 3, 4],
          mediumOptions: response.data.data.mediums || ['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam'],
        });
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const handleSearch = useCallback(async (currentFilters = filters) => {
    setLoading(true);
    try {
      const activeFilters = {};
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null) {
          activeFilters[key] = value;
        }
      });

      const response = await api.get("/placement/eligibility/eligible-students", {
        params: activeFilters
      });

      if (response.data.success) {
        setStudents(response.data.data);
        const withArrears = response.data.data.filter(s => s.has_standing_arrears).length;
        setStats({
          total: response.data.data.length,
          withArrears: withArrears,
          noArrears: response.data.data.length - withArrears
        });
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  // Handle Ward Only toggle
  useEffect(() => {
    const updatedFilters = {
      ...filters,
      staffId: isWardOnly ? userId : ''
    };
    setFilters(updatedFilters);
    // Auto-search when ward only toggle changes
    handleSearch(updatedFilters);
  }, [isWardOnly, userId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      batch: '',
      year: '',
      deptId: '',
      minTenth: '',
      maxTenth: '',
      minTwelfth: '',
      maxTwelfth: '',
      minCgpa: '',
      maxCgpa: '',
      hasArrearsHistory: '',
      hasStandingArrears: '',
      minTenthMaths: '',
      maxTenthMaths: '',
      minTwelfthPhysics: '',
      maxTwelfthPhysics: '',
      minTwelfthChemistry: '',
      maxTwelfthChemistry: '',
      minTwelfthMaths: '',
      maxTwelfthMaths: '',
      tenthMedium: '',
      twelfthMedium: '',
      degreeMedium: '',
      hasGapAfterTenth: '',
      hasGapAfterTwelfth: '',
      hasGapDuringDegree: '',
      hasAnyGap: '',
      staffId: isWardOnly ? userId : '',
    });
    setStudents([]);
    setStats({ total: 0, withArrears: 0, noArrears: 0 });
  };

  const getActiveColumns = () => {
    const columns = [
      { key: 'registerNumber', label: 'Reg No', always: true },
      { key: 'username', label: 'Name', always: true },
      { key: 'email', label: 'Email', always: true },
      { key: 'department_acronym', label: 'Dept', always: true },
      { key: 'batch', label: 'Batch', always: true },
      { key: 'semester', label: 'Sem', always: true },
      { key: 'tenth_percentage', label: '10th %', filter: ['minTenth', 'maxTenth'] },
      { key: 'twelfth_percentage', label: '12th %', filter: ['minTwelfth', 'maxTwelfth'] },
      { key: 'cgpa', label: 'CGPA', filter: ['minCgpa', 'maxCgpa'] },
      { key: 'gpa', label: 'GPA', filter: ['minGpa', 'maxGpa'] },
      { key: 'has_standing_arrears', label: 'Arrears', always: true, type: 'boolean' },
    ];

    return columns.filter(col => {
      if (col.always) return true;
      if (Array.isArray(col.filter)) {
        return col.filter.some(f => filters[f] !== '');
      }
      return filters[col.filter] !== '';
    });
  };

  const exportToExcel = () => {
    if (!students.length) return;
    const wsData = [
      ['Reg No', 'Name', 'Email', 'Dept', 'Batch', 'Sem', 'Gender', 'Phone', '10th %', '12th %', 'CGPA', 'GPA', 'Standing Arrears', 'Arrears History', 'Gap After 10th', 'Gap After 12th', 'Gap During Degree'],
      ...students.map(s => [
        s.registerNumber, s.username, s.email, s.department_acronym, s.batch, s.semester, s.gender, s.personal_phone,
        s.tenth_percentage || 'N/A', s.twelfth_percentage || 'N/A', s.cgpa || 'N/A', s.gpa || 'N/A',
        s.has_standing_arrears ? 'Yes' : 'No',
        s.has_arrears_history ? 'Yes' : 'No',
        s.gap_after_tenth ? 'Yes' : 'No',
        s.gap_after_twelfth ? 'Yes' : 'No',
        s.gap_during_degree ? 'Yes' : 'No'
      ])
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Eligible Students');
    XLSX.writeFile(wb, `Staff_Eligible_Students_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div
      className="min-h-screen bg-white"
    >
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Eligibility</h1>
            <p className="text-slate-500 mt-1">Filter and export student data for placement activities</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">My Wards Only</span>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
              title="Toggle Filters"
            >
              <Filter size={20} className={showFilters ? 'text-indigo-600' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-xl">
              <Users className="text-indigo-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Found</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl">
              <Award className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">No Standing Arrears</p>
              <p className="text-2xl font-bold text-slate-900">{stats.noArrears}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="bg-rose-50 p-3 rounded-xl">
              <AlertCircle className="text-rose-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">With Arrears</p>
              <p className="text-2xl font-bold text-slate-900">{stats.withArrears}</p>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FilterSelect
                  label="Batch"
                  name="batch"
                  value={filters.batch}
                  onChange={handleFilterChange}
                  options={filterOptions.batches.map(b => ({ value: b, label: b }))}
                  placeholder="All Batches"
                />
                <FilterSelect
                  label="Year"
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  options={filterOptions.years.map(y => ({ value: y, label: `Year ${y}` }))}
                  placeholder="All Years"
                />
                {!isWardOnly && (
                  <FilterSelect
                    label="Department"
                    name="deptId"
                    value={filters.deptId}
                    onChange={handleFilterChange}
                    options={filterOptions.departments.map(d => ({ value: d.departmentId, label: d.departmentName }))}
                    placeholder="All Departments"
                  />
                )}
                <FilterSelect
                  label="Arrears Status"
                  name="hasStandingArrears"
                  value={filters.hasStandingArrears}
                  onChange={handleFilterChange}
                  options={[
                    { value: 'true', label: 'Has Arrears' },
                    { value: 'false', label: 'No Arrears' }
                  ]}
                  placeholder="Any Status"
                />

                <FilterInput
                  label="Min CGPA"
                  name="minCgpa"
                  type="number"
                  step="0.01"
                  value={filters.minCgpa}
                  onChange={handleFilterChange}
                  placeholder="0.00"
                />
                <FilterInput
                  label="Min 10th %"
                  name="minTenth"
                  type="number"
                  value={filters.minTenth}
                  onChange={handleFilterChange}
                  placeholder="0"
                />
                <FilterInput
                  label="Min 12th %"
                  name="minTwelfth"
                  type="number"
                  value={filters.minTwelfth}
                  onChange={handleFilterChange}
                  placeholder="0"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 flex items-center gap-1 transition-all"
                >
                  {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                  <ChevronDown size={16} className={`transition-transform duration-300 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={clearFilters}
                    className="px-5 py-2.5 text-slate-600 text-sm font-bold hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => handleSearch()}
                    className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all flex items-center gap-2"
                  >
                    <Search size={18} />
                    Search
                  </button>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="space-y-6 pt-6 border-t border-slate-100 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FilterInput label="Max 10th %" name="maxTenth" type="number" value={filters.maxTenth} onChange={handleFilterChange} placeholder="100" />
                    <FilterInput label="Max 12th %" name="maxTwelfth" type="number" value={filters.maxTwelfth} onChange={handleFilterChange} placeholder="100" />
                    <FilterInput label="Max CGPA" name="maxCgpa" type="number" step="0.01" value={filters.maxCgpa} onChange={handleFilterChange} placeholder="10.00" />
                    <FilterSelect label="History" name="hasArrearsHistory" value={filters.hasArrearsHistory} onChange={handleFilterChange} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} placeholder="Any" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FilterInput label="Min Degree GPA" name="minGpa" type="number" step="0.01" value={filters.minGpa} onChange={handleFilterChange} placeholder="0.00" />
                    <FilterInput label="Max Degree GPA" name="maxGpa" type="number" step="0.01" value={filters.maxGpa} onChange={handleFilterChange} placeholder="10.00" />
                    <FilterSelect label="Medium" name="tenthMedium" value={filters.tenthMedium} onChange={handleFilterChange} options={filterOptions.mediumOptions.map(m => ({ value: m, label: m }))} placeholder="Any" />
                    <FilterSelect label="Gap After 10th" name="hasGapAfterTenth" value={filters.hasGapAfterTenth} onChange={handleFilterChange} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} placeholder="Any" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FilterSelect label="Gap After 12th" name="hasGapAfterTwelfth" value={filters.hasGapAfterTwelfth} onChange={handleFilterChange} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} placeholder="Any" />
                    <FilterSelect label="Gap During Degree" name="hasGapDuringDegree" value={filters.hasGapDuringDegree} onChange={handleFilterChange} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} placeholder="Any" />
                    <FilterSelect label="Any Gap" name="hasAnyGap" value={filters.hasAnyGap} onChange={handleFilterChange} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} placeholder="Any" />
                    <FilterInput label="Min 12th Maths" name="minTwelfthMaths" type="number" value={filters.minTwelfthMaths} onChange={handleFilterChange} placeholder="0" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FilterInput label="Min 10th Maths" name="minTenthMaths" type="number" value={filters.minTenthMaths} onChange={handleFilterChange} placeholder="0" />
                    <FilterInput label="Min 12th Physics" name="minTwelfthPhysics" type="number" value={filters.minTwelfthPhysics} onChange={handleFilterChange} placeholder="0" />
                    <FilterInput label="Min 12th Chemistry" name="minTwelfthChemistry" type="number" value={filters.minTwelfthChemistry} onChange={handleFilterChange} placeholder="0" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={22} />
              Candidate List
              <span className="ml-2 text-sm font-normal text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                {students.length} results
              </span>
            </h2>

            {students.length > 0 && (
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
              >
                <FileSpreadsheet size={18} />
                Export Excel
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {getActiveColumns().map(col => (
                    <th key={col.key} className="px-6 py-4 border-b border-slate-100">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={getActiveColumns().length} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium tracking-wide">Fetching candidate data...</p>
                      </div>
                    </td>
                  </tr>
                ) : students.length > 0 ? (
                  students.map((student, idx) => (
                    <tr key={student.Userid || idx} className="hover:bg-slate-50 transition-colors group">
                      {getActiveColumns().map(col => {
                        let value = student[col.key];

                        if (col.key === 'has_standing_arrears') {
                          return (
                            <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${value ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                {value ? 'Arrears' : 'Clear'}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td key={col.key} className={`px-6 py-4 text-sm whitespace-nowrap ${col.key === 'registerNumber' ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                            {value || 'N/A'}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={getActiveColumns().length} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-400">
                        <Search size={48} className="opacity-20" />
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-slate-500">No candidates found</p>
                          <p className="text-sm">Try adjusting your filters to find eligible students</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const FilterSelect = ({ label, name, value, onChange, options, placeholder }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const FilterInput = ({ label, name, value, onChange, placeholder, type = "text", step }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      name={name}
      step={step}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
    />
  </div>
);

export default StaffEligibleStudents;