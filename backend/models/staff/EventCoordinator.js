import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const EventCoordinator = sequelize.define(
    'EventCoordinator',
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
        coordinator_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        tableName: 'event_coordinators',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default EventCoordinator;
