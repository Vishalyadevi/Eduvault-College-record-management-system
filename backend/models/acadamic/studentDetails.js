import StudentDetails from '../student/StudentDetails.js';

export default (sequelize) => {
  // Extend associations for academic models that include StudentDetails
  // (e.g., StudentCourse, StudentElectiveSelection).
  const existingAssociate = StudentDetails.associate;
  StudentDetails.associate = (models) => {
    if (typeof existingAssociate === 'function') existingAssociate(models);

    if (models.StudentCourse) {
      StudentDetails.hasMany(models.StudentCourse, {
        foreignKey: 'regno',
        sourceKey: 'registerNumber'
      });
    }

    if (models.StudentElectiveSelection) {
      StudentDetails.hasMany(models.StudentElectiveSelection, {
        foreignKey: 'regno',
        sourceKey: 'registerNumber'
      });
    }
  };

  // Returns the unified model from the main student folder
  return StudentDetails;
};

