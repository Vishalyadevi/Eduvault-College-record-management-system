import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const BookChapter = sequelize.define('BookChapter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'userid',
    references: {
      model: 'users',
      key: 'userId',
    },
    onDelete: 'CASCADE',
  },

  publication_type: {
    type: DataTypes.ENUM('journal', 'book_chapter', 'conference'),
    allowNull: false,
    defaultValue: 'book_chapter',
  },

  publication_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  publication_title: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },

  authors: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of author names',
  },

  index_type: {
    type: DataTypes.ENUM(
      'Scopus',
      'SCI',
      'SCIE',
      'SSCI',
      'A&HCI',
      'ESCI',
      'UGC CARE',
      'Other'
    ),
    allowNull: false,
  },

  doi: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  citations: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },

  publisher: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  page_no: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  publication_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  impact_factor: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },

  publication_link: {
    type: DataTypes.STRING(2048),
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
  tableName: 'book_chapters',
});

export default BookChapter;
