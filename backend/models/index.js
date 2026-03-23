import { sequelize } from "../config/mysql.js";
import User from "./User.js";
import Role from "./student/Role.js";
import Department from "./student/Department.js";
import StudentDetails from "./student/StudentDetails.js";
import Internship from "./student/Internship.js";
import Message from "./student/Message.js";
import Country from "./student/Country.js";
import State from "./student/State.js";
import District from "./student/District.js";
import City from "./student/City.js";
import RelationDetails from "./student/RelationDetails.js";
import BankDetails from "./student/BankDetails.js";
import EventAttended from "./student/eventAttended.js";
import RecentActivity from "./student/RecentActivity.js";
import BulkUploadHistory from "./student/BulkUploadHistory.js";
import DownloadHistory from "./student/DownloadHistory.js";
import Scholarship from "./student/Scholarship.js";
import EventOrganized from "./student/EventOrganized.js";
import StudentLeave from "./student/StudentLeave.js";
import OnlineCourses from "./student/OnlineCourses.js";
import Achievement from "./student/Achievement.js";
import Course from "./student/Course.js";
import Marksheet from "./student/Marksheet.js";
import HackathonEvent from "./student/HackathonEvent.js";
import Extracurricular from "./student/Extracurricular.js";
import Project from "./student/Project.js";
import StudentEducation from "./student/StudentEducation.js";
import CompetencyCoding from "./student/CompetencyCoding.js";
import StudentPublication from "./student/StudentPublication.js";
import NonCGPACategory from "./student/NonCGPACategory.js";
import StudentNonCGPA from "./student/StudentNonCGPA.js";
import NPTELCourse from "./student/NPTELCourse.js";
import StudentNPTEL from "./student/StudentNPTEL.js";
//import StudentLeave from "./StudentLeave.js";
import ProjectMentor from "./staff/projectMentor.js";
import SkillRack from './student/SkillRack.js';
import Certificate from "./student/Certificate.js";
import PersonalInformation from "./student/PersonalInformation.js";
import HIndex from "./staff/HIndex.js";
import BookChapter from "./staff/BookChapter.js";
import StaffCertificationCourse from "./staff/StaffCertificationCourse.js";
import StaffDetailsModel from "./staff/staffDetails.js";
const StaffDetails = StaffDetailsModel(sequelize);


import Activity from "./student/Activity.js";
import TlpActivity from "./student/TlpActivity.js";
import PatentProduct from "./staff/PatentProduct.js";
import FundedProject from "./staff/FundedProject.js";
import FundedProjectPayment from "./staff/FundedProjectPayment.js";
import ConsultancyProposal from "./staff/ConsultancyProposal.js";
import Recognition from "./staff/Recognition.js";
import ResourcePerson from "./staff/ResourcePerson.js";
import SeedMoney from "./staff/SeedMoney.js";
import Scholar from "./staff/Scholar.js";
import StaffEventAttended from "./staff/StaffEventAttended.js";
import StaffEventsAttendedModel from "./staff/EventsAttended.js";
import StaffEventsOrganizedModel from "./staff/EventsOrganized.js";
import IndustryKnowhow from "./staff/IndustryKnowhow.js";
import MOU from "./staff/MOU.js";
import MOUActivity from "./staff/MOUActivity.js";

import PlacementCompany from "./placement/Company.js";
import FeedbackRound from "./placement/FeedbackRound.js";
import EducationModel from "./staff/Education.js";
const Education = EducationModel(sequelize);

// Include and initialize Academic project models
// import acadamicModels from "./acadamic/index.js";
// const academicDb = acadamicModels;

import Hackathon from "./placement/Hackathon.js";
import HackathonRegistration from "./placement/HackathonRegistration.js";
import Notification from "./placement/Notification.js";
import PlacementDrive from "./placement/PlacementDrive.js";
import PlacementFeedback from "./placement/PlacementFeedback.js";
import RegisteredStudentPlacement from "./placement/RegisteredStudentPlacement.js";

