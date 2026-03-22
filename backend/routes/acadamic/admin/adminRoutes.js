// Modified adminroutes.js
import express from "express";
import {
  addSemester,
  deleteSemester,
  getAllSemesters,
  getSemester,
  updateSemester,
  getSemestersByBatchBranch,
} from "../../../controllers/acadamic/semesterController.js";
import {
  addCourse,
  getAllCourse,
  getCourseBySemester,
  updateCourse,
  deleteCourse,
  importCourses,
} from "../../../controllers/acadamic/subjectController.js";
import {
  allocateStaffToCourse,
  allocateCourseToStaff,
  updateStaffAllocation,
  getStaffAllocationsByCourse,
  getCourseAllocationsByStaff,
  deleteStaffAllocation,
  getUsers,
  getCourseAllocationsByStaffEnhanced,
  updateStaffCourseBatch,
} from "../../../controllers/acadamic/staffCourseController.js";
import {
  searchStudents,
  getAvailableCourses,
  enrollStudentInCourse,
  updateStudentBatch,
  getAvailableCoursesForBatch,
  unenrollStudentFromCourse,
} from "../../../controllers/acadamic/studentAllocationController.js";
import {
  getSectionsForCourse,
  addSectionsToCourse,
  updateSectionsForCourse,
  deleteSection,
  getSections,
} from "../../../controllers/acadamic/sectionController.js";
import {
  addStudent,
  getAllStudents,
  getStudentByRollNumber,
  updateStudent,
  deleteStudent,
  getStudentEnrolledCourses,
  getBranches,
  getSemesters,
  getBatches,
  getStudentsByCourseAndSection,
  getSemesterUpgradeBatches,
  upgradeSemesterByBatchAndDepartment,
} from "../../../controllers/acadamic/studentController.js";
import {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchByDetails,
} from "../../../controllers/acadamic/batchController.js";
import {
  getAllTimetableBatches,
  getAllTimetableDepartments,
  getTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  getTimetableByFilters,
  getElectiveBucketsBySemester,
  getCoursesInBucket,
} from "../../../controllers/acadamic/timetableController.js";
import { exportCourseWiseCsvAdmin, getConsolidatedMarks } from "../../../controllers/acadamic/markController.js";
import { getDepartments } from "../../../controllers/acadamic/departmentController.js";
import {
  getElectiveBuckets,
  createElectiveBucket,
  addCoursesToBucket,
  deleteElectiveBucket,
  removeCourseFromBucket,
  updateElectiveBucketName,
  getElectiveReselectionRequestsForAdmin,
  handleElectiveReselectionRequest,
} from "../../../controllers/acadamic/electiveBucketController.js";
import {
  getAllRegulations,
  createRegulation,
  importRegulationCourses,
  createVertical,
  getVerticalsByRegulation,
  getAvailableCoursesForVertical,
  allocateCoursesToVertical,
  allocateRegulationToBatch,
  getCoursesByVertical,
  getElectivesForSemester,
} from "../../../controllers/acadamic/regulationController.js";

// FIXED IMPORT: Changed 'protect' to 'requireAuth' and added 'authorize'
import { requireAuth, authorize } from "../../../middlewares/requireauth.js";

const academicAdminRoles = ['AcadamicAdmin', 'acadamicadmin', 'AcademicAdmin', 'academicadmin', 'SuperAdmin', 'superadmin', 'Superadmin'];
const restrictToAcademicAdmin = authorize(...academicAdminRoles);

import { getStudentEnrollments } from "../../../controllers/acadamic/studentEnrollmentViewController.js";
import { getStudentCourseMatrix } from "../../../controllers/acadamic/studentCourseMappingController.js";
import { getElectiveSelections } from "../../../controllers/acadamic/studentpageController.js";
import { getCOsForCourseAdmin, getStudentCOMarksAdmin, updateStudentCOMarkAdmin } from "../../../controllers/acadamic/markController.js";
import multer from 'multer';
import { uploadGrades, viewGPA, viewCGPA } from '../../../controllers/acadamic/gradeController.js';
import { getStudentsForGrade } from '../../../controllers/acadamic/gradeController.js';

