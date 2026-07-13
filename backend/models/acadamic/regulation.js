// models/regulation.js
export default  (sequelize, DataTypes) => {
  const Regulation = sequelize.define('Regulation', {
    regulationId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    departmentId: { type: DataTypes.INTEGER, allowNull: false },
    degree: { type: DataTypes.ENUM('BE', 'BTech', 'ME', 'MTech'), allowNull: false, defaultValue: 'BE' },
    regulationYear: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.ENUM('YES', 'NO'), defaultValue: 'YES' },
    createdBy: { type: DataTypes.STRING(150) },
    updatedBy: { type: DataTypes.STRING(150) },
  }, {
    tableName: 'Regulation',
    timestamps: true,
    createdAt: 'createdDate',
    updatedAt: 'updatedDate',
    indexes: [
      {
        unique: true,
        name: 'uq_regulation_dept_degree_year',
        fields: ['departmentId', 'degree', 'regulationYear'],
      }
    ]
  });

  Regulation.associate = (models) => {
    Regulation.belongsTo(models.Department, { foreignKey: 'departmentId' });
    Regulation.hasMany(models.Batch, { foreignKey: 'regulationId' });
    Regulation.hasMany(models.RegulationCourse, { foreignKey: 'regulationId' });
    Regulation.hasMany(models.Vertical, { foreignKey: 'regulationId' });
  };

  return Regulation;
};
