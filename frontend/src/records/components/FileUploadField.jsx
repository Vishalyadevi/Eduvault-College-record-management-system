import React, { useRef } from 'react';
import { Upload, FileText, CheckCircle2, Eye, X } from 'lucide-react';

const FileUploadField = ({
  label = 'Proof Document',
  name = 'file',
  accept = '.pdf,.png,.jpg,.jpeg',
  value = null,
  onChange,
  onClear,
  required = false,
  disabled = false,
  hint = 'PDF, PNG, JPG up to 10MB',
  className = ''
}) => {
  const inputRef = useRef(null);
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && onChange) onChange(file, name);
  };
  const handleClear = (event) => {
    event.stopPropagation();
    if (inputRef.current) inputRef.current.value = '';
    if (onClear) onClear(name);
    else if (onChange) onChange(null, name);
  };
  const fileName = !value ? '' : typeof value === 'string' ? value.split(/[/\\]/).pop() : value.name || 'Selected Document';
  const isExistingUrl = typeof value === 'string' && value.length > 0;
  const isSelectedFile = value && typeof value === 'object';
  const fileUrl = isExistingUrl ? (value.startsWith('http') ? value : `http://localhost:5600/${value}`) : '';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-sm font-semibold text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div className="relative">
        <input ref={inputRef} type="file" name={name} accept={accept} onChange={handleFileSelect} disabled={disabled} className="hidden" id={`file-upload-${name}`} />
        {disabled ? <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"><div className="flex items-center gap-2 overflow-hidden"><FileText size={18} className="text-indigo-600 flex-shrink-0" /><span className="text-sm font-medium text-gray-700 truncate">{fileName || 'No document uploaded'}</span></div>{isExistingUrl && <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"><Eye size={14} />View</a>}</div> : <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg hover:border-indigo-400 transition-colors shadow-sm"><label htmlFor={`file-upload-${name}`} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-semibold rounded-md cursor-pointer transition-all shadow-sm active:scale-95 flex-shrink-0"><Upload size={16} />Choose File</label><div className="flex-1 flex items-center justify-between min-w-0 px-2">{isSelectedFile || isExistingUrl ? <div className="flex items-center gap-2 overflow-hidden"><CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" /><span className="text-sm font-medium text-gray-800 truncate" title={fileName}>{fileName}</span></div> : <span className="text-sm text-gray-400 font-normal italic">No file chosen</span>}<div className="flex items-center gap-1.5 ml-2">{isExistingUrl && <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors" title="View uploaded document"><Eye size={16} /></a>}{(isSelectedFile || isExistingUrl) && <button type="button" onClick={handleClear} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Remove file"><X size={16} /></button>}</div></div></div>}
      </div>
      {hint && !disabled && <p className="text-xs text-gray-500 font-normal">{hint}</p>}
    </div>
  );
};

export default FileUploadField;
