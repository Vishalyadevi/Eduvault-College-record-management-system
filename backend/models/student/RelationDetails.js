import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';
import User from '../User.js';

const RelationDetails = sequelize.define('RelationDetails', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },


  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'userId' }
  },


  relationship: {
    type: DataTypes.STRING,  // Change from ENUM to STRING
    allowNull: false,
    validate: {
      isIn: [['Father', 'Mother', 'Sibling', 'Guardian', 'Spouse']] // Restrict allowed values manually
    }
  },

  // Common Fields for All Relations
  relation_name: { type: DataTypes.STRING, allowNull: false },
  relation_income: { type: DataTypes.INTEGER },
  relation_age: { type: DataTypes.INTEGER },
  relation_occupation: { type: DataTypes.STRING },
  relation_qualification: { type: DataTypes.STRING },
  relation_email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  relation_phone: {
    type: DataTypes.STRING,
    allowNull: true,  // ✅ Allow NULL values
    validate: {
      is: {
        args: /^[0-9]*$/, // ✅ Allows empty or numeric values
        msg: "Phone number must contain only digits",
      },
    },
  },

  relation_photo: {
    type: DataTypes.STRING(500),
    defaultValue: '/uploads/default.jpg' // Default photo
  },

  // Created and Updated By (Foreign Key to Users Table)
  Created_by: {
    type: DataTypes.INTEGER,
    references: { model: "users", key: 'userId' },
    field: 'Created_by'
  },
  Updated_by: {
    type: DataTypes.INTEGER,
    references: { model: "users", key: 'userId' },
    field: 'Updated_by'
  },

  // Approval & Status Fields
  pending: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  tutor_approval_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  Approved_by: {
    type: DataTypes.INTEGER,
    references: { model: "users", key: 'userId' },
    field: 'Approved_by'
  },
  approved_at: { type: DataTypes.DATE },
  messages: { type: DataTypes.JSON },

}, {
  timestamps: true,
  tableName: 'relation_details'
});

export default RelationDetails;
