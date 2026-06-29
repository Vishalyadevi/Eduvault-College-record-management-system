import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileSpreadsheet, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import manageStaffService from '../../../services/manageStaffService';
import { showErrorToast, showSuccessToast } from '../../../utils/swalConfig';

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const normalizePerson = (value) =>
  normalize(
    String(value || '')
      .replace(/\(cc\)/gi, '')
      .replace(/\/.*/g, '')
      .replace(/\b(dr|mr|ms|mrs|prof)\.?\s*/gi, '')
  );

const pickValue = (row, aliases) => {
  const keys = Object.keys(row);
  const normalizedAliases = aliases.map(normalize);
  const key = keys.find((item) => normalizedAliases.includes(normalize(item)));
  return key ? String(row[key] || '').trim() : '';
};

const getDirectChildren = (node, localName) =>
  Array.from(node.childNodes || []).filter((child) => child.localName === localName);

const getNodeText = (node) =>
  Array.from(node.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 't'))
    .map((item) => item.textContent || '')
    .join('')
    .trim();

const getCellLines = (cell) => {
  const paragraphs = getDirectChildren(cell, 'p')
    .map(getNodeText)
    .map((text) => text.trim())
    .filter(Boolean);
  return paragraphs.length ? paragraphs : [getNodeText(cell)].filter(Boolean);
};

const readUint16 = (view, offset) => view.getUint16(offset, true);
const readUint32 = (view, offset) => view.getUint32(offset, true);

