const normalizeRoleName = (value = '') => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

const STAFF_ROLE_KEYS = new Set([
  'staff',
  'teachingstaff',
  'faculty',
  'assistantprofessor',
  'associateprofessor',
  'professor',
  'hod',
  'departmenthead',
  'lecturer',
  'assistantprofessor',
]);

const isTeachingStaffRole = (roleName) => STAFF_ROLE_KEYS.has(normalizeRoleName(roleName));

export { normalizeRoleName, isTeachingStaffRole, STAFF_ROLE_KEYS };
