export function parseDateOnly(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ''))) return null;
  const [year, month, day] = String(dateString).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isThirdSaturday(dateString) {
  const date = parseDateOnly(dateString);
  return Boolean(date && date.getDay() === 6 && date.getDate() >= 15 && date.getDate() <= 21);
}

export function isAcademicHoliday(dateString) {
  const date = parseDateOnly(dateString);
  return Boolean(date && (date.getDay() === 0 || isThirdSaturday(dateString)));
}

export const thirdSaturdaySql = (column = 'attendanceDate') =>
  `NOT (DAYOFWEEK(${column}) = 7 AND DAYOFMONTH(${column}) BETWEEN 15 AND 21)`;