import {
  addNptelCourse,
  bulkAddNptelCourses,
  getAllNptelCourses,
  updateNptelCourse,
  deleteNptelCourse,
  getPendingNptelTransfers,
  approveRejectTransfer
} from "../../../controllers/acadamic/nptelCourseController.js";
import {
  getTimetablePeriods,
  saveTimetablePeriods,
} from "../../../controllers/acadamic/periodController.js";

const upload = multer({ dest: 'tmp/' });
const router = express.Router();

/* =========================
📌 Semester Routes
========================= */
router.route("/semesters").post(requireAuth, restrictToAcademicAdmin, addSemester).get(requireAuth, restrictToAcademicAdmin, getAllSemesters);
router.get("/semesters/search", requireAuth, restrictToAcademicAdmin, getSemester);
router.get("/semesters/by-batch-branch", requireAuth, restrictToAcademicAdmin, getSemestersByBatchBranch);
router.route("/semesters/:semesterId").put(requireAuth, restrictToAcademicAdmin, updateSemester).delete(requireAuth, restrictToAcademicAdmin, deleteSemester);

/* =========================
📌 Course Routes
========================= */
router.route("/semesters/:semesterId/courses").post(requireAuth, restrictToAcademicAdmin, addCourse).get(requireAuth, restrictToAcademicAdmin, getCourseBySemester);
router.route("/courses").get(requireAuth, restrictToAcademicAdmin, getAllCourse).post(requireAuth, restrictToAcademicAdmin, importCourses);
router.route("/courses/:courseId").put(requireAuth, restrictToAcademicAdmin, updateCourse).delete(requireAuth, restrictToAcademicAdmin, deleteCourse);

/* =========================
📌 Staff-Course Allocation Routes
========================= */
router.get("/staff-users", requireAuth, restrictToAcademicAdmin, getUsers);
router.post("/courses/:courseId/staff", requireAuth, restrictToAcademicAdmin, allocateStaffToCourse);
router.post("/staff/:Userid/courses", requireAuth, restrictToAcademicAdmin, allocateCourseToStaff);
router.put("/staff-courses/:staffCourseId", requireAuth, restrictToAcademicAdmin, updateStaffAllocation);
router.patch("/staff-courses/:staffCourseId", requireAuth, restrictToAcademicAdmin, updateStaffCourseBatch);
router.get("/courses/:courseId/staff", requireAuth, restrictToAcademicAdmin, getStaffAllocationsByCourse);
router.get("/staff/:Userid/courses", requireAuth, restrictToAcademicAdmin, getCourseAllocationsByStaff);
router.delete("/staff-courses/:staffCourseId", requireAuth, restrictToAcademicAdmin, deleteStaffAllocation);
router.get("/staff/:Userid/courses-enhanced", requireAuth, restrictToAcademicAdmin, getCourseAllocationsByStaffEnhanced);

/* =========================
📌 Student Allocation Routes
========================= */
router.get("/students/search", requireAuth, restrictToAcademicAdmin, searchStudents);
router.get("/courses/available/:semesterNumber", requireAuth, restrictToAcademicAdmin, getAvailableCourses);
router.post("/students/enroll", requireAuth, restrictToAcademicAdmin, enrollStudentInCourse);
router.put("/students/:rollNumber/batch", requireAuth, restrictToAcademicAdmin, updateStudentBatch);
router.get("/courses/available/:batchId/:semesterNumber", requireAuth, restrictToAcademicAdmin, getAvailableCoursesForBatch);
router.delete("/students/unenroll", requireAuth, restrictToAcademicAdmin, unenrollStudentFromCourse);

/* =========================
📌 Section Routes
========================= */
router.get("/sections", requireAuth, restrictToAcademicAdmin, getSections);
router.get("/courses/:courseId/sections", requireAuth, restrictToAcademicAdmin, getSectionsForCourse);
router.post("/courses/:courseId/sections", requireAuth, restrictToAcademicAdmin, addSectionsToCourse);
router.put("/courses/:courseId/sections", requireAuth, restrictToAcademicAdmin, updateSectionsForCourse);
router.delete("/courses/:courseId/sections/:sectionName", requireAuth, restrictToAcademicAdmin, deleteSection);

