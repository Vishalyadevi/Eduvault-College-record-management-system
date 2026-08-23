import React, { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getFundingAgencies,
  createFundingAgency,
  getCertificationCourses,
  createCertificationCourse,
  getEventTypes,
  createEventType
} from '../services/api';

const MasterSelect = ({
  label,
  name,
  value,
  onChange,
  masterType = 'funding-agency',
  displayField = 'agency_name',
  required = false,
  disabled = false,
  placeholder = 'Select option...',
  className = ''
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemProvider, setNewItemProvider] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');

  const fetchMasterOptions = async () => {
    try {
      setLoading(true);
      let response;
      if (masterType === 'funding-agency') response = await getFundingAgencies({ status: 'Active' });
      else if (masterType === 'certification-course') response = await getCertificationCourses({ status: 'Active' });
      else if (masterType === 'event-type') response = await getEventTypes({ status: 'Active' });
      const list = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : Array.isArray(response?.data?.data) ? response.data.data : [];
      const mapped = list.map((item) => {
        const optionValue = item[displayField] || item.agency_name || item.course_name || item.type_name || item.name;
        return { value: optionValue, label: masterType === 'certification-course' && item.provider ? `${optionValue} (${item.provider})` : optionValue };
      });
      if (value && !mapped.some((option) => option.value === value)) mapped.push({ value, label: value });
      setOptions(mapped);
    } catch (error) {
      console.error(`Error fetching master options for ${masterType}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMasterOptions(); }, [masterType]);
  useEffect(() => {
    if (!isAddModalOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen]);
  useEffect(() => {
    if (value && !options.some((option) => option.value === value)) setOptions((previous) => [...previous, { value, label: value }]);
  }, [value]);

  const handleCreateNewMaster = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    const trimmedName = newItemName.trim();
    if (!trimmedName) {
      toast.error('Please enter a name for the new master item');
      return;
    }
    const duplicate = options.some((option) => option.value.toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      toast.error(`"${trimmedName}" already exists in ${label || 'master'}`);
      onChange({ target: { name, value: trimmedName } });
      setIsAddModalOpen(false);
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = { status: 'Active', description: newItemDescription.trim() || null };
      if (masterType === 'funding-agency') {
        payload.agency_name = trimmedName;
        await createFundingAgency(payload);
      } else if (masterType === 'certification-course') {
        payload.course_name = trimmedName;
        payload.provider = newItemProvider.trim() || null;
        await createCertificationCourse(payload);
      } else if (masterType === 'event-type') {
        payload.type_name = trimmedName;
        await createEventType(payload);
      }
      toast.success(`Successfully added "${trimmedName}" to ${label || 'master list'}`);
      setOptions((previous) => [...previous, { value: trimmedName, label: newItemProvider ? `${trimmedName} (${newItemProvider.trim()})` : trimmedName }]);
      onChange({ target: { name, value: trimmedName } });
      setIsAddModalOpen(false);
      setNewItemName('');
      setNewItemProvider('');
      setNewItemDescription('');
      fetchMasterOptions();
    } catch (error) {
      console.error('Error creating new master item:', error);
      toast.error(error.response?.data?.message || 'Failed to save new master item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectChange = (event) => {
    if (event.target.value === '__ADD_NEW__') setIsAddModalOpen(true);
    else onChange(event);
  };
  const handleKeyDownInput = (event) => {
    if (event.key === 'Enter') handleCreateNewMaster(event);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <div className="flex justify-between items-center"><label className="block text-sm font-semibold text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>{!disabled && <button type="button" onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none" title={`Add new ${label}`}><Plus size={13} />Add New</button>}</div>}
      <select name={name} value={value || ''} onChange={handleSelectChange} required={required} disabled={disabled || loading} className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm transition-all">
        <option value="">{loading ? 'Loading options...' : placeholder}</option>
        {options.map((option, index) => <option key={`${option.value}-${index}`} value={option.value}>{option.label}</option>)}
        {!disabled && <option value="__ADD_NEW__">+ Add New {label || 'Option'}...</option>}
      </select>
      {isAddModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn" onClick={(event) => event.stopPropagation()}><div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100"><div className="flex justify-between items-center pb-3 border-b border-gray-100"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Plus className="text-indigo-600" size={20} />Add New {label || 'Master Item'}</h3><button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} /></button></div><div className="mt-4 space-y-4"><div><label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Name <span className="text-red-500">*</span></label><input type="text" value={newItemName} onChange={(event) => setNewItemName(event.target.value)} onKeyDown={handleKeyDownInput} placeholder={`Enter ${label || 'master name'}...`} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus required /></div>{masterType === 'certification-course' && <div><label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Provider / Organization</label><input type="text" value={newItemProvider} onChange={(event) => setNewItemProvider(event.target.value)} onKeyDown={handleKeyDownInput} placeholder="e.g. NPTEL, SWAYAM, Coursera" className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>}<div><label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Description (Optional)</label><textarea value={newItemDescription} onChange={(event) => setNewItemDescription(event.target.value)} placeholder="Enter optional description..." rows="2" className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div><div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-100"><button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button><button type="button" onClick={handleCreateNewMaster} disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50">{isSubmitting ? 'Saving...' : <><Check size={16} />Save &amp; Select</>}</button></div></div></div></div>}
    </div>
  );
};

export default MasterSelect;
