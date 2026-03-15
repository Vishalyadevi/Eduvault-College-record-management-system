import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';
import EventAttended from './eventAttended.js';

const TeamMember = sequelize.define(
  'TeamMember',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Ensure this matches the table name
        key: 'Userid',  // Ensure this matches the column name in the `users` table
      },
      onDelete: 'CASCADE',
    },
    event_id: {
      type: DataTypes.INTEGER,
      references: { model: EventAttended, key: 'id' },
      allowNull: false,
      onDelete: 'CASCADE',
    },
    reg_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'team_members',
    timestamps: false,
    underscored: true,
  }
);

export default TeamMember;