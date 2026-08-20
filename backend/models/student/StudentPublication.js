// models/StudentPublication.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const StudentPublication = sequelize.define('StudentPublication', {
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

  // ========================
  // 📄 PUBLICATION DETAILS
  // ========================
  publication_type: {
    type: DataTypes.ENUM(
      'Journal',
      'Conference',
      'Book',
      'Book Chapter',
      'Workshop',
      'Thesis',
      'Preprint',
      'White Paper',
      'Patent',
      'Other'
    ),
    allowNull: false,
  },

  publication_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Name of journal, conference, or publisher',
  },

  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },

  authors: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of author names',
  },

  // ========================
  // 🏆 INDEXING DETAILS
  // ========================
  index_type: {
    type: DataTypes.ENUM(
      'Scopus',
      'Web of Science',
      'PubMed',
      'IEEE Xplore',
      'ACM Digital Library',
      'SSRN',
      'Not Indexed',
      'Other'
    ),
    allowNull: true,
  },

  doi: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },

  publisher: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  publication_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // ========================
  // ✅ PUBLICATION STATUS
  // ========================
  publication_status: {
    type: DataTypes.ENUM(
      'Draft',
      'Under Review',
      'Accepted',
      'Published',
      'Rejected',
      'Withdrawn'
    ),
    allowNull: false,
    defaultValue: 'Draft',
  },

  status_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when status was last updated',
  },

  // ========================
  // 🔍 VERIFICATION & APPROVAL
  // ========================
  Created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },

  Updated_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },

  pending: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  tutor_verification_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  Verified_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },

  verified_at: {
    type: DataTypes.DATE,
  },

  verification_comments: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ========================
  // 📆 TIMESTAMPS
  // ========================
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
  tableName: 'student_publications',
});

export default StudentPublication;