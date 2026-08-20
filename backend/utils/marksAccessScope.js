const flattenValues = (value) => {
  if (Array.isArray(value)) return value.flatMap(flattenValues);
  return String(value ?? '').split(/[_,]/);
};

export const parseSectionScope = (value) => {
  const ids = flattenValues(value)
    .map(item => String(item).trim())
    .filter(item => /^\d+$/.test(item))
    .map(Number)
    .filter(item => Number.isSafeInteger(item) && item > 0);

  return [...new Set(ids)];
};

export const uniqueCourseSectionPairs = (assignments = []) => {
  const pairs = new Map();

  assignments.forEach((assignment) => {
    const plain = typeof assignment?.get === 'function'
      ? assignment.get({ plain: true })
      : assignment;
    const courseId = Number(plain?.courseId);
    const sectionId = Number(plain?.sectionId);

    if (!Number.isSafeInteger(courseId) || courseId <= 0) return;
    if (!Number.isSafeInteger(sectionId) || sectionId <= 0) return;
    pairs.set(`${courseId}:${sectionId}`, { courseId, sectionId });
  });

  return [...pairs.values()];
};

export const normalizeRegistrationNumber = (value) => String(value ?? '').trim().toUpperCase();

export const findOutOfScopeRegistrationNumbers = (registrationNumbers, allowedRegistrationNumbers) => {
  const allowed = new Set(
    [...allowedRegistrationNumbers].map(normalizeRegistrationNumber).filter(Boolean)
  );

  return [...new Set(
    registrationNumbers
      .map(normalizeRegistrationNumber)
      .filter(regno => regno && !allowed.has(regno))
  )];
};