import Company from "./student/company.js";
const applyAssociations = () => {
  console.log("Applying model associations...");

  /** =====================
   *  🟢 USER ASSOCIATIONS
   *  ===================== */

  // User - Role associations
  Role.hasMany(User, { foreignKey: "roleId", as: "users" });
  // User.belongsTo(Role, { foreignKey: "roleId", as: "role" }); // Defined in User.js associate()

  // User - Department associations (fixed foreign key)
  // Department.hasMany(User, { foreignKey: "departmentId", as: "users" }); // Defined in Department.js associate()
  // User.belongsTo(Department, { foreignKey: "departmentId", as: "department" }); // Defined in User.js associate()

  User.hasOne(StudentDetails, { foreignKey: "Userid", as: "studentDetails" });
  User.hasOne(StudentDetails, { foreignKey: "Userid", as: "studentProfile" }); // Many controllers expect this

  StudentDetails.belongsTo(User, { foreignKey: "Userid", as: "studentUser" });
  StudentDetails.belongsTo(User, { foreignKey: "Userid", as: "user" }); // Also used as 'user' in some controllers
  StudentDetails.belongsTo(User, { foreignKey: "Userid", as: "userAccount" }); // Used in NPTEL controllers
  User.hasMany(StudentDetails, { foreignKey: "staffId", as: "staffStudents" });
  StudentDetails.belongsTo(User, { foreignKey: "staffId", as: "staffAdvisor" });
// Add audit user associations for StudentDetails
  StudentDetails.belongsTo(User, { foreignKey: "Created_by", as: "oldCreator" });
  StudentDetails.belongsTo(User, { foreignKey: "Updated_by", as: "oldUpdater" });
  StudentDetails.belongsTo(User, { foreignKey: "Approved_by", as: "oldApprover" });
  StudentDetails.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
  StudentDetails.belongsTo(User, { foreignKey: "updatedBy", as: "updater" });
  StudentDetails.belongsTo(User, { foreignKey: "approvedBy", as: "approver" });

   



  User.hasOne(StaffDetails, { foreignKey: "Userid", as: "staffPersonalInfo" });
  StaffDetails.belongsTo(User, { foreignKey: "Userid", as: "staffUser" });

  User.hasOne(Education, { foreignKey: "Userid", as: "staffEducation" });
  Education.belongsTo(User, { foreignKey: "Userid", as: "userAccount" });

  User.hasOne(BankDetails, { foreignKey: "Userid", as: "bankDetails" });
  BankDetails.belongsTo(User, { foreignKey: "Userid", as: "bankUser" });

  User.hasMany(RelationDetails, { foreignKey: "Userid", as: "relationDetails" });
  RelationDetails.belongsTo(User, { foreignKey: "Userid", as: "relationUser" });

  // 🏢 Internship associations
  User.hasMany(Internship, { foreignKey: "Userid", as: "internships" });
  Internship.belongsTo(User, { foreignKey: "Userid", as: "internUser" });

  User.hasMany(Internship, { foreignKey: "Created_by", as: "createdInternships" });
  Internship.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

  User.hasMany(Internship, { foreignKey: "Updated_by", as: "updatedInternships" });
  Internship.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

  User.hasMany(Internship, { foreignKey: "Approved_by", as: "tutorApprovedInternships" });
  Internship.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

  // 📩 Messages
  User.hasMany(Message, { foreignKey: "sender_id", as: "sentMessages" });
  Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

  User.hasMany(Message, { foreignKey: "receiver_id", as: "receivedMessages" });
  Message.belongsTo(User, { foreignKey: "receiver_id", as: "receiver" });

  // 🎓 Student Details & Department
  StudentDetails.belongsTo(Department, { foreignKey: "departmentId", as: "department" });
  Department.hasMany(StudentDetails, { foreignKey: "departmentId", as: "students" });

  // 🏠 Student Address Associations
  StudentDetails.belongsTo(Country, { foreignKey: "countryID", as: "country" });
  StudentDetails.belongsTo(State, { foreignKey: "stateID", as: "state" });
  StudentDetails.belongsTo(District, { foreignKey: "districtID", as: "district" });
  //StudentDetails.belongsTo(City, { foreignKey: "cityID", as: "city" });

  /** =====================
   *  🟢 LOCATION ASSOCIATIONS
   *  ===================== */
  Country.hasMany(State, { foreignKey: "countryID", as: "states" });
  State.belongsTo(Country, { foreignKey: "countryID", as: "country" });

  State.hasMany(District, { foreignKey: "stateID", as: "districts" });
  District.belongsTo(State, { foreignKey: "stateID", as: "state" });

  District.hasMany(City, { foreignKey: "districtID", as: "cities" });
  City.belongsTo(District, { foreignKey: "districtID", as: "district" });


  User.hasMany(BulkUploadHistory, { foreignKey: "Userid" });
  BulkUploadHistory.belongsTo(User, { foreignKey: "Userid" });

  User.hasMany(DownloadHistory, { foreignKey: "Userid" });
  DownloadHistory.belongsTo(User, { foreignKey: "Userid" });

  /** =====================
   *  🟢 SCHOLARSHIP ASSOCIATIONS
   *  ===================== */
  // A scholarship belongs to a user (student)
  // User model
  User.hasMany(Scholarship, { foreignKey: "Userid", as: "scholarships" });
  Scholarship.belongsTo(User, { foreignKey: "Userid", as: "student" });

  // Created_by association
  User.hasMany(Scholarship, { foreignKey: "Created_by", as: "createdScholarships" });
  Scholarship.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

  // Updated_by association
  User.hasMany(Scholarship, { foreignKey: "Updated_by", as: "updatedScholarships" });
  Scholarship.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

  // Approved_by association
  User.hasMany(Scholarship, { foreignKey: "Approved_by", as: "tutorApprovedScholarships" });
  Scholarship.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });
  // User-EventOrganized associations

  // User as Organizer
  User.hasMany(EventOrganized, { foreignKey: "Userid", as: "organizedEvents" });
  EventOrganized.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

  // Created_by association
  User.hasMany(EventOrganized, { foreignKey: "Created_by", as: "createdEvents" });
  EventOrganized.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

  // Updated_by association
  User.hasMany(EventOrganized, { foreignKey: "Updated_by", as: "updatedEvents" });
  EventOrganized.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

  // Approved_by association
  User.hasMany(EventOrganized, { foreignKey: "Approved_by", as: "tutorApprovedEvents" });
  EventOrganized.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

  // User - EventAttended Associations

  // User attending multiple events
  User.hasMany(EventAttended, { foreignKey: "Userid", as: "attendedEvents" });
  EventAttended.belongsTo(User, { foreignKey: "Userid", as: "eventUser" });

  // Created_by association
  User.hasMany(EventAttended, { foreignKey: "Created_by", as: "createdAttendedEvents" });
  EventAttended.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

  // Updated_by association
  User.hasMany(EventAttended, { foreignKey: "Updated_by", as: "updatedAttendedEvents" });
  EventAttended.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

  // Approved_by association
  User.hasMany(EventAttended, { foreignKey: "Approved_by", as: "tutorApprovedAttendedEvents" });
  EventAttended.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });


  StudentLeave.belongsTo(User, { foreignKey: "Userid", as: "LeaveUser" });
  StudentLeave.belongsTo(User, { foreignKey: "Created_by", as: "creator" });
  StudentLeave.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });
  StudentLeave.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

  User.hasMany(StudentLeave, { foreignKey: "Userid", as: "studentLeaves" });
  User.hasMany(StudentLeave, { foreignKey: "Created_by", as: "createdLeaves" });
  User.hasMany(StudentLeave, { foreignKey: "Updated_by", as: "updatedLeaves" });
  User.hasMany(StudentLeave, { foreignKey: "Approved_by", as: "approvedLeaves" });

  User.hasMany(OnlineCourses, { foreignKey: "Userid", as: "onlineCourses" });
  OnlineCourses.belongsTo(User, { foreignKey: "Userid", as: "student" });

  User.hasMany(OnlineCourses, { foreignKey: "Created_by", as: "createdCourses" });
  OnlineCourses.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

  User.hasMany(OnlineCourses, { foreignKey: "Updated_by", as: "updatedCourses" });
  OnlineCourses.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

  User.hasMany(OnlineCourses, { foreignKey: "Approved_by", as: "tutorApprovedCourses" });
  OnlineCourses.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });
  // User-Achievement Relationship


  // In your Achievement model file or where you define associations:

  // Student association (User who owns the achievement)
  User.hasMany(Achievement, { foreignKey: "Userid", as: "studentAchievements" });
  Achievement.belongsTo(User, { foreignKey: "Userid", as: "student" });

  // Creator association
  User.hasMany(Achievement, { foreignKey: "Created_by", as: "createdAchievements" });
  Achievement.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

  // Updater association
  User.hasMany(Achievement, { foreignKey: "Updated_by", as: "updatedAchievements" });
  Achievement.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

  // Approver association
  User.hasMany(Achievement, { foreignKey: "Approved_by", as: "approvedAchievements" });
  Achievement.belongsTo(User, { foreignKey: "Approved_by", as: "approver" });






  /** =====================
     *  🟢 USER - COURSE ASSOCIATIONS (FIXED)
     *  ===================== */
  User.hasMany(Course, { foreignKey: "Userid", as: "studentCourses" });
  Course.belongsTo(User, { foreignKey: "Userid", as: "student" });

  User.hasMany(Course, { foreignKey: "Created_by", as: "coursesCreated" });
  Course.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

  User.hasMany(Course, { foreignKey: "Updated_by", as: "coursesUpdated" });
  Course.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

  User.hasMany(Course, { foreignKey: "Approved_by", as: "coursesApproved" });
  Course.belongsTo(User, { foreignKey: "Approved_by", as: "approver" });

  Course.hasMany(Marksheet, { foreignKey: 'Userid', sourceKey: 'Userid' });

  /** =====================
   *  🟢 CERTIFICATE ASSOCIATIONS
   *  ===================== */
  User.hasMany(Certificate, { foreignKey: "Userid", as: "certificates" });
  Certificate.belongsTo(User, { foreignKey: "Userid", as: "student" });

  User.hasMany(Certificate, { foreignKey: "Created_by", as: "createdCertificates" });
  Certificate.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

  User.hasMany(Certificate, { foreignKey: "Updated_by", as: "updatedCertificates" });
  Certificate.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

  User.hasMany(Certificate, { foreignKey: "verified_by", as: "verifiedCertificates" });
  Certificate.belongsTo(User, { foreignKey: "verified_by", as: "approver" });

  // HackathonEvent Associations
  User.hasMany(HackathonEvent, { foreignKey: "Userid", as: "hackathonEvents" });
  HackathonEvent.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

  // Created_by association
  User.hasMany(HackathonEvent, { foreignKey: "Created_by", as: "createdHackathonEvents" });
  HackathonEvent.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

  // Updated_by association
  User.hasMany(HackathonEvent, { foreignKey: "Updated_by", as: "updatedHackathonEvents" });
  HackathonEvent.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

  // Approved_by association
  User.hasMany(HackathonEvent, { foreignKey: "Approved_by", as: "approvedHackathonEvents" });
  HackathonEvent.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

  // H-Index Associations
  User.hasMany(HIndex, { foreignKey: "Userid", as: "hIndexes" });
  HIndex.belongsTo(User, { foreignKey: "Userid", as: "user" });

  // BookChapter Associations
  User.hasMany(BookChapter, { foreignKey: "Userid", as: "bookChapters" });
  BookChapter.belongsTo(User, { foreignKey: "Userid", as: "user" });

  // StaffCertificationCourse Associations
  User.hasMany(StaffCertificationCourse, { foreignKey: "Userid", as: "staffCertifications" });
  StaffCertificationCourse.belongsTo(User, { foreignKey: "Userid", as: "user" });

  console.log("✅ Associations applied successfully.");
};

