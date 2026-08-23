import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const ConsultancyCoPI = sequelize.define(
    'ConsultancyCoPI',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        consultancy_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'consultancy_proposals',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        Userid: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'Userid',
            },
        },
    },
    {
        tableName: 'consultancy_co_pis',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default ConsultancyCoPI;
