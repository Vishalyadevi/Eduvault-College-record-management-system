import { PlacementCompany as Company } from '../../models/index.js';

const getUserId = (req) => {
    return req.user?.Userid || req.user?.dataValues?.Userid || req.user?.id;
};

// GET all companies
export const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.findAll({
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            companies: companies
        });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching companies',
            error: error.message
        });
    }
};

// GET single company by name
export const getCompanyByName = async (req, res) => {
    try {
        const { companyName } = req.params;
        const company = await Company.findOne({
            where: { companyName }
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        res.status(200).json({
            success: true,
            company: company
        });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching company',
            error: error.message
        });
    }
};

// POST create new company
export const addCompany = async (req, res) => {
    try {
        const userId = getUserId(req);
        const {
            companyName,
            description,
            ceo,
            location,
            package: packageValue,
            objective,
            skillSets,
            localBranches,
            roles
        } = req.body;

        const company = await Company.create({
            companyName,
            description,
            ceo,
            location,
            package: parseFloat(packageValue),
            objective,
            skillSets,
            localBranches,
            roles,
            Created_by: userId
        });

        res.status(201).json({
            success: true,
            message: 'Company added successfully',
            companyId: company.id
        });
    } catch (error) {
        console.error('Error adding company:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                message: 'Company with this name already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error adding company',
            error: error.message
        });
    }
};

// PUT update company
export const updateCompany = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { companyName } = req.params;
        const {
            description,
            ceo,
            location,
            package: packageValue,
            objective,
            skillSets,
            localBranches,
            roles
        } = req.body;

        const company = await Company.findOne({ where: { companyName } });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        await company.update({
            description,
            ceo,
            location,
            package: parseFloat(packageValue),
            objective,
            skillSets,
            localBranches,
            roles,
            Updated_by: userId
        });

        res.status(200).json({
            success: true,
            message: 'Company updated successfully'
        });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating company',
            error: error.message
        });
    }
};

// DELETE company
export const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await Company.findByPk(id);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        await company.destroy();

        res.status(200).json({
            success: true,
            message: 'Company deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting company',
            error: error.message
        });
    }
};
