import React, { useState } from 'react';
import { Eye, Pencil, Trash2, Plus, X, Search, Filter, Download, ChevronUp, ChevronDown, User } from 'lucide-react';

// FormField Component
const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = '',
  options = [],
  rows = 3,
  error = '',
  disabled = false,
}) => {
  const renderField = () => {
    const baseClasses = "w-full p-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition-all duration-300 bg-gray-50 focus:bg-white";
    
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={`${baseClasses} resize-none custom-scrollbar`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4f46e5 #f3f4f6'
            }}
          />
        );
      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={baseClasses}
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              id={name}
              name={name}
              type="checkbox"
              checked={value || false}
              onChange={onChange}
              disabled={disabled}
              className="h-4 w-4 text-indigo-600 border-2 border-gray-300 rounded focus:ring-indigo-500 transition-all duration-200"
            />
            <label htmlFor={name} className="ml-2 text-sm text-gray-700 font-medium">
              {label}
            </label>
          </div>
        );
      default:
        return (
          <input
            id={name}
            name={name}
            type={type}
            value={value || ''}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            className={baseClasses}
          />
        );
    }
  };

  return (
    <div className="mb-5">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
      `}</style>
      
      {type !== 'checkbox' && (
        <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500 text-base">*</span>}
        </label>
      )}
      {renderField()}
      {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};


export default FormField;