const inflateRaw = async (bytes) => {
  if (!('DecompressionStream' in window)) {
    throw new Error('This browser cannot decompress Word files. Please use Chrome/Edge or upload Excel/CSV.');
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const extractDocxEntry = async (arrayBuffer, entryName) => {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  let eocdOffset = -1;

  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (readUint32(view, offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset === -1) throw new Error('Invalid Word file.');

  const centralDirSize = readUint32(view, eocdOffset + 12);
  const centralDirOffset = readUint32(view, eocdOffset + 16);
  const decoder = new TextDecoder('utf-8');
  let offset = centralDirOffset;

  while (offset < centralDirOffset + centralDirSize) {
    if (readUint32(view, offset) !== 0x02014b50) break;

    const method = readUint16(view, offset + 10);
    const compressedSize = readUint32(view, offset + 20);
    const fileNameLength = readUint16(view, offset + 28);
    const extraLength = readUint16(view, offset + 30);
    const commentLength = readUint16(view, offset + 32);
    const localHeaderOffset = readUint32(view, offset + 42);
    const fileName = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength));

    if (fileName === entryName) {
      const localNameLength = readUint16(view, localHeaderOffset + 26);
      const localExtraLength = readUint16(view, localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);

      if (method === 0) return compressed;
      if (method === 8) return inflateRaw(compressed);
      throw new Error('Unsupported Word compression method.');
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error('Could not find document.xml inside Word file.');
};

const parseDocxRows = async (file) => {
  const data = await file.arrayBuffer();
  const xmlBytes = await extractDocxEntry(data, 'word/document.xml');
  const xmlText = new TextDecoder('utf-8').decode(xmlBytes);
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
  const tables = Array.from(xml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'tbl'));
  const rows = [];

  tables.forEach((table) => {
    const tableRows = getDirectChildren(table, 'tr').map((row) =>
      getDirectChildren(row, 'tc').map((cell) => ({
        text: getNodeText(cell),
        lines: getCellLines(cell),
      }))
    );

    const headerIndex = tableRows.findIndex((row) => {
      const labels = row.map((cell) => normalize(cell.text));
      return labels.includes('coursecode') && labels.includes('staffallotted');
    });

    if (headerIndex === -1) return;

    const header = tableRows[headerIndex].map((cell) => normalize(cell.text));
    const courseCodeIndex = header.indexOf('coursecode');
    const courseNameIndex = header.findIndex((label) => ['coursetitle', 'coursename', 'subjectname'].includes(label));
    const staffIndex = header.indexOf('staffallotted');

    tableRows.slice(headerIndex + 1).forEach((row, rowIndex) => {
      const courseCode = row[courseCodeIndex]?.text || '';
      const courseName = row[courseNameIndex]?.text || '';
      const staffLines = row[staffIndex]?.lines || [];

      staffLines.forEach((staffName, staffIndexInCell) => {
        rows.push({
          rowNumber: `${headerIndex + rowIndex + 2}.${staffIndexInCell + 1}`,
          staffId: '',
          staffName,
          department: '',
          courseCode,
          courseName,
        });
      });
    });
  });

  return rows.filter((row) => row.staffName && (row.courseCode || row.courseName));
};

const parseSpreadsheetRows = async (file) => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

  return rows
    .map((row, index) => ({
      rowNumber: index + 2,
      staffId: pickValue(row, ['staff id', 'staffid', 'staff number', 'staffnumber', 'user number', 'usernumber']),
      staffName: pickValue(row, ['staff name', 'staffname', 'faculty name', 'facultyname', 'name', 'staff allotted', 'staffallotted']),
      department: pickValue(row, ['department', 'dept']),
      courseCode: pickValue(row, ['course code', 'coursecode', 'subject code', 'subjectcode']),
      courseName: pickValue(row, ['course name', 'coursename', 'subject name', 'subjectname', 'course title', 'coursetitle']),
    }))
    .filter((row) => row.staffId || row.staffName || row.courseCode || row.courseName);
};

const parseBatchNumber = (sectionName) => {
  const match = String(sectionName || '').match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
};

const normalizeSections = (sections) =>
  [...(sections || [])].sort((a, b) => parseBatchNumber(a.sectionName) - parseBatchNumber(b.sectionName));

const resolveStaff = (row, staffList) => {
  const staffId = normalize(row.staffId);
  const staffName = normalizePerson(row.staffName);
  return staffList.find((staff) => {
    const candidateName = normalizePerson(staff.name);
    return (
      (staffId && normalize(staff.staffId) === staffId) ||
      (staffName && candidateName === staffName) ||
      (staffName && candidateName.includes(staffName)) ||
      (staffName && staffName.includes(candidateName))
    );
  });
};

const resolveCourse = (row, courses) => {
  const courseCode = normalize(row.courseCode);
  const courseCodes = String(row.courseCode || '').split('/').map(normalize).filter(Boolean);
  const courseName = normalize(row.courseName);

  const codeMatch = courses.find((course) => {
    const candidateCode = normalize(course.code);
    return (
      (courseCode && candidateCode === courseCode) ||
      (courseCodes.length > 0 && courseCodes.includes(candidateCode))
    );
  });

  if (codeMatch) return codeMatch;

  return courses.find((course) => {
    const candidateName = normalize(course.name);
    return (
      courseName &&
      (candidateName === courseName ||
        candidateName.includes(courseName) ||
        courseName.includes(candidateName))
    );
  });
};

const StaffCourseImportModal = ({ staffList, courses, fetchData, onClose }) => {
  const [groups, setGroups] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);

  const courseOptions = useMemo(
    () => [...courses].sort((a, b) => String(a.code).localeCompare(String(b.code))),
    [courses]
  );

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    setFileName(file.name);

    if (!['xlsx', 'xls', 'csv', 'docx'].includes(extension)) {
      showErrorToast('Unsupported File', 'Please upload Excel, CSV, or Word .docx. Old .doc files are not supported.');
      event.target.value = '';
      return;
    }

    try {
      const normalizedRows = extension === 'docx'
        ? await parseDocxRows(file)
        : await parseSpreadsheetRows(file);

      if (!normalizedRows.length) {
        showErrorToast('No Rows Found', 'The sheet should include staff and course columns.');
        return;
      }

      const grouped = normalizedRows.reduce((acc, row) => {
        const key = normalize(row.courseCode || row.courseName || 'unmatched');
        if (!acc[key]) {
          const course = resolveCourse(row, courses);
          acc[key] = {
            key,
            sourceCourseCode: row.courseCode,
            sourceCourseName: row.courseName,
            courseId: course?.courseId ? String(course.courseId) : '',
            numberOfSections: 1,
            rows: [],
          };
        }
        acc[key].rows.push(row);
        acc[key].numberOfSections = acc[key].rows.length;
        return acc;
      }, {});

      setGroups(Object.values(grouped));
    } catch (err) {
      showErrorToast('Import Error', err.message || 'Unable to read the selected file.');
    }
  };

  const updateGroup = (groupKey, changes) => {
    setGroups((prev) =>
      prev.map((group) => (group.key === groupKey ? { ...group, ...changes } : group))
    );
  };

  const getAssignments = (group) => {
    const sectionCount = Number(group.numberOfSections) || 0;
    return group.rows.map((row, index) => ({
      row,
      staff: resolveStaff(row, staffList),
      targetBatch: index < sectionCount ? `Batch ${index + 1}` : null,
    }));
  };

  const handleImport = async () => {
    if (!groups.length) {
      showErrorToast('Validation Error', 'Please upload a valid sheet first.');
      return;
    }

    const invalidGroup = groups.find((group) => !group.courseId || Number(group.numberOfSections) < 1);
    if (invalidGroup) {
      showErrorToast('Validation Error', 'Every course group needs a mapped course and at least one section.');
      return;
    }

    const tooManyStaff = groups.find((group) => group.rows.length > Number(group.numberOfSections));
    if (tooManyStaff) {
      showErrorToast('Section Count Needed', `${tooManyStaff.sourceCourseCode || tooManyStaff.sourceCourseName} has more staff than sections.`);
      return;
    }

    const unresolved = groups.flatMap(getAssignments).find((assignment) => !assignment.staff);
    if (unresolved) {
      showErrorToast('Staff Not Found', `Could not match staff in row ${unresolved.row.rowNumber}. Check Staff ID or Staff Name.`);
      return;
    }

    setImporting(true);
    const failures = [];
    let successCount = 0;

    try {
      for (const group of groups) {
        const course = courses.find((item) => String(item.courseId) === String(group.courseId));
        const sectionCount = Number(group.numberOfSections);
        let sections = normalizeSections(await manageStaffService.getCourseSections(course.courseId));

        if (sections.length < sectionCount) {
          await manageStaffService.addSections(course.courseId, sectionCount - sections.length);
          sections = normalizeSections(await manageStaffService.getCourseSections(course.courseId));
        }

        const assignments = getAssignments(group);
        for (let index = 0; index < assignments.length; index += 1) {
          const assignment = assignments[index];
          const section = sections[index];
          try {
            await manageStaffService.allocateCourse(
              assignment.staff.id,
              course.courseId,
              section.sectionId,
              assignment.staff.departmentId
            );
            successCount += 1;
          } catch (err) {
            failures.push(`${assignment.staff.name} - ${course.code}: ${err.response?.data?.message || err.message}`);
          }
        }
      }

      await fetchData();
      if (failures.length) {
        showErrorToast('Import Completed With Errors', failures.slice(0, 3).join('\n'));
      } else {
        showSuccessToast(`${successCount} staff allocation${successCount === 1 ? '' : 's'} imported successfully`);
        onClose();
      }
    } finally {
      setImporting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Import Staff Course Allocation</h3>
            <p className="text-sm text-slate-500 mt-1">Upload staff/course rows, map the course, set sections, then confirm.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <label className="block border-2 border-dashed border-indigo-200 bg-indigo-50/40 rounded-xl p-6 cursor-pointer hover:bg-indigo-50 transition-colors">
            <input type="file" accept=".xlsx,.xls,.csv,.doc,.docx" className="hidden" onChange={handleFileChange} disabled={importing} />
            <div className="flex flex-col items-center text-center">
              <FileSpreadsheet className="w-10 h-10 text-indigo-600 mb-3" />
              <span className="font-semibold text-slate-900">{fileName || 'Choose Excel, CSV, or Word file'}</span>
              <span className="text-xs text-slate-500 mt-1">Excel/CSV columns or Word table: Course Code, Course Title, Staff Allotted</span>
            </div>
          </label>

          {groups.length > 0 && (
            <div className="space-y-4">
              {groups.map((group) => {
                const assignments = getAssignments(group);
                return (
                  <div key={group.key} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 lg:grid-cols-[1fr_2fr_160px] gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Imported Course</p>
                        <p className="font-bold text-slate-900">{group.sourceCourseCode || 'No Code'}</p>
                        <p className="text-sm text-slate-600 truncate">{group.sourceCourseName || 'No course name'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">Map to Course</label>
                        <select
                          value={group.courseId}
                          onChange={(event) => updateGroup(group.key, { courseId: event.target.value })}
                          className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                          disabled={importing}
                        >
                          <option value="">Select course</option>
                          {courseOptions.map((course) => (
                            <option key={course.courseId} value={course.courseId}>
                              {course.code} - {course.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">No. of Sections</label>
                        <input
                          type="number"
                          min="1"
                          value={group.numberOfSections}
                          onChange={(event) => updateGroup(group.key, { numberOfSections: event.target.value })}
                          className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                          disabled={importing}
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-white text-slate-500">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold">Order</th>
                            <th className="px-4 py-2 text-left font-semibold">Imported Staff</th>
                            <th className="px-4 py-2 text-left font-semibold">Matched Staff</th>
                            <th className="px-4 py-2 text-left font-semibold">Target Section</th>
                            <th className="px-4 py-2 text-left font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((assignment, index) => (
                            <tr key={`${group.key}-${assignment.row.rowNumber}`} className="border-t border-slate-100">
                              <td className="px-4 py-2 font-medium text-slate-700">{index + 1}</td>
                              <td className="px-4 py-2 text-slate-700">
                                {assignment.row.staffId || '-'} {assignment.row.staffName ? `- ${assignment.row.staffName}` : ''}
                              </td>
                              <td className="px-4 py-2 text-slate-700">{assignment.staff?.name || 'Not matched'}</td>
                              <td className="px-4 py-2 text-slate-700">{assignment.targetBatch || 'Increase sections'}</td>
                              <td className="px-4 py-2">
                                {assignment.staff && assignment.targetBatch ? (
                                  <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-md text-xs font-semibold">
                                    <CheckCircle2 className="w-3 h-3" /> Ready
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-xs font-semibold">
                                    <AlertCircle className="w-3 h-3" /> Needs Check
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50" disabled={importing}>
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importing || groups.length === 0}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl text-white flex items-center gap-2 ${
              importing || groups.length === 0 ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Confirm Import'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StaffCourseImportModal;
