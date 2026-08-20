// models/studentGrade.js
export default(sequelize, DataTypes) => {
  const validGrades = ['S', 'O', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'U'];

  const StudentGrade = sequelize.define('StudentGrade', {
    gradeId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    regno: { type: DataTypes.STRING(50), allowNull: false },
    courseCode: { type: DataTypes.STRING(20), allowNull: false },
    grade: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isValidGrade(value) {
          const validGrades = ['S', 'O', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'U'];
          if (!validGrades.includes(value) && isNaN(parseFloat(value))) {
            throw new Error('Invalid grade value: must be a standard letter grade or numeric value');
          }
        }
      }
    },
  }, {
    tableName: 'StudentGrade',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['regno', 'courseCode'],
        name: 'uq_student_grade_regno_course_code'
      }
    ]
  });

  StudentGrade.associate = (models) => {
    StudentGrade.belongsTo(models.StudentDetails, { foreignKey: 'regno' , targetKey: 'registerNumber'});
    StudentGrade.belongsTo(models.Course, {
      foreignKey: 'courseCode',
      targetKey: 'courseCode',
      constraints: false
    });
    StudentGrade.belongsTo(models.GradePoint, { foreignKey: 'grade', targetKey: 'grade' });
  };

  return StudentGrade;
};
