import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const HackathonRegistration = sequelize.define('HackathonRegistration', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    registerNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,

    },
    hackathon_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    registered: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    attempted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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
    tableName: 'hackathon_registrations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default HackathonRegistration;
