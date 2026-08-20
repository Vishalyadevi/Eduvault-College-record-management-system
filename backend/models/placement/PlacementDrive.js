import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const PlacementDrive = sequelize.define('PlacementDrive', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    company_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    batch: {
        type: DataTypes.STRING,
        allowNull: true
    },
    departments: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tenth_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    twelfth_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    cgpa: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true
    },
    history_of_arrears: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    standing_arrears: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    drive_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    drive_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    venue: {
        type: DataTypes.STRING,
        allowNull: true
    },
    salary: {
        type: DataTypes.STRING,
        allowNull: true
    },
    roles: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    Created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    Updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'upcomingdrives_placement',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default PlacementDrive;
