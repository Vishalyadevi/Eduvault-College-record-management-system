import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const PatentInventor = sequelize.define(
    'PatentInventor',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        patent_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'patent_product',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        inventor_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        inventor_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
    },
    {
        tableName: 'patent_inventors',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default PatentInventor;
