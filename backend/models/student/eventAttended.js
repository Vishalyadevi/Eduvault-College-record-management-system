import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const EventAttended = sequelize.define(
  'EventAttended',
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
    event_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    event_type: {
      type: DataTypes.ENUM('Inter College Event', 'State', 'National', 'International', 'Industry'),
      allowNull: false,
    },
    type_of_event: {
      type: DataTypes.ENUM('Competition', 'Hackathon', 'Ideation', 'Seminar', 'Webinar', 'Other'),
      allowNull: false,
    },
    other_event_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    institution_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    mode: {
      type: DataTypes.ENUM('Online', 'Offline'),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    district: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    event_state: {
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
    team_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    team_members: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    participation_status: {
      type: DataTypes.ENUM('Participation', 'Achievement'),
      allowNull: false,
    },
    is_other_state_event: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_other_country_event: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_nirf_ranked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_certificate_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    certificate_file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    achievement_details: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        is_certificate_available: false,
        certificate_file: null,
        is_cash_prize: false,
        cash_prize_amount: '',
        cash_prize_proof: null,
        is_memento: false,
        memento_proof: null,
      },
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
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    messages: {
      type: DataTypes.JSON,
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
    tableName: 'event_attended',
    timestamps: true,
    underscored: true,
  }
);

export default EventAttended;