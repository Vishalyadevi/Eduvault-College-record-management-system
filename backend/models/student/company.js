// models/company.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Company = sequelize.define('Company', {
    companyId: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    companyName: { type: DataTypes.STRING(150), allowNull: false },
    // NOTE: Avoid inline UNIQUE here to prevent repeated ALTER ... UNIQUE
    // creating duplicate indexes during sequelize.sync({ alter: true }).
    // Use named indexes (below) for stable constraint management.
    companyAcr: { type: DataTypes.STRING(20), allowNull: false },
    logo: { type: DataTypes.STRING(500), allowNull: true },
    registrationNumber: { type: DataTypes.STRING(50), allowNull: true },
    pan: { type: DataTypes.STRING(10), allowNull: true },
    gst: { type: DataTypes.STRING(15), allowNull: true },
    tin: { type: DataTypes.STRING(20), allowNull: true },
    phone: { type: DataTypes.STRING(15), allowNull: true },
    email: { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true } },
    website: { type: DataTypes.STRING(255), allowNull: true },
    addresses: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    bankName: { type: DataTypes.STRING(100), allowNull: true },
    bankAccountNumber: { type: DataTypes.STRING(50), allowNull: true },
    bankIfscCode: { type: DataTypes.STRING(11), allowNull: true },
    financialYearStart: { type: DataTypes.DATEONLY, allowNull: true },
    financialYearEnd: { type: DataTypes.DATEONLY, allowNull: true },
    permissionHoursPerMonth: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'), defaultValue: 'Active' },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    tableName: 'companies',
    timestamps: true,
    paranoid: true,
    indexes: [
      { name: 'uq_companies_companyAcr', unique: true, fields: ['companyAcr'] },
      { name: 'uq_companies_registrationNumber', unique: true, fields: ['registrationNumber'] },
      { name: 'uq_companies_pan', unique: true, fields: ['pan'] },
      { name: 'uq_companies_gst', unique: true, fields: ['gst'] },
    ]
  });

  Company.associate = (models) => {
    Company.hasMany(models.Employee, { foreignKey: 'companyId', as: 'employees' });
    Company.hasMany(models.Department, { foreignKey: 'companyId', as: 'departments' });
  };

 export default Company;
