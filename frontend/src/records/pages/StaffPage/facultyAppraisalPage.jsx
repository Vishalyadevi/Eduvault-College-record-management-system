import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, Save, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import DataTable from '../../components/DataTable';

const FacultyAppraisalPage = () => {
  const [selectedLevel, setSelectedLevel] = useState('Level-1');
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAppraisal, setCurrentAppraisal] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  const [kpiResponses, setKpiResponses] = useState({});
  const [calculatedScores, setCalculatedScores] = useState(null);

  const levels = [
    { value: 'Level-1', label: 'Level-1: AP (1-2 Years)' },
    { value: 'Level-2', label: 'Level-2: AP (2+ Years)' },
    { value: 'Level-3', label: 'Level-3: AP with Ph.D' },
    { value: 'Level-4', label: 'Level-4: AP (Senior Grade)' },
    { value: 'Level-5', label: 'Level-5: Associate Professor' },
    { value: 'Level-6', label: 'Level-6: Professor' }
  ];

  // Level configurations
  const getLevelConfig = (level) => {
    const configs = {
      'Level-1': {
        weights: { SA: 0.40, RBA: 0.45, HPE: 0.10, SF: 0.05 },
        sections: {
          SA: {
            title: 'Self Appraisal',
            kpis: [
              { code: 'KPI1', name: 'Online Courses (NPTEL/MOOC)', weight: 5, type: 'dropdown', options: ['5% Topper', 'Elite Gold', 'Elite Silver', 'Elite/>80%', 'NPTEL/60-80%'] },
              { code: 'KPI2', name: 'FDP/STTP Attendance', weight: 3, type: 'dropdown', options: ['Other states NIRF/IIT/NIT', 'Anna Univ/Premier', 'Govt/Aided', 'Offline Auto/Self-fin', 'Online'] },
              { code: 'KPI3', name: 'Course File Maintenance', weight: 2.5, type: 'dropdown', options: ['Outstanding', 'Positive', 'No negative', 'Some negative', 'Deficiency'] },
              { code: 'KPI4', name: 'Innovative Teaching Methods', weight: 2.5, type: 'dropdown', options: ['Published on website', 'Appreciated by HoD', 'One method documented', 'One method not documented', 'Conventional'] },
              { code: 'KPI5', name: 'Student Project Publication', weight: 2.5, type: 'dropdown', options: ['>2 Scopus/Patent pub', '2 Scopus/Patent pub', '1 Scopus/Patent filed', '2+ conference/draft', '1 conference/draft'] },
              { code: 'KPI6', name: 'Student Product Funding', weight: 2.5, type: 'dropdown', options: ['>Rs.50k/TRL 4-5', 'Rs.20-50k/TRL 3', 'Rs.5-20k', 'Won exhibition', 'Participated'] },
              { code: 'KPI7', name: 'Academic Results (%)', weight: 2, type: 'number', min: 75, max: 100 },
              { code: 'KPI8', name: 'Video Content Development', weight: 1, type: 'dropdown', options: ['100% 2 COs LMS+Social', '100% 1 CO LMS+Social', '50% 1 CO LMS+Social', '25% 1 CO LMS+Social', 'One video'] },
              { code: 'KPI9', name: 'Social Media Activity', weight: 1, type: 'social', fields: ['connections', 'posts', 'responses'] }
            ]
          },
          RBA: {
            title: 'Review Based Appraisal',
            kpis: [
              { code: 'RPI1', name: 'Subject Knowledge', weight: 3, type: 'rating', max: 5 },
              { code: 'RPI2', name: 'Practical Preparedness', weight: 3, type: 'rating', max: 5 },
              { code: 'RPI3', name: 'Latest Developments', weight: 3, type: 'rating', max: 5 },
              { code: 'RPI4', name: 'GATE/Company Questions', weight: 2, type: 'dropdown', options: ['50+ questions', '35-49 questions', '25-34 questions', '15-24 questions', '5-14 questions'] },
              { code: 'RPI5', name: 'Content Delivery Methods', weight: 2, type: 'rating', max: 5 },
              { code: 'RPI6', name: 'Assessment Tools', weight: 2, type: 'rating', max: 5 },
              { code: 'RPI7', name: 'Library Integration', weight: 2, type: 'rating', max: 5 },
              { code: 'RPI8', name: 'PBL Skills', weight: 2, type: 'rating', max: 5 },
              { code: 'RPI9', name: 'Communication Skills', weight: 1, type: 'rating', max: 5 }
            ]
          },
          HPE: {
            title: 'HOD/Principal Evaluation',
            kpis: [
              { code: 'H1', name: 'Academic Achievements (%)', weight: 3, type: 'number', min: 50, max: 100 },
              { code: 'H2', name: 'Slow Learner Improvement', weight: 2, type: 'dropdown', options: ['All improved', '50% improved', '25% improved', 'Efforts taken', 'Only identified'] },
              { code: 'H3', name: 'Online Courses (%)', weight: 2, type: 'number', min: 0, max: 100 },
              { code: 'H4', name: 'Product Development (%)', weight: 2, type: 'number', min: 0, max: 100 },
              { code: 'H5', name: 'Event Participation', weight: 2, type: 'events', fields: ['participation', 'prizes'] },
              { code: 'H6', name: 'Competency Training', weight: 1, type: 'dropdown', options: ['3 students higher cutoff', '2 students higher cutoff', '3 students eligible', '2 students eligible', '5 students attended'] },
              { code: 'H7', name: 'Career Settlement', weight: 3, type: 'dropdown', options: ['100%+dream/contest', '100%+one achievement', '100% with exams', '85% with exams', '75% with exams'] },
              { code: 'H8', name: 'Language Learning (count)', weight: 1, type: 'number', min: 0, max: 10 },
              { code: 'H9', name: 'Entrepreneurship', weight: 2, type: 'dropdown', options: ['Udyam/Startup reg', 'MSME project', 'ED Cell fund', 'Active member', 'Motivating'] },
              { code: 'H10', name: 'Discipline', weight: 2, type: 'rating', max: 5 },
              { code: 'H11', name: 'Interpersonal Skills', weight: 2, type: 'rating', max: 5 },
              { code: 'H12', name: 'Volunteering', weight: 2, type: 'rating', max: 5 },
              { code: 'H13', name: 'LMS Monitoring', weight: 2, type: 'rating', max: 5 }
            ]
          },
          SF: {
            title: 'Student Feedback',
            kpis: [
              { code: 'SF1', name: 'Student Feedback Score (%)', weight: 20, type: 'number', min: 50, max: 100 }
            ]
          }
        }
      },
      'Level-2': {
        weights: { SA: 0.45, RBA: 0.40, HPE: 0.10, SF: 0.05 },
        sections: {
          SA: {
            title: 'Self Appraisal',
            kpis: [
              { code: 'KPI1', name: 'Online Courses', weight: 2, type: 'dropdown', options: ['5% Topper', 'Elite Gold', 'Elite Silver', 'Elite/>80%', 'NPTEL/60-80%'] },
              { code: 'KPI2', name: 'FDP/STTP', weight: 2, type: 'dropdown', options: ['NIRF/IIT/NIT', 'Anna/Premier', 'Govt/Aided', 'Offline', 'Online'] },
              { code: 'KPI3', name: 'Industry Training', weight: 2, type: 'dropdown', options: ['>5 days', '5 days', '3 days', '2 days', '1 day'] },
              { code: 'KPI4', name: 'PhD Progress', weight: 2, type: 'dropdown', options: ['2 papers published', '1 accepted+1 submitted', 'Survey accepted+submitted', 'Survey submitted', 'PhD Registered'] },
              { code: 'KPI5', name: 'Course File', weight: 2, type: 'dropdown', options: ['Outstanding', 'Positive', 'No negative', 'Some negative', 'Deficiency'] },
              { code: 'KPI6', name: 'Innovative Teaching', weight: 2, type: 'dropdown', options: ['Scopus/SCI published', 'Social media posted', 'Approved+posted', 'Documented LMS', 'Not proper'] },
              { code: 'KPI7', name: 'Student Publication', weight: 2.5, type: 'dropdown', options: ['2 Scopus/Patent pub', '1 Scopus/Patent filed', '2 conference/draft', '1 conference/draft', '1 conference'] },
              { code: 'KPI8', name: 'Product Funding', weight: 2.5, type: 'dropdown', options: ['>50k/TRL 4-5', '20-50k/TRL 3', '5-20k', 'Won', 'Participated'] },
              { code: 'KPI9', name: 'Academic Results (%)', weight: 1, type: 'number', min: 75, max: 100 },
              { code: 'KPI10', name: 'Video Content', weight: 1, type: 'dropdown', options: ['100% 2 COs', '100% 1 CO', '50% 1 CO', '25% 1 CO', 'One video'] },
              { code: 'KPI11', name: 'Social Media', weight: 1, type: 'social', fields: ['connections', 'posts', 'responses'] }
            ]
          },
          RBA: {
            title: 'Review Based Appraisal',
            kpis: [
              { code: 'RPI1', name: 'Subject Knowledge', weight: 1.5, type: 'rating', max: 5 },
              { code: 'RPI2', name: 'Practical Preparedness', weight: 1.5, type: 'rating', max: 5 },
              { code: 'RPI3', name: 'Latest Developments', weight: 1.5, type: 'rating', max: 5 },
              { code: 'RPI4', name: 'GATE Questions', weight: 1.5, type: 'dropdown', options: ['50+', '35-49', '25-34', '15-24', '5-14'] },
              { code: 'RPI5', name: 'Delivery Methods', weight: 2, type: 'rating', max: 5 },
              { code: 'RPI6', name: 'Assessment Tools', weight: 2, type: 'rating', max: 5 },
              { code: 'RPI7', name: 'Library Integration', weight: 2, type: 'rating', max: 5 },
              { code: 'RPI8', name: 'PBL Skills', weight: 2, type: 'rating', max: 5 },
              { code: 'RPI9', name: 'Reading Articles', weight: 2, type: 'rating', max: 5 },
              { code: 'RPI10', name: 'Research Progress', weight: 2, type: 'rating', max: 5 },
              { code: 'RPI11', name: 'Communication', weight: 2, type: 'rating', max: 5 }
            ]
          },
          HPE: {
            title: 'HOD/Principal Evaluation',
            kpis: [
              { code: 'H1', name: 'Academic Achievements (%)', weight: 3.5, type: 'number', min: 50, max: 100 },
              { code: 'H2', name: 'Slow Learners', weight: 2, type: 'dropdown', options: ['All', '50%', '25%', 'Efforts', 'Identified'] },
              { code: 'H3', name: 'Online Courses (%)', weight: 1, type: 'number', min: 0, max: 100 },
              { code: 'H4', name: 'Product Development (%)', weight: 2, type: 'number', min: 0, max: 100 },
              { code: 'H5', name: 'Events', weight: 2, type: 'events', fields: ['participation', 'prizes'] },
              { code: 'H6', name: 'Competency', weight: 1, type: 'dropdown', options: ['3 higher', '2 higher', '3 eligible', '2 eligible', '5 attended'] },
              { code: 'H7', name: 'Career', weight: 3, type: 'dropdown', options: ['100%+contest', '100%+achievement', '100%', '85%', '75%'] },
              { code: 'H8', name: 'Languages', weight: 1, type: 'number', min: 0, max: 10 },
              { code: 'H9', name: 'Entrepreneurship', weight: 1, type: 'dropdown', options: ['Registration', 'MSME', 'ED fund', 'Active', 'Motivating'] },
              { code: 'H10', name: 'Discipline', weight: 2, type: 'rating', max: 5 },
              { code: 'H11', name: 'Interpersonal', weight: 2, type: 'rating', max: 5 },
              { code: 'H12', name: 'Volunteering', weight: 2, type: 'rating', max: 5 },
              { code: 'H13', name: 'LMS', weight: 2, type: 'rating', max: 5 }
            ]
          },
          SF: {
            title: 'Student Feedback',
            kpis: [
              { code: 'SF1', name: 'Student Feedback (%)', weight: 20, type: 'number', min: 50, max: 100 }
            ]
          }
        }
      }
      // Add similar structures for Level-3, Level-4, Level-5, Level-6
    };

    return configs[level] || configs['Level-1'];
  };

  const fetchAppraisals = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/appraisals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAppraisals(data);
    } catch (error) {
      console.error('Error fetching appraisals:', error);
      toast.error('Failed to load appraisals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppraisals();
  }, []);

  const handleKpiChange = (sectionCode, kpiCode, value) => {
    setKpiResponses(prev => ({
      ...prev,
      [`${sectionCode}_${kpiCode}`]: value
    }));
  };

  const handleSocialMediaChange = (sectionCode, kpiCode, field, value) => {
    setKpiResponses(prev => ({
      ...prev,
      [`${sectionCode}_${kpiCode}_${field}`]: value
    }));
  };

  const renderKpiInput = (section, kpi) => {
    const key = `${section}_${kpi.code}`;
    const value = kpiResponses[key] || '';

    switch (kpi.type) {
      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleKpiChange(section, kpi.code, e.target.value)}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select...</option>
            {kpi.options.map((opt, idx) => (
              <option key={idx} value={idx + 1}>{opt}</option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleKpiChange(section, kpi.code, e.target.value)}
            min={kpi.min || 0}
            max={kpi.max || 100}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        );

      case 'rating':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => !isViewMode && handleKpiChange(section, kpi.code, rating)}
                disabled={isViewMode}
                className={`px-4 py-2 rounded-md ${
                  value == rating
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${isViewMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                {rating}
              </button>
            ))}
          </div>
        );

      case 'social':
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Connections</label>
              <input
                type="number"
                value={kpiResponses[`${key}_connections`] || ''}
                onChange={(e) => handleSocialMediaChange(section, kpi.code, 'connections', e.target.value)}
                disabled={isViewMode}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Posts/Year</label>
              <input
                type="number"
                value={kpiResponses[`${key}_posts`] || ''}
                onChange={(e) => handleSocialMediaChange(section, kpi.code, 'posts', e.target.value)}
                disabled={isViewMode}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Responses</label>
              <input
                type="number"
                value={kpiResponses[`${key}_responses`] || ''}
                onChange={(e) => handleSocialMediaChange(section, kpi.code, 'responses', e.target.value)}
                disabled={isViewMode}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        );

      case 'events':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Participation %</label>
              <input
                type="number"
                value={kpiResponses[`${key}_participation`] || ''}
                onChange={(e) => handleSocialMediaChange(section, kpi.code, 'participation', e.target.value)}
                min="0"
                max="100"
                disabled={isViewMode}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prize Winners %</label>
              <input
                type="number"
                value={kpiResponses[`${key}_prizes`] || ''}
                onChange={(e) => handleSocialMediaChange(section, kpi.code, 'prizes', e.target.value)}
                min="0"
                max="100"
                disabled={isViewMode}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const config = getLevelConfig(selectedLevel);
      const payload = {
        appraisal_level: selectedLevel,
        academic_year: academicYear,
        kpi_responses: kpiResponses
      };

      const url = currentAppraisal
        ? `http://localhost:4000/api/appraisals/${currentAppraisal.id}`
        : 'http://localhost:4000/api/appraisals';

      const response = await fetch(url, {
        method: currentAppraisal ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setCalculatedScores(result.scores);
        toast.success(currentAppraisal ? 'Appraisal updated successfully' : 'Appraisal created successfully');
        fetchAppraisals();
        setIsModalOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save appraisal');
      }
    } catch (error) {
      console.error('Error saving appraisal:', error);
      toast.error('Failed to save appraisal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNew = () => {
    setCurrentAppraisal(null);
    setKpiResponses({});
    setCalculatedScores(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (appraisal) => {
    setCurrentAppraisal(appraisal);
    setSelectedLevel(appraisal.appraisal_level);
    setAcademicYear(appraisal.academic_year);
    // Load KPI responses from appraisal
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleEdit = (appraisal) => {
    setCurrentAppraisal(appraisal);
    setSelectedLevel(appraisal.appraisal_level);
    setAcademicYear(appraisal.academic_year);
    // Load KPI responses from appraisal
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (appraisal) => {
    if (window.confirm(`Are you sure you want to delete this appraisal for ${appraisal.academic_year}?`)) {
      try {
        const response = await fetch(`http://localhost:4000/api/appraisals/${appraisal.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          toast.success('Appraisal deleted successfully');
          fetchAppraisals();
        } else {
          toast.error('Failed to delete appraisal');
        }
      } catch (error) {
        console.error('Error deleting appraisal:', error);
        toast.error('Failed to delete appraisal');
      }
    }
  };

  const config = getLevelConfig(selectedLevel);

  const columns = [
    {
      field: 'appraisal_level',
      header: 'Level',
      render: (row) => row.appraisal_level || 'N/A'
    },
    {
      field: 'academic_year',
      header: 'Academic Year',
      render: (row) => row.academic_year || 'N/A'
    },
    {
      field: 'sa_score',
      header: 'SA Score',
      render: (row) => row.sa_score && row.sa_score !== 0 ? Number(row.sa_score).toFixed(2) : 'N/A'
    },
    {
      field: 'rba_score',
      header: 'RBA Score',
      render: (row) => row.rba_score && row.rba_score !== 0 ? Number(row.rba_score).toFixed(2) : 'N/A'
    },
    {
      field: 'hpe_score',
      header: 'HPE Score',
      render: (row) => row.hpe_score && row.hpe_score !== 0 ? Number(row.hpe_score).toFixed(2) : 'N/A'
    },
    {
      field: 'sf_score',
      header: 'SF Score',
      render: (row) => row.sf_score && row.sf_score !== 0 ? Number(row.sf_score).toFixed(2) : 'N/A'
    },
    {
      field: 'fpi_score',
      header: 'FPI',
      render: (row) => row.fpi_score && row.fpi_score !== 0 ? <span className="font-bold">{Number(row.fpi_score).toFixed(2)}</span> : 'N/A'
    },
    {
      field: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.status === 'Approved' ? 'bg-green-100 text-green-800' :
          row.status === 'Rejected' ? 'bg-red-100 text-red-800' :
          row.status === 'Submitted' ? 'bg-indigo-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status || 'Draft'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={handleAddNew}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-blue-800 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          New Appraisal
        </button>
      </div>

      <DataTable
        data={appraisals}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
        emptyMessage="No appraisals found. Click 'New Appraisal' to create one."
      />



      {/* Appraisal Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Appraisal' : currentAppraisal ? 'Edit Appraisal' : 'New Appraisal'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="xl"
      >
        <div className="space-y-6">
          {/* Level and Year Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Faculty Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                disabled={isViewMode || currentAppraisal}
                className="w-full px-3 py-2 border rounded-md"
              >
                {levels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                disabled={isViewMode || currentAppraisal}
                placeholder="2024-25"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Dynamic Sections */}
          {Object.entries(config.sections).map(([sectionCode, sectionData]) => (
            <div key={sectionCode} className="border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-4 text-indigo-700">
                {sectionData.title}
              </h3>
              <div className="space-y-4">
                {sectionData.kpis.map(kpi => (
                  <div key={kpi.code} className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <label className="block font-semibold text-sm">
                        {kpi.code}: {kpi.name}
                      </label>
                      <span className="text-xs bg-indigo-100 text-blue-800 px-2 py-1 rounded">
                        Weight: {kpi.weight}
                      </span>
                    </div>
                    {renderKpiInput(sectionCode, kpi)}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Calculated Scores Display */}
          {calculatedScores && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold mb-4">Calculated Scores</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {calculatedScores.sa_score !== undefined && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">SA Score</div>
                    <div className="text-2xl font-bold text-indigo-700">
                      {calculatedScores.sa_score.toFixed(2)}
                    </div>
                  </div>
                )}
                {calculatedScores.rba_score !== undefined && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">RBA Score</div>
                    <div className="text-2xl font-bold text-green-700">
                      {calculatedScores.rba_score.toFixed(2)}
                    </div>
                  </div>
                )}
                {calculatedScores.hpe_score !== undefined && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">HPE Score</div>
                    <div className="text-2xl font-bold text-indigo-700">
                      {calculatedScores.hpe_score.toFixed(2)}
                    </div>
                  </div>
                )}
                {calculatedScores.sf_score !== undefined && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">SF Score</div>
                    <div className="text-2xl font-bold text-yellow-700">
                      {calculatedScores.sf_score.toFixed(2)}
                    </div>
                  </div>
                )}
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-500 p-4 rounded-lg text-white">
                  <div className="text-sm">Final FPI</div>
                  <div className="text-2xl font-bold">
                    {calculatedScores.fpi_score.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* KPI-wise breakdown */}
              <div className="mt-6">
                <h4 className="font-semibold mb-2">KPI-wise Scores:</h4>
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">KPI</th>
                        <th className="px-4 py-2 text-right">Input</th>
                        <th className="px-4 py-2 text-right">Scale (1-5)</th>
                        <th className="px-4 py-2 text-right">Weight</th>
                        <th className="px-4 py-2 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedScores.kpi_details?.map((kpi, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-4 py-2">{kpi.kpi_code}</td>
                          <td className="px-4 py-2 text-right">{kpi.input_display}</td>
                          <td className="px-4 py-2 text-right">{kpi.scaling_score}</td>
                          <td className="px-4 py-2 text-right">{kpi.weight_factor}</td>
                          <td className="px-4 py-2 text-right font-semibold">{kpi.weighted_score.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default FacultyAppraisalPage;