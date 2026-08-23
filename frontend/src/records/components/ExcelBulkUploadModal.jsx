import React, { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, FileSpreadsheet, X, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

const getColumnLetter = (colIdx) => {
  let temp = colIdx;
  let letter = '';
  while (temp > 0) {
    let mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
};

export const parseFlexDate = (val) => {
  if (val === undefined || val === null || val === '') return null;

  if (val instanceof Date && !isNaN(val.getTime())) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  if (typeof val === 'number') {
    if (val >= 1900 && val <= 2100) return `${val}-01-01`;
    if (val >= 0 && val <= 99) {
      const fullYear = val > 50 ? 1900 + val : 2000 + val;
      return `${fullYear}-01-01`;
    }
    if (val > 25567 && val < 100000) {
      const jsDate = new Date((val - (25567 + 2)) * 86400 * 1000);
      if (!isNaN(jsDate.getTime())) {
        const yyyy = jsDate.getFullYear();
        const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
        const dd = String(jsDate.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
  }

  const str = String(val).trim();
  if (!str) return null;
  if (/^\d{4}$/.test(str)) return `${str}-01-01`;
  if (/^\d{2}$/.test(str)) {
    const yr = parseInt(str, 10);
    return `${yr > 50 ? 1900 + yr : 2000 + yr}-01-01`;
  }

  const monthMap = {
    jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
    apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07',
    aug: '08', august: '08', sep: '09', sept: '09', september: '09', oct: '10',
    october: '10', nov: '11', november: '11', dec: '12', december: '12',
  };
  const monthYearRegex = /^([a-z]{3,9})[\s\/\-\,]+(\d{2}|\d{4})$/i;
  const yearMonthRegex = /^(\d{2}|\d{4})[\s\/\-\,]+([a-z]{3,9})$/i;
  let match = str.match(monthYearRegex);
  if (match) {
    const month = monthMap[match[1].toLowerCase()];
    let year = match[2];
    if (month) {
      if (year.length === 2) {
        const numericYear = parseInt(year, 10);
        year = String(numericYear > 50 ? 1900 + numericYear : 2000 + numericYear);
      }
      return `${year}-${month}-01`;
    }
  }
  match = str.match(yearMonthRegex);
  if (match) {
    let year = match[1];
    const month = monthMap[match[2].toLowerCase()];
    if (month) {
      if (year.length === 2) {
        const numericYear = parseInt(year, 10);
        year = String(numericYear > 50 ? 1900 + numericYear : 2000 + numericYear);
      }
      return `${year}-${month}-01`;
    }
  }

  match = str.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const month = String(parseInt(match[1], 10)).padStart(2, '0');
    if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12) return `${match[2]}-${month}-01`;
  }
  match = str.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (match) {
    const month = String(parseInt(match[2], 10)).padStart(2, '0');
    if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12) return `${match[1]}-${month}-01`;
  }
  match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const day = String(parseInt(match[1], 10)).padStart(2, '0');
    const month = String(parseInt(match[2], 10)).padStart(2, '0');
    if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
      return `${match[3]}-${month}-${day}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    if (yyyy >= 1900 && yyyy <= 2100) return `${yyyy}-${mm}-${dd}`;
    if (yyyy < 1920) {
      const recoveredYear = Math.round((parsed.getTime() / (86400 * 1000)) + 25567 + 2);
      if (recoveredYear >= 1990 && recoveredYear <= 2100) return `${recoveredYear}-01-01`;
    }
  }
  return null;
};

const ExcelBulkUploadModal = ({
  isOpen,
  onClose,
  title = 'Bulk Excel Upload',
  columns = [],
  onUpload,
  templateFilename = 'Template.xlsx',
  hasChooseFileField = true,
}) => {
  const hasFileColumns = Boolean(hasChooseFileField || columns.some((col) => col.type === 'file' || /proof|document|file|certificate|report|photo|copy/i.test(col.key || col.label)));
  const [file, setFile] = useState(null);
  const [validRows, setValidRows] = useState([]);
  const [errorList, setErrorList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const templateSheet = workbook.addWorksheet('Template');
      const proofNote = 'If a supporting document/proof is required, complete the Bulk Upload first. After the record is created, use the Edit option to upload the document through the corresponding Choose File field.';
      let headerRowIndex = 1;

      if (hasFileColumns) {
        const lastColLetter = getColumnLetter(Math.max(columns.length, 1));
        templateSheet.mergeCells(`A1:${lastColLetter}1`);
        const noteCell = templateSheet.getCell('A1');
        noteCell.value = `NOTE: ${proofNote}`;
        noteCell.font = { italic: true, bold: true, color: { argb: 'FF92400E' }, size: 10 };
        noteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        noteCell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
        templateSheet.getRow(1).height = 42;
        headerRowIndex = 2;
        const instructionsSheet = workbook.addWorksheet('Instructions');
        instructionsSheet.getColumn('A').width = 115;
        const titleCell = instructionsSheet.getCell('A1');
        titleCell.value = 'Bulk Upload - Supporting Document / Proof Instructions';
        titleCell.font = { bold: true, size: 12, color: { argb: 'FF4F46E5' } };
        const instructionCell = instructionsSheet.getCell('A3');
        instructionCell.value = proofNote;
        instructionCell.font = { size: 11, italic: true };
        instructionCell.alignment = { wrapText: true };
        instructionsSheet.getRow(3).height = 45;
      }

      const headers = columns.map((col) => (col.required ? `${col.label} *` : col.label));
      const sampleRow = columns.map((col) => col.example || (col.type === 'file' ? 'proof_document.pdf' : ''));
      templateSheet.addRow(headers);
      templateSheet.addRow(sampleRow);
      const headerRow = templateSheet.getRow(headerRowIndex);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      columns.forEach((col, index) => {
        templateSheet.getColumn(getColumnLetter(index + 1)).width = Math.max(col.label.length + 6, 22);
      });

      const masterColumns = columns.filter((col) => Array.isArray(col.options) && col.options.length > 0);
      if (masterColumns.length > 0) {
        const masterSheet = workbook.addWorksheet('Master Data');
        masterColumns.forEach((col, colIndex) => {
          const masterColLetter = getColumnLetter(colIndex + 1);
          masterSheet.getCell(`${masterColLetter}1`).value = col.label;
          masterSheet.getCell(`${masterColLetter}1`).font = { bold: true };
          col.options.forEach((option, optionIndex) => {
            masterSheet.getCell(`${masterColLetter}${optionIndex + 2}`).value = String(option);
          });
          const templateColIndex = columns.findIndex((item) => item.key === col.key) + 1;
          const templateColLetter = getColumnLetter(templateColIndex);
          const maxOptionRow = Math.max(col.options.length + 1, 2);
          for (let row = headerRowIndex + 1; row <= 1000; row += 1) {
            templateSheet.getCell(`${templateColLetter}${row}`).dataValidation = {
              type: 'list', allowBlank: !col.required,
              formulae: [`'Master Data'!$${masterColLetter}$2:$${masterColLetter}$${maxOptionRow}`],
              showErrorMessage: !col.isDynamicMaster, errorTitle: 'Invalid Selection',
              error: col.isDynamicMaster ? undefined : `Please select a valid option from the dropdown list. Allowed options: ${col.options.slice(0, 5).join(', ')}...`,
            };
          }
        });
      }
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), templateFilename);
      toast.success('Template with dynamic Excel dropdowns downloaded successfully!');
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleDownloadErrorReport = () => {
    if (errorList.length === 0) {
      toast.error('No validation errors to export');
      return;
    }
    try {
      const rows = [['Row #', 'Field Name', 'Invalid Value', 'Reason / Violation', 'Expected Value'], ...errorList.map((error) => [`Row ${error.row}`, error.field, String(error.value ?? ''), error.reason, error.expected || 'N/A'])];
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = [{ wch: 10 }, { wch: 22 }, { wch: 25 }, { wch: 35 }, { wch: 30 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation Errors');
      XLSX.writeFile(workbook, 'Upload_Validation_Error_Report.xlsx');
      toast.success('Validation Error Report downloaded');
    } catch (error) {
      console.error('Error generating error report:', error);
      toast.error('Failed to download error report');
    }
  };

  const validateData = (rawJson, isRevalidation = false) => {
    if (!rawJson || rawJson.length === 0) return;
    let headerRowIdx = 0;
    let maxMatches = -1;
    for (let rowIndex = 0; rowIndex < Math.min(rawJson.length, 10); rowIndex += 1) {
      const row = rawJson[rowIndex];
      if (!Array.isArray(row)) continue;
      let matches = 0;
      columns.forEach((col) => {
        const label = col.label.replace(/\s*\*/, '').trim().toLowerCase();
        const key = col.key.toLowerCase();
        if (row.some((cell) => (typeof cell === 'string' || typeof cell === 'number') && [label, key].includes(String(cell).replace(/\s*\*/, '').trim().toLowerCase()))) matches += 1;
      });
      if (matches > maxMatches && matches > 0) {
        maxMatches = matches;
        headerRowIdx = rowIndex;
      }
    }
    const rawHeaders = rawJson[headerRowIdx] || [];
    const headerMap = {};
    columns.forEach((col) => {
      const label = col.label.replace(/\s*\*/, '').trim().toLowerCase();
      const index = rawHeaders.findIndex((header) => typeof header === 'string' && [label, col.key.toLowerCase()].includes(header.replace(/\s*\*/, '').trim().toLowerCase()));
      if (index !== -1) headerMap[col.key] = index;
    });

    const validList = [];
    const errors = [];
    rawJson.slice(headerRowIdx + 1).forEach((row, rowIndex) => {
      const excelRowNum = rowIndex + headerRowIdx + 2;
      if (!row || row.every((value) => value === undefined || value === null || String(value).trim() === '')) return;
      const firstCell = String(row[0] || '').trim();
      if (firstCell.startsWith('NOTE:') || firstCell.startsWith('If a supporting document')) return;
      const rowObject = {};
      let rowHasError = false;
      columns.forEach((col) => {
        const columnIndex = headerMap[col.key];
        let value = columnIndex !== undefined ? row[columnIndex] : undefined;
        if (typeof value === 'string') value = value.trim();
        if (col.required && (value === undefined || value === null || value === '')) {
          errors.push({ row: excelRowNum, field: col.label, value: value ?? 'Empty', reason: `Field "${col.label}" is required`, expected: 'Required non-empty value' });
          rowHasError = true;
          return;
        }
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(col.options) && col.options.length > 0) {
            const matchedOption = col.options.find((option) => String(option).toLowerCase() === String(value).toLowerCase());
            if (!matchedOption && !col.isDynamicMaster) {
              errors.push({ row: excelRowNum, field: col.label, value, reason: `Invalid dropdown selection for field "${col.label}"`, expected: col.options.slice(0, 5).join(' / ') + (col.options.length > 5 ? ' ...' : '') });
              rowHasError = true;
              return;
            }
            if (matchedOption) value = matchedOption;
          }
          if (col.type === 'number') {
            const number = Number(value);
            if (isNaN(number)) {
              errors.push({ row: excelRowNum, field: col.label, value, reason: 'Must be a valid numeric value', expected: 'Number (e.g. 100)' });
              rowHasError = true;
              return;
            }
            value = number;
          } else if (col.type === 'date') {
            const parsedDate = parseFlexDate(value);
            if (!parsedDate) {
              errors.push({ row: excelRowNum, field: col.label, value, reason: 'Invalid date format', expected: 'YYYY-MM-DD, Month-Year (e.g. Nov-24), or Year (e.g. 2025)' });
              rowHasError = true;
              return;
            }
            value = parsedDate;
          } else if (col.type === 'file') {
            value = value || '';
          }
        }
        rowObject[col.key] = value !== undefined ? value : '';
      });
      if (!rowHasError) validList.push(rowObject);
    });
    setValidRows(validList);
    setErrorList(errors);
    if (!isRevalidation) {
      if (errors.length === 0 && validList.length > 0) toast.success(`Validated ${validList.length} rows cleanly without errors!`);
      else if (errors.length > 0) toast.error(`Found ${errors.length} validation errors in uploaded sheet`);
    }
  };

  const handleFileSelect = (uploadedFile) => {
    if (!uploadedFile) return;
    if (!['.xlsx', '.xls', '.csv'].some((extension) => uploadedFile.name.toLowerCase().endsWith(extension))) {
      toast.error('Please upload a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }
    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(new Uint8Array(event.target.result), { type: 'array', cellDates: false, raw: false });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
        if (!rawJson || rawJson.length < 2) {
          toast.error('The uploaded sheet is empty or missing headers');
          return;
        }
        validateData(rawJson);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast.error('Failed to read Excel file. Please ensure it is not corrupted.');
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleReset = () => {
    setFile(null);
    setValidRows([]);
    setErrorList([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      toast.error('No valid rows available to save');
      return;
    }
    try {
      setIsSubmitting(true);
      await onUpload(validRows);
      toast.success(`Saved ${validRows.length} valid records to the database!`);
      handleReset();
      onClose();
    } catch (error) {
      console.error('Error saving bulk records:', error);
      const serverMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save bulk records';
      const details = error.response?.data?.details;
      toast.error(Array.isArray(details) && details.length > 0 ? `${serverMessage}: ${details.join('; ')}` : serverMessage, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-gray-100">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2.5"><FileSpreadsheet className="text-indigo-600" size={24} /><h2 className="text-lg font-bold text-gray-900">{title}</h2></div>
          <button onClick={() => { handleReset(); onClose(); }} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {hasFileColumns && <div className="bg-amber-50/90 border border-amber-200 border-l-4 border-l-amber-500 p-4 rounded-xl shadow-2xs"><div className="flex items-start gap-3"><AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} /><div><h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Supporting Document / Proof Upload Notice</h4><p className="text-xs text-amber-800 font-medium mt-1 leading-relaxed">If a supporting document/proof is required, complete the Bulk Upload first. After the record is created, use the Edit option to upload the document through the corresponding Choose File field.</p></div></div></div>}
          <div className="flex flex-wrap justify-between items-center gap-4 bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl"><div><h4 className="text-sm font-bold text-indigo-950">Step 1: Download Standard Template</h4><p className="text-xs text-indigo-700 mt-0.5">Download pre-formatted Excel template with correct column names &amp; sample data. Fill in record details and upload the Excel file below.</p></div><button type="button" onClick={handleDownloadTemplate} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 shadow-sm transition-all"><Download size={15} />Download Excel Template</button></div>
          <div><h4 className="text-sm font-bold text-gray-900 mb-2">Step 2: Upload Filled Excel File</h4><div onDragOver={(event) => { event.preventDefault(); setIsDragActive(true); }} onDragLeave={() => setIsDragActive(false)} onDrop={(event) => { event.preventDefault(); setIsDragActive(false); if (event.dataTransfer.files?.[0]) handleFileSelect(event.dataTransfer.files[0]); }} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-indigo-500 bg-indigo-50/50' : file ? 'border-green-300 bg-green-50/30' : 'border-gray-300 hover:border-indigo-400 bg-gray-50/30'}`}><input ref={fileInputRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={(event) => event.target.files?.[0] && handleFileSelect(event.target.files[0])} /><Upload className={`mx-auto mb-2 ${file ? 'text-green-600' : 'text-indigo-500'}`} size={28} />{file ? <div><p className="text-sm font-bold text-gray-800">{file.name}</p><p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB - Click or drag to replace</p></div> : <div><p className="text-sm font-semibold text-gray-700">Click to browse or drag &amp; drop Excel file here</p><p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, and .csv formats</p></div>}</div></div>
          {file && <div className="flex gap-4"><div className="flex-1 bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-3"><CheckCircle className="text-green-600" size={20} /><div><span className="text-xs font-semibold text-green-800 uppercase tracking-wider">Valid Rows</span><p className="text-lg font-bold text-green-900">{validRows.length}</p></div></div><div className="flex-1 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-3"><AlertTriangle className="text-red-600" size={20} /><div><span className="text-xs font-semibold text-red-800 uppercase tracking-wider">Validation Errors</span><p className="text-lg font-bold text-red-900">{errorList.length}</p></div></div></div>}
          {errorList.length > 0 && <div className="space-y-2"><div className="flex justify-between items-center"><h4 className="text-sm font-bold text-red-700 flex items-center gap-1.5"><AlertTriangle size={16} />Validation Error Details ({errorList.length})</h4><button type="button" onClick={handleDownloadErrorReport} className="px-3 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md flex items-center gap-1 transition-all"><Download size={13} />Download Error Report (.xlsx)</button></div><div className="border border-red-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto"><table className="w-full text-left text-xs"><thead className="bg-red-100/70 text-red-900 font-bold sticky top-0"><tr><th className="px-3 py-2">Row #</th><th className="px-3 py-2">Field</th><th className="px-3 py-2">Invalid Value</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Expected Value</th></tr></thead><tbody className="divide-y divide-red-100 bg-white">{errorList.map((error, index) => <tr key={index} className="hover:bg-red-50/50"><td className="px-3 py-2 font-bold text-red-800">Row {error.row}</td><td className="px-3 py-2 font-semibold text-gray-800">{error.field}</td><td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{String(error.value)}</td><td className="px-3 py-2 text-red-600 font-medium">{error.reason}</td><td className="px-3 py-2 text-indigo-700 font-medium max-w-[160px] truncate">{error.expected || 'N/A'}</td></tr>)}</tbody></table></div></div>}
        </div>
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl"><button type="button" onClick={handleReset} disabled={!file || isSubmitting} className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 flex items-center gap-1 disabled:opacity-40"><RefreshCw size={14} />Reset</button><div className="flex gap-3"><button type="button" onClick={() => { handleReset(); onClose(); }} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button><button type="button" onClick={handleSubmit} disabled={validRows.length === 0 || isSubmitting} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Saving Records...' : <><Upload size={16} />Save {validRows.length} Valid Records</>}</button></div></div>
      </div>
    </div>
  );
};

export default ExcelBulkUploadModal;