/* =========================
📌 Student Routes
========================= */
router.route("/students").post(requireAuth, restrictToAcademicAdmin, addStudent).get(requireAuth, restrictToAcademicAdmin, getAllStudents);
router.get("/students/branches", requireAuth, restrictToAcademicAdmin, getBranches);
router.get("/students/semesters", requireAuth, restrictToAcademicAdmin, getSemesters);
router.get("/students/batches", requireAuth, restrictToAcademicAdmin, getBatches);
router.get("/students/semester-upgrade-batches", requireAuth, restrictToAcademicAdmin, getSemesterUpgradeBatches);
router.post("/students/semester-upgrade", requireAuth, restrictToAcademicAdmin, upgradeSemesterByBatchAndDepartment);
router.get("/students/enrolled-courses", requireAuth, restrictToAcademicAdmin, getStudentsByCourseAndSection);
router.route("/students/:rollNumber").get(requireAuth, restrictToAcademicAdmin, getStudentByRollNumber).put(requireAuth, restrictToAcademicAdmin, updateStudent).delete(requireAuth, restrictToAcademicAdmin, deleteStudent);
router.get("/students/:rollNumber/enrolled-courses", requireAuth, restrictToAcademicAdmin, getStudentEnrolledCourses);

/* =========================
📌 Batch Routes
========================= */
router.get("/batches/find", requireAuth, restrictToAcademicAdmin, getBatchByDetails);
router.route("/batches").get(requireAuth, restrictToAcademicAdmin, getAllBatches).post(requireAuth, restrictToAcademicAdmin, createBatch);
router.route("/batches/:batchId").get(requireAuth, restrictToAcademicAdmin, getBatchById).put(requireAuth, restrictToAcademicAdmin, updateBatch).delete(requireAuth, restrictToAcademicAdmin, deleteBatch);

/* =========================
📌 Timetable Routes
========================= */
router.get("/timetable/batches", requireAuth, restrictToAcademicAdmin, getAllTimetableBatches);
router.get("/timetable/departments", requireAuth, restrictToAcademicAdmin, getAllTimetableDepartments);
router.get("/timetable/by-filters", requireAuth, restrictToAcademicAdmin, getTimetableByFilters);
router.get("/timetable/semester/:semesterId", requireAuth, restrictToAcademicAdmin, getTimetable);
router.get("/timetable-periods", requireAuth, restrictToAcademicAdmin, getTimetablePeriods);
router.post("/timetable-periods", requireAuth, restrictToAcademicAdmin, saveTimetablePeriods);
router.post("/timetable/entry", requireAuth, restrictToAcademicAdmin, createTimetableEntry);
router.put("/timetable/entry/:timetableId", requireAuth, restrictToAcademicAdmin, updateTimetableEntry);
router.delete("/timetable/entry/:timetableId", requireAuth, restrictToAcademicAdmin, deleteTimetableEntry);
router.get("/elective-buckets/:semesterId", requireAuth, restrictToAcademicAdmin, getElectiveBucketsBySemester);
router.get("/bucket-courses/:bucketId", requireAuth, restrictToAcademicAdmin, getCoursesInBucket);

/* =========================
📌 Elective Bucket Routes
========================= */
router.get("/semesters/:semesterId/buckets", requireAuth, restrictToAcademicAdmin, getElectiveBuckets);
router.post("/semesters/:semesterId/buckets", requireAuth, restrictToAcademicAdmin, createElectiveBucket);
router.put("/buckets/:bucketId", requireAuth, restrictToAcademicAdmin, updateElectiveBucketName);
router.post("/buckets/:bucketId/courses", requireAuth, restrictToAcademicAdmin, addCoursesToBucket);
router.delete("/buckets/:bucketId", requireAuth, restrictToAcademicAdmin, deleteElectiveBucket);
router.delete("/buckets/:bucketId/courses/:courseId", requireAuth, restrictToAcademicAdmin, removeCourseFromBucket);
router.get('/regulations/:regulationId/electives/:semesterNumber', requireAuth, restrictToAcademicAdmin, getElectivesForSemester);

