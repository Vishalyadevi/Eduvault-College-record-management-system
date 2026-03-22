import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Scholar = sequelize.define(
    'Scholar',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
Userid: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Userid',
            references: {
                model: 'users',
                key: 'userId',
            },
        },
        scholar_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        scholar_type: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        institute: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        university: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        domain: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        phd_registered_year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        completed_year: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        publications: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: 'scholars',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default Scholar;
