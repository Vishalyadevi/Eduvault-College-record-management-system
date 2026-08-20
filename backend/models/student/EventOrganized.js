import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js'; // Adjust the path to your Sequelize instance

// Define the EventOrganized model
const EventOrganized = sequelize.define('EventOrganized', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // References the users table
      key: 'Userid',
    },
    onDelete: 'CASCADE',
  },
  event_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  club_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  staff_incharge: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  start_date: { // Changed from date_time_from
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_date: { // Changed from date_time_to
    type: DataTypes.DATE,
    allowNull: false,
  },
  number_of_participants: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mode: {
    type: DataTypes.ENUM('Online', 'Offline'),
    allowNull: false,
  },
  funding_agency: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  funding_amount: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  Created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
    field: 'Created_by',
  },
  Updated_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
    field: 'Updated_by',
  },
  pending: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  tutor_approval_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  Approved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
    field: 'Approved_by',
  },
  approved_at: {
    type: DataTypes.DATE,
  },
  messages: {
    type: DataTypes.JSON,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  tableName: 'events_organized_student', // Table name in the database
});

// Export the EventOrganized model
export default EventOrganized;