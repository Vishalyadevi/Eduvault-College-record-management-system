import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const EventResourcePerson = sequelize.define(
    'EventResourcePerson',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        event_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'events_organized',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        person_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        designation: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        organization: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        tableName: 'event_resource_persons',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default EventResourcePerson;
