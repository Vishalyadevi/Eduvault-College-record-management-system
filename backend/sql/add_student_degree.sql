/*
  Required once before deploying degree-scoped student academic queries.

  Existing ambiguous students must be assigned deliberately; batch year + branch
  alone cannot distinguish BE from ME. The final query reports those rows.
*/
ALTER TABLE student_details
  ADD COLUMN course VARCHAR(50) NULL AFTER batch;

/* Safe automatic backfill only where exactly one active programme matches. */
UPDATE student_details sd
JOIN departments d ON d.departmentId = sd.departmentId
JOIN (
  SELECT batch, branch, MIN(degree) AS degree
  FROM Batch
  WHERE isActive = 'YES'
  GROUP BY batch, branch
  HAVING COUNT(DISTINCT degree) = 1
) b ON b.batch = sd.batch AND b.branch = d.departmentAcr
SET sd.course = b.degree
WHERE sd.course IS NULL;

/* These students require an administrator to set BE/ME/BTech/MTech. */
SELECT sd.studentId, sd.registerNumber, sd.batch, d.departmentAcr AS branch
FROM student_details sd
JOIN departments d ON d.departmentId = sd.departmentId
WHERE sd.course IS NULL;
