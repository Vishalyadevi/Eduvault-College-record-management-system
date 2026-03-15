import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';
import State from './State.js';

const District = sequelize.define('District', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  stateID: { type: DataTypes.INTEGER, allowNull: false, references: { model: State, key: 'id' } },
}, { timestamps: false, tableName: 'districts' });

export default District;