import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const MOUDptMapping = sequelize.define(
    'MOUDptMapping',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        mou_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mou',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        department_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        tableName: 'mou_departments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default MOUDptMapping;
