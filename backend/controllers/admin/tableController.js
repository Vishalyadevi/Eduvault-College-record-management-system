import User from "../../models/User.js";
import StudentDetails from "../../models/student/StudentDetails.js";
import Internship from "../../models/student/Internship.js";
import ExcelJS from "exceljs";
import DownloadHistory from "../../models/student/DownloadHistory.js";

const exportTables = {
    Student: [
        { model: StudentDetails, as: "studentDetails" },
        { model: Internship, as: "internships" },
        { model: User, as: "user" }
    ],
    Staff: [
        { model: User, as: "user" } // Removed StaffDetails
    ]
};

export const getColumns = async (req, res) => {
    try {
        const { role } = req.query;
        if (!role || !exportTables[role]) {
            return res.status(400).json({ error: "Invalid role" });
        }

        let allColumns = [];

        for (const { model, as } of exportTables[role]) {
            const tableColumns = Object.keys(model.getAttributes()).map(col => `${as}_${col}`);
            allColumns.push(...tableColumns);
        }

        allColumns = [...new Set(allColumns)];

        const excludeColumns = [
            "id",
            "_v",
            "created_at",
            "updated_at", "duration_to",
            "Userid",
            "Created_by",
            "Updated_by",
            "pending",
            "tutor_approval_status",
            "Approved_by",
            "approved_at",
            "messages",
            "createdAt",
            "updatedAt", "password"
        ];

        const formattedColumns = allColumns
            .map(col => {
                let cleanCol = col.includes("_") ? col.substring(col.indexOf("_") + 1) : col;
                return { original: col, transformed: cleanCol.replace(/_/g, " ").toUpperCase() };
            })
            .filter(({ original }) => !excludeColumns.includes(original.toLowerCase()))
            .map(({ transformed }) => transformed);

        res.json({ columns: formattedColumns });
    } catch (error) {
        console.error("Error fetching columns:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const exportData = async (req, res) => {
    try {
        const { role, columns } = req.body;

        if (!role || !columns || !Array.isArray(columns) || columns.length === 0) {
            return res.status(400).json({ error: "Invalid request parameters" });
        }

        if (!exportTables[role]) {
            return res.status(400).json({ error: "Invalid role" });
        }

        const users = await User.findAll({
            attributes: ["Userid", "username", "userMail", "userNumber"],
            raw: true,
            nest: true,
        });

        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }


        const finalData = users.map(user => {
            let userData = {
                username: user.username,
                email: user.userMail,
                staffId: user.userNumber || ""
            };

            for (const { as } of exportTables[role]) {
                const tableData = user[as] || {};
                Object.keys(tableData).forEach(col => {
                    if (!["Userid", "created_at", "updated_at", "password"].includes(col)) {
                        userData[`${as}_${col}`] = tableData[col];
                    }
                });
            }

            return userData;
        });

        if (!finalData.length) {
            return res.status(404).json({ error: "No data found" });
        }

        const databaseColumns = Object.keys(finalData[0]);

        const orderedColumns = columns
            .map(header => {
                const formatted = header.replace(/ /g, "_").toLowerCase();
                return databaseColumns.find(col => col.endsWith(`_${formatted}`) || col === formatted) || null;
            })
            .filter(col => col !== null);

        if (orderedColumns.length === 0) {
            return res.status(400).json({ error: "Selected columns not found in data" });
        }

        const formattedHeaders = orderedColumns.map(col => col.replace(/_/g, " ").toUpperCase());

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${role} Data`);

        worksheet.addRow(formattedHeaders);

        finalData.forEach(row => {
            worksheet.addRow(orderedColumns.map(col => row[col] || ""));
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${role.toLowerCase()}_data.xlsx`);

        await workbook.xlsx.write(res);

        await DownloadHistory.create({
            Userid: req.user.Userid,
            filename: `${role}_data.xlsx`,
            role,
        });

        res.end();
    } catch (error) {
        console.error("Error exporting data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};