// 🏅 EXTRACURRICULAR ACTIVITY ASSOCIATIONS
// ========================

// User as participant
User.hasMany(Extracurricular, { foreignKey: "Userid", as: "extracurricularActivities" });
Extracurricular.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(Extracurricular, { foreignKey: "Created_by", as: "createdExtracurricularActivities" });
Extracurricular.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(Extracurricular, { foreignKey: "Updated_by", as: "updatedExtracurricularActivities" });
Extracurricular.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Approved_by association
User.hasMany(Extracurricular, { foreignKey: "Approved_by", as: "approvedExtracurricularActivities" });
Extracurricular.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

// Update the exports at the bottom to include Extracurricular:
User.hasMany(Project, { foreignKey: "Userid", as: "studentProjects" });
Project.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(Project, { foreignKey: "Created_by", as: "createdProjects" });
Project.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(Project, { foreignKey: "Updated_by", as: "updatedProjects" });
Project.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Approved_by association
User.hasMany(Project, { foreignKey: "Approved_by", as: "approvedProjects" });
Project.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

// 📚 STUDENT EDUCATION ASSOCIATIONS
// ========================

// User to StudentEducation (One-to-One)
User.hasOne(StudentEducation, { foreignKey: "Userid", as: "educationRecord" });
StudentEducation.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(StudentEducation, { foreignKey: "Created_by", as: "createdEducationRecords" });
StudentEducation.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(StudentEducation, { foreignKey: "Updated_by", as: "updatedEducationRecords" });
StudentEducation.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Verified_by association
User.hasMany(StudentEducation, { foreignKey: "Verified_by", as: "verifiedEducationRecords" });
StudentEducation.belongsTo(User, { foreignKey: "Verified_by", as: "verifier" });

