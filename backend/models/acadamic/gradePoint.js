// models/gradePoint.js
export default (sequelize, DataTypes) => {
  const validGrades = ['S', 'O', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'U'];

  const GradePoint = sequelize.define('GradePoint', {
    grade: { 
        type: DataTypes.STRING(10),
        primaryKey: true,
        validate: {
          isValidGrade(value) {
            const validGrades = ['S', 'O', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'U'];
            if (!validGrades.includes(value) && isNaN(parseFloat(value))) {
              throw new Error('Invalid grade value: must be a standard letter grade or numeric value');
            }
          }
        }
    },
    point: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false
    },
  }, { 
    tableName: 'GradePoint', 
    timestamps: false 
  });

  GradePoint.associate = (models) => {
    GradePoint.hasMany(models.StudentGrade, {
      foreignKey: 'grade',
      sourceKey: 'grade'
    });
  };

  return GradePoint;
};