/* =========================
📌 Consolidated Marks Routes
========================= */
router.get("/consolidated-marks", requireAuth, restrictToAcademicAdmin, getConsolidatedMarks);

/* =========================
📌 Regulation Routes
========================= */
router.route('/regulations').get(requireAuth, restrictToAcademicAdmin, getAllRegulations).post(requireAuth, restrictToAcademicAdmin, createRegulation);
router.route('/regulations/courses').post(requireAuth, restrictToAcademicAdmin, importRegulationCourses);
router.route('/regulations/verticals').post(requireAuth, restrictToAcademicAdmin, createVertical);
router.route('/regulations/:regulationId/verticals').get(requireAuth, restrictToAcademicAdmin, getVerticalsByRegulation);
router.route('/regulations/:regulationId/courses/available').get(requireAuth, restrictToAcademicAdmin, getAvailableCoursesForVertical);
router.route('/regulations/verticals/courses').post(requireAuth, restrictToAcademicAdmin, allocateCoursesToVertical);
router.route('/regulations/verticals/:verticalId/courses').get(requireAuth, restrictToAcademicAdmin, getCoursesByVertical);
router.route('/regulations/allocate-to-batch').post(requireAuth, restrictToAcademicAdmin, allocateRegulationToBatch);

router.get("/enrollments/view", requireAuth, restrictToAcademicAdmin, getStudentEnrollments);
router.get("/student-course-matrix", requireAuth, restrictToAcademicAdmin, getStudentCourseMatrix);

router.get("/admin-marks/cos/:courseCode", requireAuth, restrictToAcademicAdmin, getCOsForCourseAdmin);
router.get("/admin-marks/marks/co/:courseCode", requireAuth, restrictToAcademicAdmin, getStudentCOMarksAdmin);
router.put("/admin-marks/marks/co/:regno/:coId", requireAuth, restrictToAcademicAdmin, updateStudentCOMarkAdmin);
router.get('/export/course/:courseCode', requireAuth, restrictToAcademicAdmin, exportCourseWiseCsvAdmin);

router.get("/elective-selections", requireAuth, restrictToAcademicAdmin, getElectiveSelections);
router.get("/elective-reselection-requests", requireAuth, restrictToAcademicAdmin, getElectiveReselectionRequestsForAdmin);
router.post("/elective-reselection-requests/:regno/:requestId/action", requireAuth, restrictToAcademicAdmin, handleElectiveReselectionRequest);

router.post('/grades/import', requireAuth, restrictToAcademicAdmin, upload.single('file'), uploadGrades);
router.get('/grades/gpa', requireAuth, restrictToAcademicAdmin, viewGPA);
router.get('/grades/cgpa', requireAuth, restrictToAcademicAdmin, viewCGPA);
router.get('/grades/students-grade', requireAuth, restrictToAcademicAdmin, getStudentsForGrade);

/* =========================
📌 NPTEL Course Routes
========================= */
router.route("/nptel-courses")
  .post(requireAuth, restrictToAcademicAdmin, addNptelCourse)
  .get(requireAuth, restrictToAcademicAdmin, getAllNptelCourses);

router.route("/nptel-courses/bulk")
  .post(requireAuth, restrictToAcademicAdmin, bulkAddNptelCourses);

router.route("/nptel-courses/:nptelCourseId")
  .put(requireAuth, restrictToAcademicAdmin, updateNptelCourse)
  .delete(requireAuth, restrictToAcademicAdmin, deleteNptelCourse);

router.get("/nptel-credit-transfers", requireAuth, restrictToAcademicAdmin, getPendingNptelTransfers);
router.post("/nptel-credit-transfer-action", requireAuth, restrictToAcademicAdmin, approveRejectTransfer);

export default router;
