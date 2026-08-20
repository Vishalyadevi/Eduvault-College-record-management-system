import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';
import Country from './Country.js';

const State = sequelize.define('State', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  countryID: { type: DataTypes.INTEGER, references: { model: Country, key: 'id' } },
}, { timestamps: false, tableName: 'states' });

export default State;