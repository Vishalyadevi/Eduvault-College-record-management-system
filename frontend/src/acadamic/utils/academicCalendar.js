export const ACADEMIC_DEGREES = ['BE', 'ME', 'BTech', 'MTech'];

const parseDateOnly = (dateString) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ''))) return null;
  const [year, month, day] = String(dateString).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isThirdSaturday = (dateString) => {
  const date = parseDateOnly(dateString);
  return Boolean(date && date.getUTCDay() === 6 && date.getUTCDate() >= 15 && date.getUTCDate() <= 21);
};

export const isAcademicHoliday = (dateString) => {
  const date = parseDateOnly(dateString);
  return Boolean(date && (date.getUTCDay() === 0 || isThirdSaturday(dateString)));
};


