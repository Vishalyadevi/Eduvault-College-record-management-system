import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const YearPicker = ({
  label = 'Select Year',
  name = 'year',
  value = '',
  onChange,
  required = false,
  disabled = false,
  placeholder = 'Select Year',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const initialYear = Number(value) || currentYear;
  const [startYear, setStartYear] = useState(Math.floor(initialYear / 12) * 12);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const year = Number(value);
      if (!isNaN(year)) setStartYear(Math.floor(year / 12) * 12);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectYear = (year) => {
    if (disabled) return;
    if (onChange) onChange({ target: { name, value: year } });
    setIsOpen(false);
  };

  const handleClear = (event) => {
    event.stopPropagation();
    if (onChange) onChange({ target: { name, value: '' } });
  };

  const yearGrid = Array.from({ length: 12 }, (_, index) => startYear + index);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-sm font-semibold text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`flex items-center justify-between px-3 py-2 border rounded-md shadow-sm bg-white cursor-pointer transition-colors ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500 border-gray-300' : 'hover:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500 border-gray-300'}`}>
        <div className="flex items-center gap-2 overflow-hidden"><Calendar size={18} className="text-indigo-600 flex-shrink-0" /><span className={`text-sm ${value ? 'font-medium text-gray-800' : 'text-gray-400'}`}>{value || placeholder}</span></div>
        <div className="flex items-center gap-1">{value && !disabled && <button type="button" onClick={handleClear} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors" title="Clear year"><X size={14} /></button>}</div>
      </div>
      {isOpen && !disabled && <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-3 px-1 pb-2 border-b border-gray-100">
          <button type="button" onClick={(event) => { event.stopPropagation(); setStartYear((previous) => previous - 12); }} className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Previous decade"><ChevronLeft size={18} /></button>
          <span className="text-sm font-bold text-gray-800">{startYear} - {startYear + 11}</span>
          <button type="button" onClick={(event) => { event.stopPropagation(); setStartYear((previous) => previous + 12); }} className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Next decade"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">{yearGrid.map((year) => {
          const isSelected = Number(value) === year;
          const isCurrent = currentYear === year;
          return <button key={year} type="button" onClick={() => handleSelectYear(year)} className={`py-2 text-sm font-semibold rounded-lg transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-105' : isCurrent ? 'border border-indigo-300 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100' : 'text-gray-700 hover:bg-gray-100'}`}>{year}</button>;
        })}</div>
      </div>}
    </div>
  );
};

export default YearPicker;
