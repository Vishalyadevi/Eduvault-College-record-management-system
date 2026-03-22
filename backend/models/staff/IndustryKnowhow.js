import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const IndustryKnowhow = sequelize.define('IndustryKnowhow', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Userid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'userid',
        references: { model: 'users', key: 'userId' },
        onDelete: 'CASCADE',
    },
    internship_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    company: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    outcomes: {
        type: DataTypes.TEXT,
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
    venue: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    participants: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    financial_support: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    support_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    certificate_link: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    certificate_pdf: {
        type: DataTypes.BLOB('long'),
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: true,
    tableName: 'industry_knowhow',
});

export default IndustryKnowhow;
