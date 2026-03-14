import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const StaffEventAttended = sequelize.define(
  'StaffEventAttended',
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
        model: 'users',
        key: 'Userid',
      },
      onDelete: 'CASCADE',
    },
    programme_name: {
      type: DataTypes.ENUM(
        'FDP',
        'Workshop',
        'Seminar',
        'STTP',
        'Industry Know How',
        'Conference',
        'Symposium',
        'Training Program',
        'Webinar'
      ),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    from_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    to_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    mode: {
      type: DataTypes.ENUM('Online', 'Offline', 'Hybrid'),
      allowNull: false,
    },
    organized_by: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    participants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    financial_support: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    support_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    permission_letter_link: {
      type: DataTypes.BLOB('long'),
      allowNull: true,
    },
    certificate_link: {
      type: DataTypes.BLOB('long'),
      allowNull: true,
    },
    financial_proof_link: {
      type: DataTypes.BLOB('long'),
      allowNull: true,
    },
    programme_report_link: {
      type: DataTypes.BLOB('long'),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending',
    },
    Approved_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'Userid',
      },
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    Created_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'Userid',
      },
      allowNull: false,
    },
    Updated_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'Userid',
      },
      allowNull: true,
    },
  },
  {
    tableName: 'staff_events_attended',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['Userid'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['from_date'],
      },
    ],
  }
);

export default StaffEventAttended;