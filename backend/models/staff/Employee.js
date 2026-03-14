import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Employee = sequelize.define('Employee', {

    staffId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'staffId',
        comment: 'Primary key for employee/staff'
    },

    // ── Identification & Login ─────────────────────────────────────
    biometricNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        comment: 'Biometric ID / Enrollment Number from device',
    },

    staffNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        references: { model: 'users', key: 'userNumber' },
        comment: 'Reference to user table for login credentials',
    },

    // ── Basic Information ──────────────────────────────────────────
    salutation: { type: DataTypes.STRING(10), allowNull: true },
    firstName: { type: DataTypes.STRING(50), allowNull: false },
    middleName: { type: DataTypes.STRING(50), allowNull: true },
    lastName: { type: DataTypes.STRING(50), allowNull: false },
    gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: false },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false, field: 'DOB' },
    bloodGroup: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'), allowNull: true },
    maritalStatus: { type: DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'), allowNull: true },
    weddingDate: { type: DataTypes.DATEONLY, allowNull: true },
    profilePhoto: { type: DataTypes.STRING(500), allowNull: true, field: 'photo' },

    // ── Contact Information ────────────────────────────────────────
    personalEmail: { type: DataTypes.STRING(150), allowNull: false, validate: { isEmail: true } },
    officialEmail: { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true }, field: 'employeeMail' },
    mobileNumber: { type: DataTypes.STRING(15), allowNull: false },
    alternateMobile: { type: DataTypes.STRING(15), allowNull: true },
    emergencyContactName: { type: DataTypes.STRING(100), allowNull: true },
    emergencyContactNumber: { type: DataTypes.STRING(15), allowNull: true },
    emergencyContactRelationship: { type: DataTypes.STRING(50), allowNull: true },

    // ── Current Address ────────────────────────────────────────────
    currentAddressLine1: { type: DataTypes.STRING(150), allowNull: false },
    currentAddressLine2: { type: DataTypes.STRING(150), allowNull: true },
    currentCity: { type: DataTypes.STRING(100), allowNull: false },
    currentState: { type: DataTypes.STRING(100), allowNull: false },
    currentPincode: { type: DataTypes.STRING(10), allowNull: false },
    currentCountry: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'India' },

    // ── Permanent Address ──────────────────────────────────────────
    permanentAddressLine1: { type: DataTypes.STRING(150), allowNull: true },
    permanentAddressLine2: { type: DataTypes.STRING(150), allowNull: true },
    permanentCity: { type: DataTypes.STRING(100), allowNull: true },
    permanentState: { type: DataTypes.STRING(100), allowNull: true },
    permanentPincode: { type: DataTypes.STRING(10), allowNull: true },
    permanentCountry: { type: DataTypes.STRING(100), allowNull: true },

    // ── Employment Information ─────────────────────────────────────
    departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'departments', key: 'departmentId' },
    },

    // designationId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    //   references: { model: 'designations', key: 'designationId' },
    // },

    // employeeGradeId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: { model: 'employee_grades', key: 'employeeGradeId' },
    // },

    dateOfJoining: { type: DataTypes.DATEONLY, allowNull: false, field: 'DOJ' },
    confirmationDate: { type: DataTypes.DATEONLY, allowNull: true },
    probationPeriod: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0, comment: 'in months' },

    reportingManagerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'staff_details', key: 'staffId' },
        field: 'reportsTo',
    },

    workLocation: { type: DataTypes.STRING(100), allowNull: true },

    employmentStatus: {
        type: DataTypes.ENUM('Active', 'Resigned', 'Terminated', 'On Leave', 'Retired', 'Notice Period'),
        allowNull: false,
        defaultValue: 'Active'
    },

    // // ── Shift & Attendance ─────────────────────────────────────────
    // shiftTypeId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: { model: 'shift_types', key: 'shiftTypeId' },
    // },

    // leavePolicyId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: { model: 'leave_policies', key: 'leavePolicyId' },
    // },

    isOvertimeApplicable: { type: DataTypes.BOOLEAN, defaultValue: false },
    remainingPermissionHours: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },

    // ── Salary & Bank Details ──────────────────────────────────────
    basicSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    costToCompany: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    salaryCurrency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
    paymentMode: { type: DataTypes.ENUM('Bank Transfer', 'Cash', 'Cheque'), defaultValue: 'Bank Transfer' },
    bankName: { type: DataTypes.STRING(100), allowNull: true },
    bankAccountNumber: { type: DataTypes.STRING(50), allowNull: true },
    ifscCode: { type: DataTypes.STRING(11), allowNull: true },
    panNumber: { type: DataTypes.STRING(10), allowNull: true },
    uanNumber: { type: DataTypes.STRING(20), allowNull: true },
    esiNumber: { type: DataTypes.STRING(20), allowNull: true },

    // ── Transport & Hostel ─────────────────────────────────────────
    isTransportRequired: { type: DataTypes.BOOLEAN, defaultValue: false },
    // busId:              { type: DataTypes.INTEGER, allowNull: true, references: { model: 'buses', key: 'busId' } },
    pickupPoint: { type: DataTypes.STRING(150), allowNull: true },

    // ── Documents ──────────────────────────────────────────────────
    aadhaarNumber: { type: DataTypes.STRING(12), allowNull: true },
    passportNumber: { type: DataTypes.STRING(20), allowNull: true },
    drivingLicenseNumber: { type: DataTypes.STRING(20), allowNull: true },
    voterIdNumber: { type: DataTypes.STRING(20), allowNull: true },

    // ── Academic & Research Profiles ───────────────────────────────
    annaUniversityFacultyId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Anna University Faculty ID'
    },

    aicteFacultyId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'AICTE Faculty ID'
    },

    orcid: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'ORCID - Open Researcher and Contributor ID'
    },

    researcherId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'ResearcherID (Web of Science/Publons)'
    },

    googleScholarId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Google Scholar Profile ID'
    },

    scopusProfile: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Scopus Profile URL or ID'
    },

    vidwanProfile: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'VIDWAN Profile URL or ID'
    },

    supervisorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'staff_details', key: 'staffId' },
        comment: 'Academic/Research Supervisor'
    },

    hIndex: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'h-index for research publications'
    },

    citationIndex: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Total citation count'
    },

    // ── Exit Information ───────────────────────────────────────────
    resignationLetterDate: { type: DataTypes.DATEONLY, allowNull: true },
    reasonForResignation: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason provided for resignation'
    },
    relievingDate: { type: DataTypes.DATEONLY, allowNull: true },
    dateOfRetirement: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Auto-calculated based on DOB + retirement age from settings (default 58 years)'
    },
    exitInterviewHeldOn: { type: DataTypes.DATEONLY, allowNull: true },

    // ── Status & Audit ─────────────────────────────────────────────
    status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active'
    },

    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'userId' },
        onDelete: 'SET NULL',
    },

    updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'userId' },
        onDelete: 'SET NULL',
    },

}, {
    tableName: 'staff_details',
    timestamps: true,
    paranoid: true,

    hooks: {
        beforeValidate: (employee) => {
            if (employee.dateOfBirth && !employee.dateOfRetirement) {
                // Auto-calculate retirement date
                // You can make retirementAge configurable from settings
                const retirementAge = 58; // Default, should come from settings
                const dob = new Date(employee.dateOfBirth);
                const retirement = new Date(dob);
                retirement.setFullYear(dob.getFullYear() + retirementAge);
                employee.dateOfRetirement = retirement.toISOString().split('T')[0];
            }
        }
    }
});

export default Employee;