// User to CompetencyCoding (One-to-One)
User.hasOne(CompetencyCoding, { foreignKey: "Userid", as: "competencyCoding" });
CompetencyCoding.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(CompetencyCoding, { foreignKey: "Created_by", as: "createdCompetencyRecords" });
CompetencyCoding.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(CompetencyCoding, { foreignKey: "Updated_by", as: "updatedCompetencyRecords" });
CompetencyCoding.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Verified_by association
User.hasMany(CompetencyCoding, { foreignKey: "Verified_by", as: "verifiedCompetencyRecords" });
CompetencyCoding.belongsTo(User, { foreignKey: "Verified_by", as: "verifier" });

// User to StudentPublication (One-to-Many)
User.hasMany(StudentPublication, { foreignKey: "Userid", as: "publications" });
StudentPublication.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(StudentPublication, { foreignKey: "Created_by", as: "createdPublications" });
StudentPublication.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(StudentPublication, { foreignKey: "Updated_by", as: "updatedPublications" });
StudentPublication.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Verified_by association
User.hasMany(StudentPublication, { foreignKey: "Verified_by", as: "verifiedPublications" });
StudentPublication.belongsTo(User, { foreignKey: "Verified_by", as: "verifier" });

// User as creator
User.hasMany(NonCGPACategory, { foreignKey: "Created_by", as: "createdNonCGPACategories" });
NonCGPACategory.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// User as updater
User.hasMany(NonCGPACategory, { foreignKey: "Updated_by", as: "updatedNonCGPACategories" });
NonCGPACategory.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });


