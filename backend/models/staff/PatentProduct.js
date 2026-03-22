import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const PatentProduct = sequelize.define('PatentProduct', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Userid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'userid',
        references: {
            model: 'users',
            key: 'userId'
        }
    },
    project_title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    patent_status: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    month_year: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    patent_proof_link: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    },
    working_model: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    working_model_proof_link: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    },
    prototype_developed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    prototype_proof_link: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    }
}, {
    tableName: 'patent_product',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default PatentProduct;
