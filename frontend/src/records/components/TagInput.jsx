import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const TagInput = ({
  label = 'Authors',
  values = [],
  onChange,
  placeholder = 'Type name and click Add...',
  buttonText = 'Add Author',
  disabled = false,
  required = false,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');

  const currentTags = Array.isArray(values)
    ? values
    : (typeof values === 'string' && values.trim()
      ? values.split(',').map(s => s.trim()).filter(Boolean)
      : []);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newItems = inputValue.split(',').map(s => s.trim()).filter(Boolean);
    const updated = [...currentTags, ...newItems];
    setInputValue('');
    if (onChange) onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = currentTags.filter((_, i) => i !== index);
    if (onChange) onChange(updated);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent bg-white flex flex-wrap items-center gap-2 min-h-[46px] shadow-sm">
        {currentTags.map((tag, index) => (
          <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-200">
            <span>{tag}</span>
            {!disabled && <button type="button" onClick={() => handleRemove(index)} className="hover:text-red-600 focus:outline-none transition-colors" title="Remove"><X size={14} /></button>}
          </span>
        ))}
        {!disabled && (
          <div className="flex-1 flex items-center gap-2 min-w-[220px]">
            <input type="text" value={inputValue} onChange={(event) => setInputValue(event.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} className="flex-1 px-2 py-1 text-sm border-none focus:outline-none text-gray-800 placeholder-gray-400 bg-transparent" />
            <button type="button" onClick={handleAdd} className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1 flex-shrink-0"><Plus size={14} />{buttonText}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;
