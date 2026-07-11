import db from "../../models/acadamic/index.js";
import catchAsync from "../../utils/catchAsync.js";
import { Op } from "sequelize";

const {
  StudentDetails,
  StudentCourse,
  Course,
  Semester,
  Batch,
  Department,
} = db;

export const getStudentCourseMatrix = catchAsync(async (req, res) => {
  const { dept, batch, semester, search, degree } = req.query;

  if (!dept || !batch || !semester) {
    return res.status(400).json({
      status: "failure",
      message: "dept, batch, and semester are required",
    });
  }

  const deptId = parseInt(dept, 10);
  const semesterNumber = parseInt(semester, 10);
  const batchValue = String(batch);
  const selectedDegree = degree ? String(degree).trim() : null;

  const deptRecord = await Department.findByPk(deptId, {
    attributes: ["departmentId", "departmentAcr", "departmentName"],
  });

  if (!deptRecord) {
    return res.status(400).json({ status: "failure", message: "Invalid department" });
  }

  const batchFilter = {
    branch: deptRecord.departmentAcr,
    batch: batchValue,
  };

  if (selectedDegree) {
    batchFilter.degree = selectedDegree;
  }

  const resolvedBatch = await Batch.findOne({
    where: {
      ...batchFilter,
      isActive: "YES",
    },
    attributes: ["batch"],
    raw: true,
  });

  const resolvedBatchValue = String(resolvedBatch?.batch ?? batchValue);
  const resolvedDeptId = deptId;

  // 1) Courses offered in the given semester + batch + department branch
  const courses = await Course.findAll({
    where: { isActive: "YES" },
    attributes: ["courseId", "courseCode", "courseTitle"],
    include: [
      {
        model: Semester,
        required: true,
        where: { semesterNumber },
        attributes: [],
        include: [
          {
            model: Batch,
            required: true,
            where: {
              ...batchFilter,
              batch: resolvedBatchValue,
            },
          },
        ],
      },
    ],
    order: [["courseCode", "ASC"]],
  });

  const courseIds = courses.map((c) => c.courseId);

  // 2) Students for the given filters
  const studentWhere = {
    departmentId: resolvedDeptId,
    batch: resolvedBatchValue,
    semester: String(semesterNumber),
  };

  if (search) {
    const term = String(search).trim();
    if (term) {
      studentWhere[Op.or] = [
        { registerNumber: { [Op.like]: `%${term}%` } },
        { studentName: { [Op.like]: `%${term}%` } },
      ];
    }
  }

  const students = await StudentDetails.findAll({
    where: studentWhere,
    attributes: ["registerNumber", "studentName"],
    order: [["registerNumber", "ASC"]],
  });

  const regnos = students.map((s) => s.registerNumber);

  // 3) Enrollments for those students and courses
  const enrollments =
    regnos.length > 0 && courseIds.length > 0
      ? await StudentCourse.findAll({
          where: {
            regno: { [Op.in]: regnos },
            courseId: { [Op.in]: courseIds },
          },
          attributes: ["regno", "courseId"],
        })
      : [];

  res.status(200).json({
    status: "success",
    data: {
      courses,
      students: students.map((s) => ({
        regno: s.registerNumber,
        name: s.studentName || s.registerNumber || "",
      })),
      enrollments,
    },
  });
});


