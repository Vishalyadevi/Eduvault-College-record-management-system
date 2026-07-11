const normalizeName = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed;
};

const looksLikeRegisterNumber = (value, registerNumber, regno) => {
  const normalized = normalizeName(value);
  if (!normalized) return true;
  if (['unknown', 'n/a'].includes(normalized.toLowerCase())) return true;
  if (normalized === normalizeName(registerNumber) || normalized === normalizeName(regno)) return true;
  return /^\d+$/.test(normalized);
};

const resolveStudentDisplayName = (student = {}) => {
  const registerNumber = normalizeName(student?.registerNumber || student?.regno);
  const fallbackNames = [
    student?.user?.userName,
    student?.userAccount?.userName,
    student?.studentUser?.userName,
    student?.studentProfile?.userName,
    student?.User?.userName,
    student?.userName,
    student?.studentName,
    student?.StudentName,
    student?.student_name,
    student?.name,
    student?.fullName,
    student?.fullname,
    student?.displayName,
    student?.Name,
  ];

  for (const candidate of fallbackNames) {
    const normalized = normalizeName(candidate);
    if (!normalized) continue;
    if (looksLikeRegisterNumber(normalized, registerNumber, registerNumber)) continue;
    return normalized;
  }

  return registerNumber || 'N/A';
};

export { resolveStudentDisplayName };
