import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const PlacementFeedback = sequelize.define('PlacementFeedback', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'Userid'
        }
    },
    registerNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,

    },
    student_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    course_branch: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    batch_year: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    company_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    industry_sector: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    job_role: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    work_location: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    ctc_fixed: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    ctc_variable: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    ctc_bonus: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    ctc_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    drive_mode: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    eligibility_criteria: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    total_rounds: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    overall_difficulty: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    online_test_platform: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    test_sections: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    test_questions_count: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    test_duration: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    memory_based_questions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    coding_problems_links: {
        type: DataTypes.JSON,
        allowNull: true
    },
    technical_questions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    hr_questions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tips_suggestions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    company_expectations: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    final_outcome: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    process_difficulty_rating: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    company_communication_rating: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    overall_experience_rating: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    show_name_publicly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    question_files: {
        type: DataTypes.JSON,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'placement_feedback',
    timestamps: true
});

export default PlacementFeedback;
