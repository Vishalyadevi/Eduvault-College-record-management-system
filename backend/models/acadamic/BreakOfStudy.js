export default (sequelize, DataTypes) => {
  const BreakOfStudy = sequelize.define('BreakOfStudy', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'student_details', key: 'studentId' }
    },
    breakStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    expectedRejoiningDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    academicYear: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    semester: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    breakType: {
      type: DataTypes.ENUM('Medical', 'Personal', 'Financial', 'Family Reason', 'Disciplinary', 'Other'),
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    supportingDocument: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    approvalStatus: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending'
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'userId' }
    },
    approvalDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    breakStatus: {
      type: DataTypes.ENUM('On Break', 'Rejoined', 'Cancelled'),
      defaultValue: 'On Break'
    },
    actualRejoiningDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    rejoiningAcademicYear: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    rejoiningSemester: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    rejoiningRemarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rejoiningApprovalDocument: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'userId' }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'userId' }
    }
  }, {
    tableName: 'break_of_study',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  BreakOfStudy.associate = (models) => {
    if (models.StudentDetails) {
      BreakOfStudy.belongsTo(models.StudentDetails, { foreignKey: 'studentId', as: 'student' });
    }
    if (models.User) {
      BreakOfStudy.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
      BreakOfStudy.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      BreakOfStudy.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
    }
  };

  return BreakOfStudy;
};
