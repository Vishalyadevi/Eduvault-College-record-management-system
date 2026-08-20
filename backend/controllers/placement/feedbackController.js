import { PlacementFeedback, FeedbackRound, User, StudentDetails, sequelize } from '../../models/index.js';
import { Op } from 'sequelize';
import PDFDocument from 'pdfkit';

// POST: Submit new feedback
export const submitFeedback = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            registerNumber,
            student_name,
            course_branch,
            batch_year,
            company_name,
            industry_sector,
            job_role,
            work_location,
            ctc_fixed,
            ctc_variable,
            ctc_bonus,
            ctc_total,
            drive_mode,
            eligibility_criteria,
            total_rounds,
            overall_difficulty,
            online_test_platform,
            test_sections,
            test_questions_count,
            test_duration,
            memory_based_questions,
            coding_links,
            technical_questions,
            hr_questions,
            tips_suggestions,
            company_expectations,
            final_outcome,
            process_difficulty_rating,
            company_communication_rating,
            overall_experience_rating,
            show_name_publicly,
            rounds
        } = req.body;

        if (!registerNumber || !course_branch || !batch_year) {
            return res.status(400).json({ success: false, message: 'Required fields are missing' });
        }

        // Identify student
        let studentId = req.user?.userId || req.user?.Userid;
        if (!studentId && registerNumber) {
            const student = await StudentDetails.findOne({ where: { registerNumber } });
            if (student) studentId = student.Userid;
        }

        if (!studentId) {
            return res.status(400).json({ message: 'Unable to identify student.' });
        }

        const questionFiles = req.files ? req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            path: file.path
        })) : [];

        let codingLinksArray = [];
        if (coding_links) {
            try {
                codingLinksArray = typeof coding_links === 'string' ? JSON.parse(coding_links) : coding_links;
            } catch (e) {
                codingLinksArray = [];
            }
        }

        const feedback = await PlacementFeedback.create({
            student_id: studentId,
            registerNumber,
            student_name: (show_name_publicly === 'true' || show_name_publicly === true) ? student_name : null,
            course_branch,
            batch_year,
            company_name: company_name || null,
            industry_sector: industry_sector || null,
            job_role: job_role || null,
            work_location: work_location || null,
            ctc_fixed: ctc_fixed || null,
            ctc_variable: ctc_variable || null,
            ctc_bonus: ctc_bonus || null,
            ctc_total: ctc_total || null,
            drive_mode: drive_mode || null,
            eligibility_criteria: eligibility_criteria || null,
            total_rounds: total_rounds || null,
            overall_difficulty: overall_difficulty || null,
            online_test_platform: online_test_platform || null,
            test_sections: test_sections || null,
            test_questions_count: test_questions_count || null,
            test_duration: test_duration || null,
            memory_based_questions: memory_based_questions || null,
            coding_problems_links: codingLinksArray,
            technical_questions: technical_questions || null,
            hr_questions: hr_questions || null,
            tips_suggestions: tips_suggestions || null,
            company_expectations: company_expectations || null,
            final_outcome: final_outcome || null,
            process_difficulty_rating: process_difficulty_rating || null,
            company_communication_rating: company_communication_rating || null,
            overall_experience_rating: overall_experience_rating || null,
            show_name_publicly: (show_name_publicly === 'true' || show_name_publicly === true),
            question_files: questionFiles
        }, { transaction: t });

        if (rounds) {
            const roundsData = typeof rounds === 'string' ? JSON.parse(rounds) : rounds;
            if (Array.isArray(roundsData) && roundsData.length > 0) {
                const roundsToCreate = roundsData.map(r => ({
                    feedback_id: feedback.id,
                    round_number: r.round_number,
                    round_type: r.round_type,
                    round_description: r.round_description,
                    difficulty_level: r.difficulty_level
                }));
                await FeedbackRound.bulkCreate(roundsToCreate, { transaction: t });
            }
        }

        await t.commit();
        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully!',
            feedbackId: feedback.id
        });
    } catch (error) {
        await t.rollback();
        console.error('Error submitting feedback:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

// GET: Fetch all placement feedback with filters
export const getAllFeedback = async (req, res) => {
    try {
        const { company, course, batch, outcome, student_name, year, limit = 50, offset = 0 } = req.query;
        let where = {};

        if (company) where.company_name = { [Op.like]: `%${company}%` };
        if (course) where.course_branch = course;
        if (batch || year) {
            const batchVal = batch || year;
            where.batch_year = { [Op.like]: `%${batchVal}%` };
        }
        if (outcome) where.final_outcome = outcome;
        if (student_name) where.student_name = { [Op.like]: `%${student_name}%` };

        const { count, rows } = await PlacementFeedback.findAndCountAll({
            where,
            include: [{ model: FeedbackRound, as: 'rounds' }],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
        });

        const formattedFeedback = rows.map(f => {
            const fJson = f.toJSON();
            return {
                ...fJson,
                display_name: fJson.show_name_publicly ? fJson.student_name : 'Anonymous'
            };
        });

        res.json({
            success: true,
            feedback: formattedFeedback,
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

// GET: Fetch single feedback by ID
export const getFeedbackById = async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await PlacementFeedback.findByPk(id, {
            include: [{ model: FeedbackRound, as: 'rounds' }]
        });

        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found' });
        }

        const fJson = feedback.toJSON();
        const result = {
            ...fJson,
            display_name: fJson.show_name_publicly ? fJson.student_name : 'Anonymous'
        };

        res.json({ success: true, feedback: result });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

// Generate PDF for feedback
export const generateFeedbackPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await PlacementFeedback.findByPk(id, {
            include: [{ model: FeedbackRound, as: 'rounds' }]
        });

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        const fb = feedback.toJSON();
        const displayName = fb.show_name_publicly ? fb.student_name : 'Anonymous';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=placement_feedback_${id}.pdf`);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);

        // PDF Content Generation (matching legacy style)
        doc.fontSize(20).font('Helvetica-Bold').text('Placement Feedback Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).font('Helvetica').text(`${fb.company_name || 'N/A'} - ${displayName}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(14).font('Helvetica-Bold').text('Student Information');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Name: ${displayName}`);
        doc.text(`Roll Number: ${fb.registerNumber}`);
        doc.text(`Department: ${fb.course_branch}`);
        doc.text(`Batch Year: ${fb.batch_year}`);
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('Company Information');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Company: ${fb.company_name || 'N/A'}`);
        doc.text(`Job Role: ${fb.job_role || 'N/A'}`);
        doc.text(`Industry: ${fb.industry_sector || 'N/A'}`);
        doc.text(`Location: ${fb.work_location || 'N/A'}`);
        doc.text(`Total CTC: ${fb.ctc_total ? `₹${fb.ctc_total} LPA` : 'N/A'}`);
        doc.text(`Final Outcome: ${fb.final_outcome || 'N/A'}`);
        doc.moveDown();

        if (fb.rounds && fb.rounds.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('Interview Rounds');
            doc.moveDown(0.5);
            fb.rounds.forEach(round => {
                doc.fontSize(12).font('Helvetica-Bold').text(`Round ${round.round_number}: ${round.round_type}`);
                doc.fontSize(11).font('Helvetica').text(`Difficulty: ${round.difficulty_level || 'N/A'}`);
                if (round.round_description) {
                    doc.text(round.round_description, { align: 'justify' });
                }
                doc.moveDown(0.5);
            });
        }

        if (fb.technical_questions) {
            doc.fontSize(14).font('Helvetica-Bold').text('Technical Questions');
            doc.moveDown(0.5);
            doc.fontSize(11).font('Helvetica').text(fb.technical_questions, { align: 'justify' });
            doc.moveDown();
        }

        if (fb.hr_questions) {
            doc.fontSize(14).font('Helvetica-Bold').text('HR Questions');
            doc.moveDown(0.5);
            doc.fontSize(11).font('Helvetica').text(fb.hr_questions, { align: 'justify' });
            doc.moveDown();
        }

        doc.fontSize(14).font('Helvetica-Bold').text('Ratings');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        const renderStars = (rating) => '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0));
        doc.text(`Process Difficulty: ${renderStars(fb.process_difficulty_rating)}`);
        doc.text(`Company Communication: ${renderStars(fb.company_communication_rating)}`);
        doc.text(`Overall Experience: ${renderStars(fb.overall_experience_rating)}`);

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating PDF', error: error.message });
        }
    }
};

// Generate Bulk PDF for feedback with filters
export const generateBulkFeedbackPDF = async (req, res) => {
    try {
        const { company, course, batch, outcome, student_name, year } = req.query;
        let where = {};

        const isValid = (val) => val && val !== 'undefined' && val !== 'null' && val !== '' && val !== 'All';

        if (isValid(company)) where.company_name = { [Op.like]: `%${company}%` };
        if (isValid(course)) where.course_branch = course;
        if (isValid(batch) || isValid(year)) {
            const batchVal = (isValid(batch) ? batch : year);
            where.batch_year = { [Op.like]: `%${batchVal}%` };
        }
        if (isValid(outcome)) where.final_outcome = outcome;
        if (isValid(student_name)) where.student_name = { [Op.like]: `%${student_name}%` };

        const results = await PlacementFeedback.findAll({
            where,
            include: [{ model: FeedbackRound, as: 'rounds' }],
            order: [['created_at', 'DESC']]
        });

        if (results.length === 0) {
            return res.status(404).json({ message: 'No feedback records found for the given filters' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=placement_feedback_report_${new Date().toISOString().split('T')[0]}.pdf`);

        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
        doc.pipe(res);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Placement Feedback Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Total Records: ${results.length}`, { align: 'center' });
        doc.moveDown(2);

        results.forEach((feedback, index) => {
            const fb = feedback.toJSON();
            const displayName = fb.show_name_publicly ? fb.student_name : 'Anonymous';

            if (index > 0) doc.addPage();

            doc.fontSize(16).font('Helvetica-Bold').text(`${fb.company_name || 'N/A'} - ${displayName}`, { underline: true });
            doc.moveDown();

            doc.fontSize(12).font('Helvetica-Bold').text('Student Information');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica');
            doc.text(`Name: ${displayName}`);
            doc.text(`Roll Number: ${fb.registerNumber}`);
            doc.text(`Department: ${fb.course_branch}`);
            doc.text(`Batch Year: ${fb.batch_year}`);
            doc.moveDown();

            doc.fontSize(12).font('Helvetica-Bold').text('Company Information');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica');
            doc.text(`Company: ${fb.company_name || 'N/A'}`);
            doc.text(`Job Role: ${fb.job_role || 'N/A'}`);
            doc.text(`Industry: ${fb.industry_sector || 'N/A'}`);
            doc.text(`Location: ${fb.work_location || 'N/A'}`);
            doc.text(`Total CTC: ${fb.ctc_total ? `₹${fb.ctc_total} LPA` : 'N/A'}`);
            doc.text(`Final Outcome: ${fb.final_outcome || 'N/A'}`);
            doc.moveDown();

            if (fb.rounds && fb.rounds.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold').text('Interview Rounds');
                doc.moveDown(0.5);
                fb.rounds.forEach(round => {
                    doc.fontSize(11).font('Helvetica-Bold').text(`Round ${round.round_number}: ${round.round_type}`);
                    doc.fontSize(10).font('Helvetica').text(`Difficulty: ${round.difficulty_level || 'N/A'}`);
                    if (round.round_description) {
                        doc.text(round.round_description, { align: 'justify' });
                    }
                    doc.moveDown(0.5);
                });
            }

            if (fb.technical_questions) {
                doc.fontSize(12).font('Helvetica-Bold').text('Technical Questions');
                doc.moveDown(0.5);
                doc.fontSize(10).font('Helvetica').text(fb.technical_questions, { align: 'justify' });
                doc.moveDown();
            }

            if (fb.hr_questions) {
                doc.fontSize(12).font('Helvetica-Bold').text('HR Questions');
                doc.moveDown(0.5);
                doc.fontSize(10).font('Helvetica').text(fb.hr_questions, { align: 'justify' });
                doc.moveDown();
            }

            doc.fontSize(12).font('Helvetica-Bold').text('Ratings');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica');
            const renderStars = (rating) => '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0));
            doc.text(`Process Difficulty: ${renderStars(fb.process_difficulty_rating)}`);
            doc.text(`Company Communication: ${renderStars(fb.company_communication_rating)}`);
            doc.text(`Overall Experience: ${renderStars(fb.overall_experience_rating)}`);
            doc.moveDown(2);

            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error('Error generating bulk PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating PDF', error: error.message });
        }
    }
};