User.hasMany(StudentNonCGPA, { foreignKey: "Userid", as: "nonCGPARecords" });
StudentNonCGPA.belongsTo(User, { foreignKey: "Userid", as: "student" });

// NonCGPACategory to StudentNonCGPA (One-to-Many)
NonCGPACategory.hasMany(StudentNonCGPA, { foreignKey: "category_id", as: "studentRecords" });
StudentNonCGPA.belongsTo(NonCGPACategory, { foreignKey: "category_id", as: "category" });

// Created_by association
User.hasMany(StudentNonCGPA, { foreignKey: "Created_by", as: "createdNonCGPARecords" });
StudentNonCGPA.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(StudentNonCGPA, { foreignKey: "Updated_by", as: "updatedNonCGPARecords" });
StudentNonCGPA.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Verified_by association
User.hasMany(StudentNonCGPA, { foreignKey: "Verified_by", as: "verifiedNonCGPARecords" });
StudentNonCGPA.belongsTo(User, { foreignKey: "Verified_by", as: "verifier" });
// Update the exports at the bottom to include NonCGPACategory:

// User has many NPTEL enrollments
User.hasMany(StudentNPTEL, {
  foreignKey: "Userid",
  as: "nptelEnrollments",
});
StudentNPTEL.belongsTo(User, {
  foreignKey: "Userid",
  as: "student",
});

