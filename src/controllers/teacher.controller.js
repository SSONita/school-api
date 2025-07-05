import db from '../models/index.js';

/**
 * @swagger
 * tags:
 *   - name: Teachers
 *     description: Teacher management
 */

/**
 * @swagger
 * /teachers:
 *   post:
 *     summary: Create a new teacher
 *     tags: [Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, department]
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *               CourseIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs of courses to assign
 *     responses:
 *       201:
 *         description: Teacher created
 */
export const createTeacher = async (req, res) => {
    try {
        const { CourseIds, ...teacherData } = req.body;
        const teacher = await db.Teacher.create(req.body);
        if (Array.isArray(CourseIds) && CourseIds.length > 0) {
            const courses = await db.Course.findAll({
                where: { id: CourseIds },
            });

            await teacher.addCourses(courses); 
        }
        res.status(201).json(teacher);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /teachers:
 *   get:
 *     summary: Get all teachers
 *     tags: [Teachers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *         type: string
 *         enum: [asc, desc]
 *         default: desc
 *         description: Sort by created time (ascending or descending)
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *           enum: [courseId, courses]
 *         description: Include related models (e.g., populate=courseId includes enrolled courses)
 *     responses:
 *       200:
 *         description: List of teachers
 */
export const getAllTeachers = async (req, res) => {
    const sortBy = req.query.sort === 'desc' ? 'desc' : 'asc';
    // take certain amount at a time
    const limit = parseInt(req.query.limit) || 10;
    // which page to take
    const page = parseInt(req.query.page) || 1;

    const total = await db.Course.count();

    const populate = req.query.populate;
    const include = [];

    if (populate) {
        const fields = populate.split(',');
        if (fields.includes('courseId') || fields.includes('courses')) {
            include.push(db.Course);
        }
    }

    try {
        const teachers = await db.Teacher.findAll({ 
            // include: db.Course
            limit: limit, offset: (page - 1) * limit ,
            order: [['id', sortBy]],
            include, 
        });
        res.json({
            meta: {
                totalItems: total,
                page: page,
                totalPages: Math.ceil(total / limit),
            },
            data: teachers,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /teachers/{id}:
 *   get:
 *     summary: Get a teacher by ID
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Teacher found
 *       404:
 *         description: Not found
 */
export const getTeacherById = async (req, res) => {
    try {
        const teacher = await db.Teacher.findByPk(req.params.id, { include: db.Course });
        if (!teacher) return res.status(404).json({ message: 'Not found' });
        res.json(teacher);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /teachers/{id}:
 *   put:
 *     summary: Update a teacher
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, department, coursIds]
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *               courseIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs of courses to assign
 *     responses:
 *       200:
 *         description: Updated
 */
export const updateTeacher = async (req, res) => {
    try {
        const teacher = await db.Teacher.findByPk(req.params.id);
        if (!teacher) return res.status(404).json({ message: 'Not found' });
        await teacher.update(req.body);
        res.json(teacher);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /teachers/{id}:
 *   delete:
 *     summary: Delete a teacher
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */
export const deleteTeacher = async (req, res) => {
    try {
        const teacher = await db.Teacher.findByPk(req.params.id);
        if (!teacher) return res.status(404).json({ message: 'Not found' });
        await teacher.destroy();
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
