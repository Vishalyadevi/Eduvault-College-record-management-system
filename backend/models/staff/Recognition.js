import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Recognition = sequelize.define(
    'Recognition',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        Userid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'Userid',
            },
        },
        category: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        program_name: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        recognition_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        proof_link: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: 'recognition_appreciation',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default Recognition;