// NPTELCourse has many StudentNPTEL enrollments
NPTELCourse.hasMany(StudentNPTEL, {
  foreignKey: "course_id",
  as: "enrollments",
});
StudentNPTEL.belongsTo(NPTELCourse, {
  foreignKey: "course_id",
  as: "course",
});


// 🎯 ACTIVITY ASSOCIATIONS
// ========================
User.hasMany(Activity, { foreignKey: "Userid", as: "activities" });
Activity.belongsTo(User, { foreignKey: "Userid", as: "submitter" });

// TLP Activity associations
User.hasMany(TlpActivity, { foreignKey: "Userid", as: "tlpActivities" });
TlpActivity.belongsTo(User, { foreignKey: "Userid", as: "tlpSubmitter" });

User.hasMany(Activity, { foreignKey: "Created_by", as: "createdActivities" });
Activity.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

User.hasMany(Activity, { foreignKey: "Updated_by", as: "updatedActivities" });
Activity.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

User.hasMany(Activity, { foreignKey: "Approved_by", as: "approvedActivities" });
Activity.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

// PatentProduct Associations
User.hasMany(PatentProduct, { foreignKey: "Userid", as: "patentProducts" });
PatentProduct.belongsTo(User, { foreignKey: "Userid", as: "user" });

// FundedProject (project_proposals) Associations
User.hasMany(FundedProject, { foreignKey: "Userid", as: "fundedProjects" });
FundedProject.belongsTo(User, { foreignKey: "Userid", as: "user" });

// FundedProjectPayment (project_payment_details) Associations
FundedProject.hasMany(FundedProjectPayment, { foreignKey: "proposal_id", as: "payments" });
FundedProjectPayment.belongsTo(FundedProject, { foreignKey: "proposal_id", as: "project" });

// ConsultancyProposal (consultancy_proposals) Associations
User.hasMany(ConsultancyProposal, { foreignKey: "Userid", as: "consultancyProposals" });
ConsultancyProposal.belongsTo(User, { foreignKey: "Userid", as: "user" });

// Recognition (recognition_appreciation) Associations
User.hasMany(Recognition, { foreignKey: "Userid", as: "recognitions" });
Recognition.belongsTo(User, { foreignKey: "Userid", as: "user" });

// ResourcePerson (resource_person) Associations
User.hasMany(ResourcePerson, { foreignKey: "Userid", as: "resourcePersonEntries" });
ResourcePerson.belongsTo(User, { foreignKey: "Userid", as: "user" });

// SeedMoney Associations
User.hasMany(SeedMoney, { foreignKey: "Userid", as: "seedMoney" });
SeedMoney.belongsTo(User, { foreignKey: "Userid", as: "user" });

// Scholar (scholars) Associations
User.hasMany(Scholar, { foreignKey: "Userid", as: "scholars" });
Scholar.belongsTo(User, { foreignKey: "Userid", as: "user" });

