import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Company = sequelize.define('PlacementCompany', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    companyName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    ceo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    package: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    objective: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    skillSets: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const value = this.getDataValue('skillSets');
            return value ? JSON.parse(value) : [];
        },
        set(value) {
            this.setDataValue('skillSets', JSON.stringify(value));
        }
    },
    localBranches: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const value = this.getDataValue('localBranches');
            return value ? JSON.parse(value) : [];
        },
        set(value) {
            this.setDataValue('localBranches', JSON.stringify(value));
        }
    },
    roles: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const value = this.getDataValue('roles');
            return value ? JSON.parse(value) : [];
        },
        set(value) {
            this.setDataValue('roles', JSON.stringify(value));
        }
    },
    Created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    Updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'placement_company',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Company;
