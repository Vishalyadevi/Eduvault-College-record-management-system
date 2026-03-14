import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const ConsultancyProposal = sequelize.define(
    'ConsultancyProposal',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        // FK to users.Userid — matches DB convention for all staff models
        Userid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'Userid',
            },
        },
        pi_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        co_pi_names: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        project_title: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        industry: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        from_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        to_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        amount_received: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        organization_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        // Files stored as BLOBs (matching existing DB schema)
        proof: {
            type: DataTypes.BLOB('long'),
            allowNull: true,
        },
        yearly_report: {
            type: DataTypes.BLOB('long'),
            allowNull: true,
        },
        order_copy: {
            type: DataTypes.BLOB('long'),
            allowNull: true,
        },
        final_report: {
            type: DataTypes.BLOB('long'),
            allowNull: true,
        },
    },
    {
        tableName: 'consultancy_proposals',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default ConsultancyProposal;