// StaffEventAttended Associations
User.hasMany(StaffEventAttended, { foreignKey: "Userid", as: "staffAttendedEvents" });
StaffEventAttended.belongsTo(User, { foreignKey: "Userid", as: "eventUser" });

// Created_by association
User.hasMany(StaffEventAttended, { foreignKey: "Created_by", as: "createdStaffAttendedEvents" });
StaffEventAttended.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(StaffEventAttended, { foreignKey: "Updated_by", as: "updatedStaffAttendedEvents" });
StaffEventAttended.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Approved_by association
User.hasMany(StaffEventAttended, { foreignKey: "Approved_by", as: "approvedStaffAttendedEvents" });
StaffEventAttended.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

// SkillRack Associations
User.hasMany(SkillRack, { foreignKey: 'Userid' });
SkillRack.belongsTo(User, { foreignKey: 'Userid' });


User.hasOne(SkillRack, {
  foreignKey: "Userid",
  as: "skillrack",
  onDelete: "SET NULL",
  constraints: false,
});

SkillRack.belongsTo(User, {
  foreignKey: "Userid",
  as: "student",
  constraints: false,
});


// ─── ADD INSIDE applyAssociations() ───────────────────────────────────────────
// ProjectMentor associations
// FK: project_mentors.Userid → Users.Userid (internal PK)
User.hasMany(ProjectMentor, { foreignKey: "Userid", as: "projectMentors" });
ProjectMentor.belongsTo(User, { foreignKey: "Userid", as: "user" });

// StaffEventsAttended Associations
User.hasMany(StaffEventsAttendedModel, { foreignKey: "Userid", as: "staffEventsAttendedList" });
StaffEventsAttendedModel.belongsTo(User, { foreignKey: "Userid", as: "user" });

// StaffEventsOrganized Associations
User.hasMany(StaffEventsOrganizedModel, { foreignKey: "Userid", as: "staffEventsOrganizedList" });
StaffEventsOrganizedModel.belongsTo(User, { foreignKey: "Userid", as: "user" });

// IndustryKnowhow Associations
User.hasMany(IndustryKnowhow, { foreignKey: "Userid", as: "industryKnowhowList" });
IndustryKnowhow.belongsTo(User, { foreignKey: "Userid", as: "user" });

// MOU Associations
User.hasMany(MOU, { foreignKey: "Userid", as: "mous" });
MOU.belongsTo(User, { foreignKey: "Userid", as: "user" });

User.hasMany(MOUActivity, { foreignKey: "Userid", as: "mouActivities" });
MOUActivity.belongsTo(User, { foreignKey: "Userid", as: "user" });

MOU.hasMany(MOUActivity, { foreignKey: "mou_id", as: "activities" });
MOUActivity.belongsTo(MOU, { foreignKey: "mou_id", as: "mou" });

// 💼 PLACEMENT ASSOCIATIONS
// ========================

// Company - PlacementDrive
// (Assuming Company name matches company_name in PlacementDrive, or if there's a link)

// User - PlacementFeedback
User.hasMany(PlacementFeedback, { foreignKey: "student_id", as: "placementFeedbacks" });
PlacementFeedback.belongsTo(User, { foreignKey: "student_id", as: "student" });

// PlacementFeedback - FeedbackRound
PlacementFeedback.hasMany(FeedbackRound, { foreignKey: "feedback_id", as: "rounds" });
FeedbackRound.belongsTo(PlacementFeedback, { foreignKey: "feedback_id", as: "feedback" });

// Hackathon - HackathonRegistration
Hackathon.hasMany(HackathonRegistration, { foreignKey: "hackathon_id", as: "registrations" });
HackathonRegistration.belongsTo(Hackathon, { foreignKey: "hackathon_id", as: "hackathon" });

// User - HackathonRegistration
User.hasMany(HackathonRegistration, { foreignKey: "userId", as: "userHackathonRegistrations" });
HackathonRegistration.belongsTo(User, { foreignKey: "userId", as: "user" });

