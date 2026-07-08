import db from './models/acadamic/index.js';

(async () => {
  try {
    const sections = await db.Section.findAll({
      where: { isActive: 'YES' },
      include: [{
        model: db.Course,
        where: { isActive: 'YES', semesterId: 2 },
        attributes: ['courseCode', 'courseTitle', 'semesterId'],
        include: [{
          model: db.Semester,
          attributes: ['batchId'],
          include: [{ model: db.Batch, attributes: ['branch'] }]
        }]
      }]
    });

    const result = sections.map(s => ({
      sectionId: s.sectionId,
      sectionName: s.sectionName,
      courseId: s.courseId,
      courseCode: s.Course?.courseCode,
      courseTitle: s.Course?.courseTitle,
      semesterId: s.Course?.semesterId,
      batchId: s.Course?.Semester?.batchId,
      branch: s.Course?.Semester?.Batch?.branch,
      displayName: [s.sectionName, s.Course?.courseTitle || s.Course?.courseCode || s.Course?.Semester?.Batch?.branch].filter(Boolean).join(' - ')
    }));

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
