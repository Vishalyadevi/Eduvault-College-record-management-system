import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Hackathon = sequelize.define('Hackathon', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    contest_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contest_link: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isUrl: true
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    host_by: {
        type: DataTypes.STRING,
        allowNull: false
    },
    eligibility_year: {
        type: DataTypes.STRING,
        allowNull: false
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false
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
    tableName: 'hackathons',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Hackathon;
