import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const ResourcePerson = sequelize.define(
    'ResourcePerson',
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
        program_specification: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        venue: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        event_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        proof_link: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        photo_link: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    },
    {
        tableName: 'resource_person',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default ResourcePerson;
