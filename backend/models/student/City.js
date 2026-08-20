import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';
import District from './District.js';

const City = sequelize.define('City', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  districtID: { type: DataTypes.INTEGER, allowNull: false, references: { model: District, key: 'id' } },
}, { timestamps: false, tableName: 'cities' });

export default City;