// PlacementDrive - RegisteredStudentPlacement
PlacementDrive.hasMany(RegisteredStudentPlacement, { foreignKey: "drive_id", as: "registrations" });
RegisteredStudentPlacement.belongsTo(PlacementDrive, { foreignKey: "drive_id", as: "drive" });

// User - RegisteredStudentPlacement
User.hasMany(RegisteredStudentPlacement, { foreignKey: "user_id", as: "userPlacementRegistrations" });
RegisteredStudentPlacement.belongsTo(User, { foreignKey: "user_id", as: "student" });

// PlacementDrive - Creator
PlacementDrive.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

const db = {
  sequelize,
  Sequelize: sequelize.constructor, // This usually works, or just import it
  User,
  Role,
  Company,
  StaffDetails,
  SkillRack,
  Education,
  OnlineCourses,
  StudentDetails,
  NPTELCourse,
  StudentNPTEL,
  Course,
  HackathonEvent,
  Extracurricular,
  Project,
  StudentEducation,
  CompetencyCoding,
  StudentPublication,
  PersonalInformation,
  NonCGPACategory,
  Internship,
  Message,
  Country,
  State,
  District,
  Department,
  City,
  RelationDetails,
  BankDetails,
  EventAttended,
  EventOrganized,
  RecentActivity,
  BulkUploadHistory,
  DownloadHistory,
  Scholarship,
  StudentLeave,
  Achievement,
  Marksheet,
  StudentNonCGPA,
  Activity,
  TlpActivity,
  ProjectMentor,
  PatentProduct,
  FundedProject,
  FundedProjectPayment,
  ConsultancyProposal,
  Recognition,
  ResourcePerson,
  SeedMoney,
  Scholar,
  StaffEventAttended,
  StaffEventsAttendedModel,
  StaffEventsOrganizedModel,
  IndustryKnowhow,
  MOU,
  MOUActivity,
  Certificate,
  HIndex,
  BookChapter,
  StaffCertificationCourse,
  PlacementCompany,
  FeedbackRound,
  Hackathon,
  HackathonRegistration,
  Notification,
  PlacementDrive,
  PlacementFeedback,
  RegisteredStudentPlacement,
  Education,
  applyAssociations,
};

// Add Sequelize constructor if not available via constructor property
import { Sequelize } from 'sequelize';
db.Sequelize = Sequelize;

export {
  sequelize,
  User,
  Role,
  Company,
  SkillRack,
  OnlineCourses,
  StudentDetails,
  NPTELCourse,
  StudentNPTEL,
  Course,
  HackathonEvent,
  Extracurricular,
  Project,
  StudentEducation,
  CompetencyCoding,
  StudentPublication,
  PersonalInformation,
  NonCGPACategory,
  Internship,
  Message,
  Country,
  State,
  District,
  Department,
  City,
  RelationDetails,
  BankDetails,
  EventAttended,
  EventOrganized,
  RecentActivity,
  BulkUploadHistory,
  DownloadHistory,
  Scholarship,
  StudentLeave,
  Achievement,
  Marksheet,
  StudentNonCGPA,
  StaffDetails,
  Activity,
  TlpActivity,
  ProjectMentor,
  PatentProduct,
  FundedProject,
  FundedProjectPayment,
  ConsultancyProposal,
  Recognition,
  ResourcePerson,
  SeedMoney,
  Scholar,
  StaffEventAttended,
  StaffEventsAttendedModel,
  StaffEventsOrganizedModel,
  IndustryKnowhow,
  MOU,
  MOUActivity,
  Certificate,
  HIndex,
  BookChapter,
  StaffCertificationCourse,
  PlacementCompany,
  FeedbackRound,
  Hackathon,
  HackathonRegistration,
  Notification,
  PlacementDrive,
  PlacementFeedback,
  RegisteredStudentPlacement,
  Education,
  applyAssociations,
};

export default db;