import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Country = sequelize.define('Country', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
}, { timestamps: false, tableName: 'countries' });

export default Country;