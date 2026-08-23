import { DataTypes } from 'sequelize';

const StaffDetails = (sequelize) => {
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
        Userid: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'userId' },
            comment: 'Reference to user table ID',
        },

        // ── Basic Information ──────────────────────────────────────────
        salutation: { type: DataTypes.STRING(10), allowNull: true },
        firstName: { type: DataTypes.STRING(50), allowNull: true },
        middleName: { type: DataTypes.STRING(50), allowNull: true },
        lastName: { type: DataTypes.STRING(50), allowNull: true },
        gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: true, defaultValue: 'Other' },
        dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true, field: 'DOB' },
        bloodGroup: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'), allowNull: true },
        maritalStatus: { type: DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'), allowNull: true },
        weddingDate: { type: DataTypes.DATEONLY, allowNull: true },
        profilePhoto: { type: DataTypes.STRING(500), allowNull: true, field: 'photo' },

        // ── Contact Information ────────────────────────────────────────
        personalEmail: { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true } },
        officialEmail: { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true }, field: 'employeeMail' },
        mobileNumber: { type: DataTypes.STRING(15), allowNull: true },
        alternateMobile: { type: DataTypes.STRING(15), allowNull: true },
        emergencyContactName: { type: DataTypes.STRING(100), allowNull: true },
        emergencyContactNumber: { type: DataTypes.STRING(15), allowNull: true },
        emergencyContactRelationship: { type: DataTypes.STRING(50), allowNull: true },

        // ── Current Address ────────────────────────────────────────────
        currentAddressLine1: { type: DataTypes.STRING(150), allowNull: true },
        currentAddressLine2: { type: DataTypes.STRING(150), allowNull: true },
        currentCity: { type: DataTypes.STRING(100), allowNull: true },
        currentState: { type: DataTypes.STRING(100), allowNull: true },
        currentPincode: { type: DataTypes.STRING(10), allowNull: true },
        currentCountry: { type: DataTypes.STRING(100), allowNull: true, defaultValue: 'India' },

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
            allowNull: true,
            defaultValue: 1,
            // references: { model: 'departments', key: 'departmentId' },
        },

        designationId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
            // references: { model: 'designations', key: 'designationId' },
        },

        designation: {
            type: DataTypes.STRING(150),
            allowNull: true,
            comment: 'Staff typed designation',
        },

        employeeGradeId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // references: { model: 'employee_grades', key: 'employeeGradeId' },
        },

        dateOfJoining: { type: DataTypes.DATEONLY, allowNull: true, field: 'DOJ' },
        confirmationDate: { type: DataTypes.DATEONLY, allowNull: true },
        probationPeriod: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0, comment: 'in months' },

        reportingManagerId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // references: { model: 'staff_details', key: 'staffId' },
            field: 'reportsTo',
        },

        workLocation: { type: DataTypes.STRING(100), allowNull: true },

        employmentStatus: {
            type: DataTypes.ENUM('Active', 'Resigned', 'Terminated', 'On Leave', 'Retired', 'Notice Period'),
            allowNull: true,
            defaultValue: 'Active'
        },

        // ── Shift & Attendance ─────────────────────────────────────────
        shiftTypeId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // references: { model: 'shift_types', key: 'shiftTypeId' },
        },

        leavePolicyId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // references: { model: 'leave_policies', key: 'leavePolicyId' },
        },

        isOvertimeApplicable: { type: DataTypes.BOOLEAN, defaultValue: false },
        remainingPermissionHours: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },

        // ── Fellowship Details ─────────────────────────────────────────
        hasFellowship: { type: DataTypes.STRING(10), allowNull: true, defaultValue: 'No' },
        fellowshipName: { type: DataTypes.STRING(255), allowNull: true },
        fellowshipAgency: { type: DataTypes.STRING(255), allowNull: true },
        fellowshipAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
        fellowshipDuration: { type: DataTypes.STRING(100), allowNull: true },
        fellowshipDetails: { type: DataTypes.TEXT, allowNull: true },

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
        // busId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'buses', key: 'busId' } },
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
            // references: { model: 'staff_details', key: 'staffId' },
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
            // references: { model: 'users', key: 'userId' },
            onDelete: 'SET NULL',
        },

        updatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // references: { model: 'users', key: 'userId' },
            onDelete: 'SET NULL',
        },

    }, {
        tableName: 'staff_details',
        timestamps: true,
        paranoid: true,

        hooks: {
            beforeValidate: (employee) => {
                if (employee.dateOfBirth && !employee.dateOfRetirement) {
                    const dob = new Date(employee.dateOfBirth);
                    if (!isNaN(dob.getTime())) {
                        const retirementAge = 58;
                        const retirement = new Date(dob);
                        retirement.setFullYear(dob.getFullYear() + retirementAge);
                        if (!isNaN(retirement.getTime())) {
                            employee.dateOfRetirement = retirement.toISOString().split('T')[0];
                        }
                    }
                }
            }
        }
    });
    return Employee;
};

export default StaffDetails;

