import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const ConferenceDetail = sequelize.define('ConferenceDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'Userid',
    },
    onDelete: 'CASCADE',
  },
  faculty_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  conference_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  title_of_paper: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  authors_list: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  venue: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  conference_type: {
    type: DataTypes.ENUM('National', 'International'),
    allowNull: false,
    defaultValue: 'National',
  },
  indexing: {
    type: DataTypes.ENUM('Scopus', 'IEEE', 'UGC Care', 'SCI', 'Scopus Indexed', 'Others'),
    allowNull: false,
    defaultValue: 'Scopus',
  },
  page_no: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  month_year: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  certificate_link: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
  },
  doi: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  citations_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  Created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  Updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  Approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  timestamps: true,
  tableName: 'conference_details',
});

export default ConferenceDetail;
